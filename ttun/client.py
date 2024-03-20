import asyncio
import json
import logging
import os
import sys
from asyncio import get_running_loop
from base64 import b64decode
from base64 import b64encode
from datetime import datetime
from time import perf_counter
from typing import Awaitable
from typing import Callable
from typing import Coroutine
from typing import List
from typing import Optional
from typing import Tuple
from uuid import uuid4

import websockets
from aiohttp import ClientConnectionError
from aiohttp import ClientError
from aiohttp import ClientSession
from aiohttp import DummyCookieJar
from websockets import WebSocketClientProtocol
from websockets.exceptions import ConnectionClosed

from ttun import __version__
from ttun.pubsub import PubSub
from ttun.types import Config
from ttun.types import HttpMessage
from ttun.types import HttpMessageType
from ttun.types import HttpRequestData
from ttun.types import HttpResponseData
from ttun.types import Message
from ttun.types import MessageType
from ttun.types import WebsocketMessage
from ttun.types import WebsocketMessageData
from ttun.types import WebsocketMessageType

logger = logging.getLogger(__name__)
logger.setLevel(os.environ.get("LOGGING_LEVEL", "NOTSET"))


class Client:
    def __init__(
        self,
        port: int,
        server: str,
        subdomain: str = None,
        to: str = "127.0.0.1",
        https: bool = False,
        headers: List[Tuple[str, str]] = None,
    ):
        self.version = __version__
        self.server = server
        self.subdomain = subdomain

        self.config: Optional[Config] = None
        self.connection: WebSocketClientProtocol = None

        self.proxy_origin = f'{"https" if https else "http"}://{to}:{port}'
        self.ws_proxy_origin = f'{"wss" if https else "ws"}://{to}:{port}'

        self.headers = [] if headers is None else headers

        self.websocket_connections = {}

    async def send(self, data: dict):
        await self.connection.send(json.dumps(data))

    async def receive(self) -> dict:
        data = json.loads(await self.connection.recv())
        return data

    @staticmethod
    def loop(sleep: int = None):
        async def wrapper(callback: Callable[[], Coroutine]):
            while True:
                try:
                    await callback()

                    if sleep is not None:
                        await asyncio.sleep(sleep)

                except ConnectionClosed:
                    break

        return wrapper

    async def connect(self) -> WebSocketClientProtocol:
        self.connection = await websockets.connect(f"{self.server}/tunnel/")

        await self.send({"subdomain": self.subdomain, "version": self.version})

        self.config = await self.receive()

        if self.connection.open:
            return self.connection

    def session(self):
        return ClientSession(base_url=self.proxy_origin, cookie_jar=DummyCookieJar())

    async def handle_request(self, message: HttpMessage, session: ClientSession = None):
        if session is None:
            session = self.session()

        request: HttpRequestData = message["payload"]

        request["headers"] = [
            *request["headers"],
            *self.headers,
        ]

        async def response_handler(
            response: HttpResponseData, identifier=message["identifier"]
        ):
            await self.send(
                HttpMessage(
                    type=HttpMessageType.response.value,
                    identifier=identifier,
                    payload=response,
                )
            )

        await self.proxy_request(
            session=session,
            request=request,
            on_response=response_handler,
        )

    async def receive_websocket_message(self, message: str, idenitfier: str):
        message_data = WebsocketMessage(
            identifier=idenitfier,
            type=WebsocketMessageType.message.value,
            payload=WebsocketMessageData(body=b64encode(message.encode()).decode()),
        )
        await self.send(message_data)

        await PubSub.publish(
            {
                "type": "websocket_outbound",
                "payload": {
                    "id": message_data["identifier"],
                    "timestamp": datetime.now().isoformat(),
                    **message_data["payload"],
                },
            }
        )

    async def connect_websocket(self, message: WebsocketMessage):
        assert not message["identifier"] in self.websocket_connections

        start = perf_counter()
        await PubSub.publish(
            {
                "type": "websocket_connect",
                "payload": {
                    "id": message["identifier"],
                    "timestamp": datetime.now().isoformat(),
                    **message["payload"],
                },
            }
        )

        async with websockets.connect(
            f'{self.ws_proxy_origin}/{message["payload"]["path"]}'
        ) as connection:
            end = perf_counter()
            self.websocket_connections[message["identifier"]] = connection

            await self.send(
                WebsocketMessage(
                    identifier=message["identifier"],
                    type=WebsocketMessageType.ack.value,
                    payload=None,
                )
            )

            await PubSub.publish(
                {
                    "type": "websocket_connected",
                    "payload": {
                        "id": message["identifier"],
                        "timing": end - start,
                    },
                }
            )

            async for m in connection:
                await self.receive_websocket_message(m, message["identifier"])

    async def send_websocket_message(self, message: WebsocketMessage):
        assert message["identifier"] in self.websocket_connections
        await self.websocket_connections[message["identifier"]].send(
            b64decode(message["payload"]["body"]).decode()
        )

        await PubSub.publish(
            {
                "type": "websocket_inbound",
                "payload": {
                    "id": message["identifier"],
                    "timestamp": datetime.now().isoformat(),
                    **message["payload"],
                },
            }
        )

    async def disconnect_websocket(self, message: WebsocketMessage):
        assert message["identifier"] in self.websocket_connections

        await self.websocket_connections[message["identifier"]].close()

        self.websocket_connections[message["identifier"]] = None
        await PubSub.publish(
            {
                "type": "websocket_disconnect",
                "payload": {
                    "id": message["identifier"],
                    "timestamp": datetime.now().isoformat(),
                    **message["payload"],
                },
            }
        )

    async def handle_messages(self):
        loop = get_running_loop()
        tasks = set()

        async with self.session() as session:
            while True:
                try:
                    message: Message = await self.receive()
                    logger.debug(message)

                    match MessageType(message["type"]):
                        case MessageType.request:
                            task = loop.create_task(
                                self.handle_request(message, session)
                            )
                        case MessageType.ws_connect:
                            task = loop.create_task(self.connect_websocket(message))
                        case MessageType.ws_message:
                            task = loop.create_task(
                                self.send_websocket_message(message)
                            )
                        case MessageType.ws_disconnect:
                            task = loop.create_task(self.disconnect_websocket(message))
                        case _:
                            logger.debug(message)

                    tasks.add(task)
                    task.add_done_callback(tasks.discard)
                except ValueError:
                    continue
                except ConnectionClosed as e:
                    raise e

        for task in tasks:
            task.cancel()

    async def resend(self, data: HttpRequestData):
        async with self.session() as session:
            await self.proxy_request(session, data)

    async def proxy_request(
        self,
        session: ClientSession,
        request: HttpRequestData,
        on_response: Callable[[HttpResponseData], Awaitable] = None,
    ):
        request_id = str(uuid4())
        await PubSub.publish(
            {
                "type": "request",
                "payload": {
                    "id": request_id,
                    "timestamp": datetime.now().isoformat(),
                    **request,
                },
            }
        )

        start = perf_counter()
        try:
            response = await session.request(
                method=request["method"],
                url=request["path"],
                headers=request["headers"],
                data=b64decode(request["body"].encode()),
                allow_redirects=False,
            )
            end = perf_counter()

            response_data = HttpResponseData(
                status=response.status,
                headers=[
                    (key, value)
                    for key, value in response.headers.items()
                    if key.lower()
                    not in ["transfer-encoding", "content-encoding", "content-length"]
                ],
                body=b64encode(await response.read()).decode(),
            )
        except ClientError as e:
            end = perf_counter()

            response_data = HttpResponseData(
                status=(504 if isinstance(e, ClientConnectionError) else 502),
                headers=[("content-type", "text/plain")],
                body=b64encode(str(e).encode()).decode(),
            )

        if on_response is not None:
            await on_response(response_data)

        await PubSub.publish(
            {
                "type": "response",
                "payload": {
                    "id": request_id,
                    "timing": end - start,
                    **response_data,
                },
            }
        )
