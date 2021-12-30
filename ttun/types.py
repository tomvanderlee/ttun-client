from typing import TypedDict, Optional


class Message(TypedDict):
    type: str


class RequestData(TypedDict):
    method: str
    path: str
    headers: dict
    cookies: dict
    body: Optional[str]


class ResponseData(TypedDict):
    status: int
    headers: dict
    cookies: dict
    body: Optional[str]


class Config(TypedDict):
    url: str
