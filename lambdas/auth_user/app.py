import boto3
import hmac, hashlib, base64
import json
import os

user_pool_id = os.environ['USER_POOL_ID']
client_id = os.environ['USER_POOL_CLIENT_ID']

def get_hash(username, app_client_id, key):
    message = bytes(username+app_client_id,'utf-8')
    key = bytes(key,'utf-8')
    secret_hash = base64.b64encode(hmac.new(key, message, digestmod=hashlib.sha256).digest()).decode()
    return secret_hash

def handler(event, context):
    # Recuperar el nombre de usuario y la contraseña
    body = json.loads(event['body'])
    username = body['username']
    password = body['password']
    
    # instancia del cliente ssm
    ssm_client = boto3.client('ssm')
    # Recuperar las credenciales de AWS
    aws_access_key_id = ssm_client.get_parameter(Name='access_key_id')['Parameter']['Value']
    aws_secret_access_key = ssm_client.get_parameter(Name='secret_access_key')['Parameter']['Value']
    aws_region = 'us-east-1'
    client_secret = ssm_client.get_parameter(Name='client_secret')['Parameter']['Value']
    
    # Crear una instancia del cliente Cognito
    cognito_client = boto3.client('cognito-idp',
                        aws_access_key_id=aws_access_key_id,
                        aws_secret_access_key=aws_secret_access_key,
                        region_name=aws_region)
    
    
    # Llamar a la función admin_initiate_auth() para autenticar al usuario
    auth_response = cognito_client.admin_initiate_auth(
        UserPoolId=user_pool_id,
        ClientId=client_id,
        AuthFlow='ADMIN_USER_PASSWORD_AUTH',
        AuthParameters={
            'USERNAME': username,
            'PASSWORD': password,
            'SECRET_HASH': get_hash(username, client_id, client_secret)
        }
    )
    
    # Devolver la respuesta de autenticación si la autenticación es exitosa
    return {
        'statusCode': 200,
        'body': json.dumps(auth_response)
    }
