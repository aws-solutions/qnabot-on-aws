Students use their schools' learning management solution (LMS) to keep track of their assignments, grades, and working through their course work. To make it easier for students to stay on track and also have easy access to a knowledge base, and help with their learning progress, you can now integrate the open source AWS QnABot solution with Canvas LMS, and enable students with in-the-moment support. With this integration, students will be able to ask the chatbot about their grades, syllabus, enrollments, assignments, and announcements. 

Setup prerequisites
There are few prerequisites to get started with the setup: 
1.	Setup up Canvas LMS – the setup requires a running Canvas LMS environment (on-premise or AWS environment). If you do not have Canvas LMS, you can install by following the instructions on GitHub at https://github.com/instructure/canvas-lms/wiki

2.	Setup a companion Web UI for the chatbot. You can deploy this using the open source Lex-Web-UI solution in your AWS account by following the steps outlined in this blog post -- https://aws.amazon.com/blogs/machine-learning/deploy-a-web-ui-for-your-chatbot/ 

a.	During this setup, set the EnableLogin setting to True
i.	This will allow us to enable authentication in the chatbot and connect that to the Identity provider of Canvas LMS. 
b.	For BotName and BotAlias, use the BotName and Bot Alias as made available from the AWS QnABot solution deployment outputs. 
