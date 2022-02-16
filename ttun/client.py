import asyncio
import json
from base64 import b64decode
from base64 import b64encode
from datetime import datetime
from time import perf_counter
from typing import Awaitable
from typing import Callable
from typing import Coroutine
from typing import Optional
from uuid import uuid4

import websockets
from aiohttp import ClientSession
from aiohttp import DummyCookieJar
from websockets import WebSocketClientProtocol
from websockets.exceptions import ConnectionClosed

from ttun.pubsub import PubSub
from ttun.types import Config
from ttun.types import RequestData
from ttun.types import ResponseData


class Client:
    def __init__(self, port: int, server: str, subdomain: str = None):
        self.port = port
        self.server = server
        self.subdomain = subdomain

        self.config: Optional[Config] = None
        self.connection: WebSocketClientProtocol = None

    async def send(self, data: dict):
        await self.connection.send(json.dumps(data))

    async def receive(self) -> dict:
        return json.loads(await self.connection.recv())

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

        await self.send({"subdomain": self.subdomain})

        self.config = await self.receive()

        if self.connection.open:
            return self.connection

    async def handle_messages(self):
        while True:
            try:
                request: RequestData = await self.receive()
                await self.proxyRequest(
                    request=request, on_response=lambda response: self.send(response)
                )

            except ConnectionClosed:
                break

    async def proxyRequest(
        self,
        request: RequestData,
        on_response: Callable[[ResponseData], Awaitable] = None,
    ):
        async with ClientSession(cookie_jar=DummyCookieJar()) as session:
            request_id = uuid4()
            await PubSub.publish(
                {
                    "type": "request",
                    "payload": {
                        "id": request_id.hex,
                        "timestamp": datetime.now().isoformat(),
                        **request,
                    },
                }
            )

            start = perf_counter()
            response = await session.request(
                method=request["method"],
                url=f'http://localhost:{self.port}{request["path"]}',
                headers=request["headers"],
                data=b64decode(request["body"].encode()),
                allow_redirects=False,
            )
            end = perf_counter()

            response_data = ResponseData(
                status=response.status,
                headers=[
                    (key, value)
                    for key, value in response.headers.items()
                    if key.lower() not in ["transfer-encoding", "content-encoding"]
                ],
                body=b64encode(await response.read()).decode(),
            )

            if on_response is not None:
                await on_response(response_data)

            await PubSub.publish(
                {
                    "type": "response",
                    "payload": {
                        "id": request_id.hex,
                        "timing": end - start,
                        **response_data,
                    },
                }
            )
