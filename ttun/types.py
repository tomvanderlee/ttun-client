from enum import Enum
from itertools import chain
from typing import Optional
from typing import TypedDict


class HttpMessageType(Enum):
    request = "request"
    response = "response"


class HttpRequestData(TypedDict):
    method: str
    path: str
    headers: list[tuple[str, str]]
    body: Optional[str]


class HttpResponseData(TypedDict):
    status: int
    headers: list[tuple[str, str]]
    body: Optional[str]


class HttpMessage(TypedDict):
    type: HttpMessageType
    identifier: str
    payload: HttpRequestData | HttpResponseData


class WebsocketMessageType(Enum):
    connect = "connect"
    disconnect = "disconnect"
    message = "message"
    ack = "ack"


class WebsocketConnectData(TypedDict):
    path: str
    headers: list[tuple[str, str]]


class WebsocketDisconnectData(TypedDict):
    pass


class WebsocketMessageData(TypedDict):
    body: Optional[str]


class WebsocketMessage(TypedDict):
    type: WebsocketMessageType
    identifier: str
    payload: Optional[
        WebsocketConnectData | WebsocketDisconnectData | WebsocketMessageData
    ]


class MessageType(Enum):
    request = "request"
    response = "response"

    ws_connect = "connect"
    ws_disconnect = "disconnect"
    ws_message = "message"
    ws_ack = "ack"


Message = HttpMessage | WebsocketMessage


class Config(TypedDict):
    url: str
