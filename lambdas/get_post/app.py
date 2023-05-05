import os
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['POSTS_TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    post_id = event['pathParameters']['postId']

    response = table.get_item(Key={'id': post_id})
    item = response.get('Item', None)

    if item:
        response = {
            'statusCode': 200,
            'body': json.dumps(item)
        }
    else:
        response = {
            'statusCode': 404,
            'headers': {
                "Access-Control-Allow-Headers" : "Content-Type",
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST"
            },
            'body': json.dumps({'message': 'Post not found'})
        }

    return response
