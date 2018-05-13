import datetime


def handler(event, context):
    currentTime = datetime.datetime.now()
    
    if currentTime.hour < 12:
        message='Good morning, '
    elif 12 <= currentTime.hour < 18:
        message='Good afternoon, '
    else:
        message='Good evening,'
    event['res']['message']=message+event['res']['message']
    
    return event

