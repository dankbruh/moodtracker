import boto3
from datetime import date
import json
import operator
from collections import defaultdict

USER_POOL_ID = 'us-east-1_rdB8iu5X4'

cognito_client = boto3.client('cognito-idp')
dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table('moodtracker_events')
weekly_emails_table = dynamodb.Table('moodtracker_weekly_emails')

describe_user_pool_response = cognito_client.describe_user_pool(UserPoolId=USER_POOL_ID)

list_users_response = cognito_client.list_users(UserPoolId=USER_POOL_ID)
users = list_users_response['Users']
user_pages = 1
while 'PaginationToken' in list_users_response:
  list_users_response = cognito_client.list_users(
    PaginationToken=list_users_response['PaginationToken'],
    UserPoolId=USER_POOL_ID,
  )
  users += list_users_response['Users']
  user_pages += 1

total_enabled_users = 0
user_status_breakdown = defaultdict(int)

for user in users:
  if user['Enabled']:
    total_enabled_users += 1
  user_status_breakdown[user['UserStatus']] += 1

events_table_scan_response = events_table.scan(
  ExpressionAttributeNames={'#t': 'type'},
  ProjectionExpression='createdAt,#t,userId',
  ReturnConsumedCapacity='TOTAL',
)
events = events_table_scan_response['Items']
consumed_capacity_units = events_table_scan_response['ConsumedCapacity']['CapacityUnits']
while 'LastEvaluatedKey' in events_table_scan_response:
  events_table_scan_response = events_table.scan(
    ExclusiveStartKey=events_table_scan_response['LastEvaluatedKey'],
    ExpressionAttributeNames={'#t': 'type'},
    ProjectionExpression='createdAt,#t,userId',
    ReturnConsumedCapacity='TOTAL',
  )
  events += events_table_scan_response['Items']
  consumed_capacity_units += events_table_scan_response['ConsumedCapacity']['CapacityUnits']

events.sort(key=operator.itemgetter('createdAt'))

def date_from_js_iso(js_iso_string):
  return date.fromisoformat(js_iso_string[:10])

for event in events:
  event['created_at_date'] = date_from_js_iso(event['createdAt'])

def compute_breakdown(get_key):
  results = {}

  for event in events:
    key = get_key(event['createdAt'])
    stats = results.get(key)
    if stats:
      stats['events'] += 1
      stats['userIds'].add(event['userId'])
    else:
      results[key] = {'events': 1, 'userIds': {event['userId']}}

  for k,v in results.items():
    v['users'] = len(v['userIds'])
    del v['userIds']

  return results

def get_iso_month_string(date_time_string):
  return date_time_string[0:7]

events_count_by_user = defaultdict(int)
for event in events:
  events_count_by_user[event['userId']] += 1

number_of_events_against_number_of_users = defaultdict(int)
for k,v in events_count_by_user.items():
  number_of_events_against_number_of_users[v] += 1

number_of_events_against_number_of_users = dict(sorted(number_of_events_against_number_of_users.items()))

events_by_type = defaultdict(int)
for event in events:
  events_by_type[event['type']] += 1

user_ids_that_have_meditated = set()
for event in events:
  if 'meditations' in event['type']:
    user_ids_that_have_meditated.add(event['userId'])


print(json.dumps({
  'Breakdown by month': compute_breakdown(get_iso_month_string),
  'Number of events created against number of users that have created that many events': number_of_events_against_number_of_users,
  'DynamoDB consumed capacity units': consumed_capacity_units,
  'Number of Cognito user pages paginated over': user_pages,
  'Total number of events': len(events),
  'Events by type': events_by_type,
  'Number of users who have created at least 1 event': len({event['userId'] for event in events}),
  'Number of users who have meditated': len(user_ids_that_have_meditated),
  'Estimated number of users who have subscribed to weekly emails': weekly_emails_table.item_count,
  'Estimated number of users in Cognito user pool': describe_user_pool_response['UserPool']['EstimatedNumberOfUsers'],
  'Actual number of users in Cognito user pool': len(users),
  'Number of enabled users in Cognito user pool': total_enabled_users,
  'Breakdown of user totals by status in Cognito user pool': user_status_breakdown,
}, indent=2))
