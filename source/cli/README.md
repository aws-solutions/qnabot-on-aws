# QnABot CLI
The QnABot on AWS CLI supports the capability to import and export questions and answers from your QnABot setup. For more information on using QnaBot CLI, please refer to [Using QnABot on the AWS Command Line Interface (CLI)](https://docs.aws.amazon.com/solutions/latest/qnabot-on-aws/use-qnabot-on-aws-command-line-interface-cli.html)

## Unit Tests
1. Get started by creating a virtual environment and deploy the needed Python packages.

```bash
pip3 install virtualenv 
python3 -m virtualenv .venv 
source ./.venv/bin/activate 
cd source 
pip3 install -r requirements-test.txt   
```

2. Run unit tests using below command:
```shell
pytest -v 
```