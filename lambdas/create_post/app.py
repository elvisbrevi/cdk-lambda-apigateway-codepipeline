import os
import json
import uuid
import boto3

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['POSTS_TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    body = json.loads(event['body'])
    post_id = str(uuid.uuid4())
    title = body['title']
    content = body['content']
    date = body['date']

    item = {
        'id': post_id,
        'title': title,
        'content': content,
        'date': date
    }

    table.put_item(Item=item)

    response = {
        'statusCode': 200,
        'body': json.dumps(item)
    }

    return response
