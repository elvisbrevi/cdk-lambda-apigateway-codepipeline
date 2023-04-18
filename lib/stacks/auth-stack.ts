import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AccountRecovery, UserPool, UserPoolClient, UserPoolClientIdentityProvider } from 'aws-cdk-lib/aws-cognito';

export class AuthStack extends cdk.Stack {

    readonly userPoolArn : string = "";
    readonly userPool: UserPool;

    constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
        super(scope, id, props);

        // Cognito User Pool with Email Sign-in Type.
        this.userPool = new UserPool(this, `UserPool-${id}`, {
            userPoolName: `blogapi-userpool-${id}`,
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

        const userPoolClient = new UserPoolClient(this, `UserPoolClient-${id}`, {
            userPool: this.userPool,
            userPoolClientName: `blogapi-userpool-client-${id}`,
            authFlows: {
                adminUserPassword: true,
                userPassword: true,
                custom: true,
                userSrp: true,
            },
            supportedIdentityProviders: [
                UserPoolClientIdentityProvider.COGNITO,
            ]
        });

        new cdk.CfnOutput(this, 'userPoolId', { value: this.userPool.userPoolId });
        new cdk.CfnOutput(this, 'userPoolClientId', { value: userPoolClient.userPoolClientId });

    }    
}