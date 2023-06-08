from enum import Enum
from typing import Optional
from typing import TypedDict

class MessageType(Enum):
    request = 'request'
    response = 'response'

class RequestData(TypedDict):
    method: str
    path: str
    headers: list[tuple[str, str]]
    body: Optional[str]


class ResponseData(TypedDict):
    status: int
    headers: list[tuple[str, str]]
    body: Optional[str]


class Message(TypedDict):
    type: MessageType
    identifier: str
    payload: RequestData | ResponseData


class Config(TypedDict):
    url: str
