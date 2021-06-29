# Extending QnABot with Lambda Hooks

As of version 4.8, the CreateRecentTopicResponse Lambda hook and related resources have been included to demonstrate how to extend QnABot with a custom Lambda hook
in Javascript.

Please read the [the README under the extensions folder](./templates/examples/extensions/README.md) for more information.

## CreateRecentTopicsResponse Lambda Hook

The CreateRecentTopicsResponse Lambda hook is located in the [extensions folder](templates/examples/extensions/js_lambda_hooks/CreateRecentTopicsResponse/CreateRecentTopicsResponse.js).

It demonstrates the following:

1. Reading lambda arguments specified in the Content Designer.
2. Retrieving settings from the deployment.
3. Reading properties stored about the user in the DynamoDB user table.
4. Modifying the response before it is sent back to the user.

### Importing the sample question bank

To see the Create Recent Topics Response Lambda hook in action, import the *RecentTopicsDemo* question bank in the Content Designer.

You can bundle a question bank with your deployment by copying an exported JSON file to ```./templates/examples/examples/examples```
and a corresponding .txt file containing a description.

### Using Custom Settings

You can add settings specific to your custom Lambda Hook.

Click on add settings.

![add settings](./add_settings.jpg)

And then add your custom setting name and value.

![add settings](./add_settings_dialog.jpg)

You can also import and export your custom settings. QnABot comes with the corresponding [custom settings](./recent_topics_settings.json)
for the Recent Topics Demonstration question bank.
