import asyncio
from contextlib import contextmanager
from typing import Any, Generator, Iterator


class PubSub:
    _instance = None

    def __init__(self):
        self.queues: list[asyncio.Queue] = []
        self._history= []

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
            cls.unsubscribe(queue)

    @classmethod
    def unsubscribe(cls, queue: asyncio.Queue):
        instance = cls.instance()
        instance.queues.remove(queue)
        del queue

    @classmethod
    @property
    def history(cls):
        instance = cls.instance()
        return instance._history

    @classmethod
    async def publish(cls, msg: Any):
        instance = cls.instance()

        instance._history.append(msg)
        for queue in instance.queues:
            await queue.put(msg)
