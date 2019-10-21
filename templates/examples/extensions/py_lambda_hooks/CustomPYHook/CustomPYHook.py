def handler(event, context):
    event['res']['message']="Hi! This is your Custom Python Hook speaking!"
    return event

