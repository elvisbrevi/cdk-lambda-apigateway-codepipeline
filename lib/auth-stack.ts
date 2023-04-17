import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HostedZone, ARecord, RecordTarget } from 'aws-cdk-lib/aws-route53';
import { UserPoolDomainTarget } from 'aws-cdk-lib/aws-route53-targets';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';
import * as cognito from 'aws-cdk-lib/aws-cognito';

const DOMAIN_NAME = "elvisbrevi.com";
const COGNITO_DOMAIN_NAME = `cognito.${DOMAIN_NAME}`;

export class AuthStack extends cdk.Stack {
    userPool: cognito.UserPool;

    constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
        super(scope, id, props);
        
        //Get The Hosted Zone
        const hostedZone = HostedZone.fromLookup(this, `HostedZone-${id}`, {
        domainName: DOMAIN_NAME,
        });

        // Cognito User Pool with Email Sign-in Type.
        const userPool = new cognito.UserPool(this, `UserPool-${id}`, {
            selfSignUpEnabled: true,
            userPoolName: 'apiBlogUserPool',
            userVerification: {
            emailSubject: 'Verify your email for our awesome app!',
            emailBody: 'Hello {username}, Thanks for signing up to our awesome app! Your verification code is {####}',
            emailStyle: cognito.VerificationEmailStyle.CODE,
            },
            signInAliases: {
            email: true
            },
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });
    
        // Create the HTTPS certificate for Cognito User Pool custom domain.
        const cognitoHttpsCertificate = new Certificate(this, `CognitoHttpsCertificate-${id}`, {
            domainName: COGNITO_DOMAIN_NAME,
            validation: CertificateValidation.fromDns(hostedZone)
        });
    
        // Cognito User Pool custom domain.
        const userPollDomain = userPool.addDomain(`UserPoolDomain-${id}`, {
            customDomain: {
            domainName: COGNITO_DOMAIN_NAME,
            certificate: cognitoHttpsCertificate,
            },
        });
    
        // Cognito User Pool App Client.
        userPool.addClient(`AppClient-${id}`, {
            userPoolClientName: 'apiBlogClient',
            refreshTokenValidity: cdk.Duration.minutes(15),
            authSessionValidity: cdk.Duration.minutes(15),
            accessTokenValidity: cdk.Duration.minutes(15),
            idTokenValidity: cdk.Duration.minutes(15),
            generateSecret: true,
            supportedIdentityProviders: [
            cognito.UserPoolClientIdentityProvider.COGNITO,
            cognito.UserPoolClientIdentityProvider.GOOGLE],
            authFlows: {
            userPassword: true,
            }
        });
    
        // Add DNS records to the hosted zone to redirect from the domain name to the CloudFront distribution
        new ARecord(this, `CognitoRecord-${id}`, {
            recordName: COGNITO_DOMAIN_NAME, 
            zone: hostedZone,
            target: RecordTarget.fromAlias(new UserPoolDomainTarget(userPollDomain))
        });

    }
}
