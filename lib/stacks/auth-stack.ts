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

        const domain = this.userPool.addDomain(`BlogApiDomain-${id}`, {
            cognitoDomain: {
                domainPrefix: 'blogapi-domain',
            },
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
                callbackUrls: [`http://localhost:5173/callback`, `${domain.baseUrl()}/callback`],
                flows: {
                    authorizationCodeGrant: true,
                }
            },
        });

        new cdk.CfnOutput(this, 'userPoolId', { value: this.userPool.userPoolId });
        new cdk.CfnOutput(this, 'userPoolClientId', { value: this.userPoolClient.userPoolClientId });

    }    
}