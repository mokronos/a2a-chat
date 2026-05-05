import asyncio

import httpx

from fasta2a.client import A2AClient
from fasta2a.schema import Message, Part


async def main() -> None:
    http_client = httpx.AsyncClient(base_url='http://127.0.0.1:8787/agents/e0b7dd03-5318-458a-b198-24b21425e2c4', timeout=None)
    client = A2AClient(http_client=http_client)

    message = Message(
        role='user',
        parts=[Part(text='Check what the weather in New York is like, then write a 3 paragraph poem about it!')],
        message_id='1',
    )

    try:
        async for event in client.stream_message(message):
            print(event, flush=True)
    finally:
        await http_client.aclose()


if __name__ == '__main__':
    asyncio.run(main())
