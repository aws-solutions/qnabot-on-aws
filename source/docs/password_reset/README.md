# Password Reset for Default Admin User
The default admin user that is deployed with QnABot is not automatically verified. If the password is forgotten or the welcome e-mail is not received, it is possible to set the password using the AWS CLI:

1. Install the AWS CLI
1. Execute the following command:
```
aws cognito-idp admin-set-user-password \
  --user-pool-id <qnabot user pool id> \
  --username <default username> \
  --password <desired password> \
  --permanent
```
You can get the user pool id using:
```
aws cognito-idp list-user-pools --max-results 10
```

Alternatively, you can delete and create a user with the same name from the Cognito console. The user needs to be added to the 'Admins' user group:

1. From the Cognito console, disable and delete the default user.
1. Create a new user with the same name or different name. You can provide a new password or generate a new sign-in e-mail.
1. Once created, under the 'Groups' tab, click on the 'Admins' group and add the user to that group.