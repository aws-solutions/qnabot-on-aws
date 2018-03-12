# Alexa tests
scripts to automaticly build alexa skill and test

steps 
1) install and configure alexa ask cli. [instructions](https://developer.amazon.com/docs/smapi/quick-start-alexa-skills-kit-command-line-interface.html)
2) launch dev/master stack
```shell
npm run stack dev/master up
```
3) run setup and build skill
```shell
./setup.js && ./create.sh
```
4) then go to [amazon developer console](https://developer.amazon.com/home.html) and enable new skill named "QnABot Test"


