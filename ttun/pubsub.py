import asyncio
from contextlib import contextmanager
from typing import Any, Generator, Iterator


class PubSub:
    _instance = None

    def __init__(self):
        self.queues: list[asyncio.Queue] = []

    @classmethod
    def instance(cls) -> 'PubSub':
        if cls._instance == None:
            cls._instance = cls()
        return cls._instance

    @classmethod
    @contextmanager
    def subscribe(cls) -> Iterator[asyncio.Queue]:
        queue = asyncio.Queue()

        instance = cls.instance()
        instance.queues.append(queue)

        try:
            yield queue
        finally:
            instance.queues.remove(queue)
            del queue

    @classmethod
    async def publish(cls, msg: Any):
        for queue in cls.instance().queues:
            await queue.put(msg)
