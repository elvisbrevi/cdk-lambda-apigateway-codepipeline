import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { UserPool, UserPoolClient } from 'aws-cdk-lib/aws-cognito';

export class AuthStack extends cdk.Stack {

    public userPoolArn : string = "";

    constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
        super(scope, id, props);

        // Cognito User Pool with Email Sign-in Type.
        const userPool = new UserPool(this, `UserPool-${id}`, {
            signInAliases: {
                email: true
            }
        });

        this.userPoolArn = userPool.userPoolArn;

    }
}