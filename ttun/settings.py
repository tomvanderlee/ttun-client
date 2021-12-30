import sys
from configparser import ConfigParser
from os import mkdir
from pathlib import Path

import appdirs

config_file = Path(appdirs.user_config_dir('ttun-client', 'ttun', roaming=True)) / 'config.ini'

config= ConfigParser()
config['server'] = {
    'hostname': '',
    'using_ssl': 'yes',
}

if not config_file.parent.exists():
    mkdir(config_file.parent)
else:
    config.read(filenames=config_file)

with open(config_file, 'w') as f:
    config.write(f)

SERVER_HOSTNAME = config['server'].get('hostname')
SERVER_USING_SSL = config['server'].get('using_ssl').lower() in ['yes', 'true']

try:
    assert SERVER_HOSTNAME != ''
except AssertionError:
    print(f'Please add a valid server hostname in {config_file}')
    sys.exit(1)
