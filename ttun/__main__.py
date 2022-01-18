import asyncio
from argparse import ArgumentParser, ArgumentDefaultsHelpFormatter
from asyncio import FIRST_EXCEPTION

from ttun.client import Client
from asyncio.exceptions import TimeoutError, CancelledError

from ttun.inspect_server import Server
from ttun.settings import SERVER_HOSTNAME, SERVER_USING_SSL

inspect_queue = asyncio.Queue()

def main():
    parser = ArgumentParser(prog='ttun', formatter_class=ArgumentDefaultsHelpFormatter)
    parser.add_argument(
        'port',
        help='The local port to expose'
    )
    parser.add_argument(
        '--server',
        default=f'{"wss" if SERVER_USING_SSL else "ws"}://{SERVER_HOSTNAME}',
        help='The hostname of the ttun server',
    )
    parser.add_argument(
        '-s', '--subdomain',
        default=None,
        help = 'The subdomain of the ttun tunnel',
    )
    args = parser.parse_args()

    client = Client(
        port=args.port,
        subdomain=args.subdomain,
        server=args.server,
    )

    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    loop.run_until_complete(client.connect())

    def print_info(server: Server):
        print('Tunnel created:')
        print(f'{client.config["url"]} -> http://localhost:{args.port}')
        print('')
        print(f'Inspect requests:')
        print(f'http://localhost:{server.port}')

    server = Server(
        config=client.config,
        on_resend=client.proxyRequest,
        on_started=print_info,
    )

    tasks = {
        loop.create_task(client.handle_messages()),
        loop.create_task(server.run())
    }


    try:
        loop.run_until_complete(asyncio.wait(tasks, return_when=FIRST_EXCEPTION))
    except (CancelledError, TimeoutError):
        for task in tasks:
            task.cancel()
        loop.close()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    main()
