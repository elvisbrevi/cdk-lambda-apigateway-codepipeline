import base64
import sys

client_id = sys.argv[1]
client_secret = sys.argv[2]

def get_basic_auth(client_id, client_secret):
    return base64.b64encode(bytes(client_id + ':' + client_secret, 'utf-8')).decode('utf-8')
    
print(get_basic_auth(client_id, client_secret))