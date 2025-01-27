import boto3
from boto3.dynamodb.conditions import Attr
from datetime import datetime, timedelta
import email
import json

CACHE_KEY = 'usage'
HEADERS = {'Content-Type': 'application/json'}
SECONDS_PER_DAY = 86400
USER_POOL_ID = 'us-east-1_rdB8iu5X4'

cache = {}

cognito_client = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')
cache_table = dynamodb.Table('moodtracker_global_cache')
events_table = dynamodb.Table('moodtracker_events')

def handler(event, context):
  now = datetime.now()
  consumed_capacity_units = 0
  confirmed_users = 0
  db_cache_hit = False
  memory_cache_hit = False
  user_pages=0

  def log():
    print({
      'consumedCapacityUnits': consumed_capacity_units,
      'dbCacheHit': db_cache_hit,
      'memoryCacheHit': memory_cache_hit,
      'userPages': user_pages,
    })

  if 'expires_at' in cache and now.timestamp() <= cache['expires_at']:
    memory_cache_hit = True
    log()
    return cache['data']

  try:
    cache_response = cache_table.get_item(Key={'key': CACHE_KEY})
    item = cache_response.get('Item')
    if item:
      db_cache_hit = True
      cache['expires_at'] = item['expiresAt']
      cache['data'] = item['data']
      log()
      return cache['data']
  except Exception as e:
    print(e)

  try:
    users_response = cognito_client.list_users(UserPoolId=USER_POOL_ID)
    users = users_response['Users']
    user_pages = 1
    while 'PaginationToken' in users_response:
      users_response = cognito_client.list_users(
        PaginationToken=users_response['PaginationToken'],
        UserPoolId=USER_POOL_ID,
      )
      users += users_response['Users']
      user_pages += 1
  except Exception as e:
    print(e)
    return {
      'body': json.dumps({'error': 'Internal server error'}),
      'headers': HEADERS,
      'statusCode': 500,
    }

  for user in users:
    if user['Enabled'] and user['UserStatus'] == 'CONFIRMED':
      confirmed_users += 1

  filter_expression = Attr('createdAt').gt((now - timedelta(30)).isoformat())

  try:
    events_response = events_table.scan(
      ExpressionAttributeNames={'#t': 'type'},
      FilterExpression=filter_expression,
      ProjectionExpression='createdAt,#t,userId',
      ReturnConsumedCapacity='TOTAL',
    )
    events = events_response['Items']
    consumed_capacity_units = events_response['ConsumedCapacity']['CapacityUnits']

    while 'LastEvaluatedKey' in events_response:
      events_response = events_table.scan(
        ExclusiveStartKey=events_response['LastEvaluatedKey'],
        ExpressionAttributeNames={'#t': 'type'},
        FilterExpression=filter_expression,
        ProjectionExpression='createdAt,#t,userId',
        ReturnConsumedCapacity='TOTAL',
      )
      events += events_response['Items']
      consumed_capacity_units += events_response['ConsumedCapacity']['CapacityUnits']
  except Exception as e:
    print(e)
    return {
      'body': json.dumps({'error': 'Internal server error'}),
      'headers': HEADERS,
      'statusCode': 500,
    }

  cache['expires_at'] = round(now.timestamp() + SECONDS_PER_DAY)
  cache['data'] = {
    'body': json.dumps({
      'confirmedUsers': confirmed_users,
      'MAUs': len({event['userId'] for event in events}),
      'WAUs': len({event['userId'] for event in events if datetime.fromisoformat(event['createdAt'][:-1]) > now - timedelta(7)}),
    }),
    'headers': {
      **HEADERS,
      'Cache-Control': 'immutable',
      'Expires': email.utils.formatdate(cache['expires_at'], usegmt=True),
    },
    'statusCode': 200,
  }

  try:
    cache_table.put_item(Item={
      'key': CACHE_KEY,
      'data': cache['data'],
      'expiresAt': cache['expires_at'],
    })
  except Exception as e:
    print(e)

  log()
  return cache['data']
