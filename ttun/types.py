from typing import TypedDict, Optional


class Message(TypedDict):
    type: str


class RequestData(TypedDict):
    method: str
    path: str
    headers: list[tuple[str, str]]
    body: Optional[str]


class ResponseData(TypedDict):
    status: int
    headers: list[tuple[str, str]]
    body: Optional[str]


class Config(TypedDict):
    url: str
