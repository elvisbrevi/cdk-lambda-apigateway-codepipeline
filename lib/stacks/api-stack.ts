import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import * as cdkLambda from 'aws-cdk-lib/aws-lambda';
import * as cdkApigtw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { AuthStack } from './auth-stack';
import { DataStack } from './data-stack';
import { CertificateStack } from './certificateStack';

const DOMAIN_NAME = "elvisbrevi.com";
const API_DOMAIN_NAME = `blogapi.${DOMAIN_NAME}`;

export class ApiStack extends cdk.Stack {
  constructor(
    scope: Construct, id: 
    string, stageName: string, 
    dataStack: DataStack, 
    authStack: AuthStack, 
    certificateStack: CertificateStack,
    props?: StackProps) {

      super(scope, id, props);

      // Define the Lambda functions
      const createPostFunction = new cdkLambda.Function(this, `CreatePostFunction-${id}`, {
        functionName: 'CreatePost',
        code: cdkLambda.Code.fromAsset('lambdas/create_post'),
        handler: 'app.handler',
        runtime: cdkLambda.Runtime.PYTHON_3_9,
        environment: {
          POSTS_TABLE_NAME: dataStack.postsTable.tableName,
        },
      });

      const listPostsFunction = new cdkLambda.Function(this, `ListPostsFunction-${id}`, {
        functionName: 'ListPosts',
        code: cdkLambda.Code.fromAsset('lambdas/list_posts'),
        handler: 'app.handler',
        runtime: cdkLambda.Runtime.PYTHON_3_9,
        environment: {
          POSTS_TABLE_NAME: dataStack.postsTable.tableName,
        },
      });

      const getPostFunction = new cdkLambda.Function(this, `GetPostFunction-${id}`, {
        functionName: 'GetPost',
        code: cdkLambda.Code.fromAsset('lambdas/get_post'),
        handler: 'app.handler',
        runtime: cdkLambda.Runtime.PYTHON_3_9,
        environment: {
          POSTS_TABLE_NAME: dataStack.postsTable.tableName,
        }
      });

      // Grant permission to Lambda to access the DynamoDB table
      dataStack.postsTable.grantReadWriteData(createPostFunction);
      dataStack.postsTable.grantReadData(listPostsFunction);
      dataStack.postsTable.grantReadData(getPostFunction);

      // Define the API Gateway
      const api = new cdkApigtw.LambdaRestApi(this, `BlogApi-${id}`, {
        handler: listPostsFunction,
        proxy: false,
        restApiName: 'Blog API',
        domainName: {
          domainName: API_DOMAIN_NAME,
          certificate: certificateStack.httpsCertificate,
          securityPolicy: cdkApigtw.SecurityPolicy.TLS_1_2,
          endpointType: cdkApigtw.EndpointType.EDGE,
        },
      });

      // Cognito User pool to Authorize users.
      const authorizer = new cdkApigtw.CfnAuthorizer(this, `cfnAuth-${id}`, {
        restApiId: api.restApiId,
        name: 'CognitoAPIAuthorizer',
        type: 'COGNITO_USER_POOLS',
        identitySource: 'method.request.header.Authorization',
        providerArns: [authStack.userPool.userPoolArn],
      })

      // Define the API Gateway resources
      const posts = api.root.addResource('posts');
      posts.addMethod('GET', new cdkApigtw.LambdaIntegration(listPostsFunction), 
        {
          authorizationType: cdkApigtw.AuthorizationType.COGNITO,
          authorizer: {
            authorizerId: authorizer.ref
          }
        }
      );

      const getPost = posts.addResource('{postId}');
      getPost.addMethod('GET', new cdkApigtw.LambdaIntegration(getPostFunction), 
        {
          authorizationType: cdkApigtw.AuthorizationType.COGNITO,
          authorizer: {
            authorizerId: authorizer.ref
          }
        }
      );

      const postPost = posts.addResource('create');
      postPost.addMethod('POST', new cdkApigtw.LambdaIntegration(createPostFunction), 
        {
          authorizationType: cdkApigtw.AuthorizationType.COGNITO,
          authorizer: {
            authorizerId: authorizer.ref
          }
        }
      );

      // Add DNS records to the hosted zone to redirect from the domain name to the CloudFront distribution
      new route53.ARecord(this, `BlogApiRecord-${id}`, {
        recordName: API_DOMAIN_NAME, 
        zone: certificateStack.hostedZone,
        target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(api)),
      });
    
  }
}
