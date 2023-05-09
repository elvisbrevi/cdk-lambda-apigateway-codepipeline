# CDK TypeScript Project with AWS API Gateway, Lambda, DynamoDB, Cognito, and CodePipeline

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

## Deployment
This project includes automatic deployment with CodePipeline. CodePipeline is a continuous delivery service that automates the building, testing, and deployment of code changes. The deployment process includes the following steps:

* Code is pushed to the repository.
* CodePipeline detects the changes and triggers a build.
* AWS CodeBuild builds the application and creates a deployment package.
* The CloudFormation stack is updated, and the changes are deployed to the AWS infrastructure.

## Conclusion
This project serves as an excellent starting point for developing AWS infrastructure using the CDK in TypeScript. It showcases how we can easily create an API Gateway that communicates with Lambda functions, with data being saved in DynamoDB and authorization through Cognito. The deployment process is streamlined with automatic deployment through CodePipeline, making it easy to manage changes and deploy infrastructure updates.
