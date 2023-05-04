import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { 
    AccountRecovery, 
    OAuthScope, 
    ResourceServerScope, 
    UserPool, 
    UserPoolClient, 
    UserPoolResourceServer } 
    from 'aws-cdk-lib/aws-cognito';

export class AuthStack extends cdk.Stack {

    readonly userPoolArn : string = "";
    readonly userPool: UserPool;
    readonly userPoolClient: UserPoolClient;
    
    constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
        super(scope, id, props);

        // Cognito User Pool with Email Sign-in Type.
        this.userPool = new UserPool(this, `UserPool-${id}`, {
            userPoolName: `blogapi-userpool-${id}`,
            selfSignUpEnabled: true,
            signInAliases: { email: true },
            autoVerify: { email: true },
            accountRecovery: AccountRecovery.EMAIL_ONLY,
            removalPolicy: cdk.RemovalPolicy.DESTROY
        });

        const apiReadScope = new ResourceServerScope({
            scopeName: 'blogapi.read',
            scopeDescription: 'blogapi read scope',
        });

        const apiWriteScope = new ResourceServerScope({
            scopeName: 'blogapi.write',
            scopeDescription: 'blogapi write scope',
        });

        const resourceServer = new UserPoolResourceServer(this, `BlogapiResourceServer-${id}`, {
            identifier: 'blogapi-resource-server',
            userPool: this.userPool,
            scopes: [apiReadScope, apiWriteScope],
        });

        this.userPoolClient = new UserPoolClient(this, `UserPoolClient-${id}`, {
            userPool: this.userPool,
            userPoolClientName: `blogapi-client-${id}`,
            accessTokenValidity: cdk.Duration.minutes(60),
            generateSecret: true,
            refreshTokenValidity: cdk.Duration.days(1),
            enableTokenRevocation: true,
            authFlows: {
                adminUserPassword: true,
            },
            oAuth: {
                flows: {
                  clientCredentials: true,
                },
                scopes: [
                    OAuthScope.resourceServer(resourceServer, apiReadScope),
                    OAuthScope.resourceServer(resourceServer, apiWriteScope),
                ],
            },
        });

        this.userPool.addDomain(`BlogApiDomain-${id}`, {
            cognitoDomain: {
                domainPrefix: 'blogapi-domain',
            },
        });

        new cdk.CfnOutput(this, 'userPoolId', { value: this.userPool.userPoolId });
        new cdk.CfnOutput(this, 'userPoolClientId', { value: this.userPoolClient.userPoolClientId });

    }    
}