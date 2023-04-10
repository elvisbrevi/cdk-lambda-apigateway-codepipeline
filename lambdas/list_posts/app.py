import os
import json
import boto3

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['POSTS_TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    limit = int(event['queryStringParameters'].get('limit', '10'))
    start_key = event['queryStringParameters'].get('start_key', None)

    if start_key:
        response = table.scan(Limit=limit, ExclusiveStartKey={'id': start_key})
    else:
        response = table.scan(Limit=limit)

    items = response['Items']
    last_evaluated_key = response.get('LastEvaluatedKey', None)

    if last_evaluated_key:
        next_key = last_evaluated_key['id']
        next_url = f"/posts?limit={limit}&start_key={next_key}"
    else:
        next_url = None

    data = {
        'items': items,
        'next_url': next_url
    }

    response = {
        'statusCode': 200,
        'body': json.dumps(data)
    }

    return response
