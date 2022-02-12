from importlib import resources
from pathlib import Path
from typing import Awaitable
from typing import Callable
from typing import Optional

from aiohttp import web

from ttun.pubsub import PubSub
from ttun.types import Config
from ttun.types import RequestData

BASE_DIR = Path(__file__).resolve().parent


class Server:
    def __init__(
        self,
        config: Config,
        on_resend: Callable[[RequestData], Awaitable],
        on_started: Callable[["Server"], None],
    ):
        self.port = 4040

        self.config = {**config, "assets": "/assets/"}

        self.on_resend = on_resend
        self.on_started = lambda *args, **kwargs: on_started(self)

        self.app = web.Application()
        with resources.path(__package__, "staticfiles") as staticfiles:
            self.app.add_routes(
                [
                    web.get("/inspect/", self.inspect_socket),
                    web.get("/config/", self.get_config),
                    web.post("/resend/", self.resend),
                    web.get("/", self.root),
                    web.static("/", staticfiles),
                ]
            )

    async def run(self):
        while True:
            try:
                await web._run_app(self.app, port=self.port, print=self.on_started)
            except OSError:
                self.port += 1

    async def root(self, request: web.Request):
        with resources.path(__package__, "staticfiles") as staticfiles:
            return web.Response(
                body=resources.read_text(f"{__package__}.staticfiles", f"index.html"),
                content_type="text/html",
            )

    async def get_config(self, request: web.Request):
        return web.json_response(
            self.config, headers={"Access-Control-Allow-Origin": "*"}
        )

    async def resend(self, request: web.Request):
        await self.on_resend(await request.json())
        return web.json_response()

    async def inspect_socket(self, request: web.Request):
        ws = web.WebSocketResponse()
        await ws.prepare(request)

        await ws.send_json({"type": "historic", "payload": PubSub.history})

        with PubSub.subscribe() as subscription:
            while message := await subscription.get():
                await ws.send_json(message, False)

        return ws
