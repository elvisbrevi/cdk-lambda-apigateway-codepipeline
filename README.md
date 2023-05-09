# CDK TypeScript Project with AWS API Gateway, Lambda, DynamoDB, and Cognito

Welcome to your CDK TypeScript project! This is a blank project for CDK development with TypeScript that enables you to deploy AWS infrastructure in a programmable way.

This project includes an API Gateway that communicates with Lambda functions written in Python. The Lambda functions store data in DynamoDB, and authentication and authorization are handled by Cognito.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

## AWS Infrastructure
This project creates the following AWS infrastructure:

* API Gateway: AWS service that enables you to create, deploy, and manage REST APIs.
* Lambda Functions: AWS service that lets you run code without provisioning or managing servers. In this project, we use Lambda functions to execute Python code.
* DynamoDB: AWS service that provides a NoSQL database that can store and retrieve any amount of data.
* Cognito: AWS service that provides authentication, authorization, and user management for web and mobile apps.

## Conclusion
This project is a great starting point for building serverless applications with AWS. With the help of CDK, you can deploy and manage your infrastructure programmatically, which makes the development and deployment process faster and more efficient.
