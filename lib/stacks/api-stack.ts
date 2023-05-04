import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Function, Code, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { AuthStack } from './auth-stack';
import { DataStack } from './data-stack';
import { CertificateStack } from './certificateStack';
import * as iam from 'aws-cdk-lib/aws-iam';

const DOMAIN_NAME = "elvisbrevi.com";
const API_DOMAIN_NAME = `blogapi.${DOMAIN_NAME}`;

export class ApiStack extends cdk.Stack {

  addCorsOptions(apiResource: apigateway.IResource) {
    apiResource.addMethod('OPTIONS', new apigateway.MockIntegration({
        integrationResponses: [{
        statusCode: '200',
        responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            'method.response.header.Access-Control-Allow-Origin': "'*'",
            'method.response.header.Access-Control-Allow-Credentials': "'false'",
            'method.response.header.Access-Control-Allow-Methods': "'OPTIONS,GET,PUT,POST,DELETE'",
        },
        }],
        passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
        requestTemplates: {
        "application/json": "{\"statusCode\": 200}"
        },
    }), {
        methodResponses: [{
        statusCode: '200',
        responseParameters: {
            'method.response.header.Access-Control-Allow-Headers': true,
            'method.response.header.Access-Control-Allow-Methods': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
            'method.response.header.Access-Control-Allow-Origin': true,
        },  
        }]
    })
  }

  constructor(
    scope: Construct, id: 
    string, stageName: string, 
    dataStack: DataStack, 
    authStack: AuthStack, 
    certificateStack: CertificateStack,
    props?: StackProps) {

      super(scope, id, props);
      const region = props?.env?.region;
      const account = props?.env?.account;

      // Define the Lambda functions
      const createPostFunction = new Function(this, `CreatePostFunction-${id}`, {
        functionName: 'CreatePost',
        code: Code.fromAsset('lambdas/create_post'),
        handler: 'app.handler',
        runtime: Runtime.PYTHON_3_9,
        environment: {
          POSTS_TABLE_NAME: dataStack.postsTable.tableName,
        },
      });

      const listPostsFunction = new Function(this, `ListPostsFunction-${id}`, {
        functionName: 'ListPosts',
        code: Code.fromAsset('lambdas/list_posts'),
        handler: 'app.handler',
        runtime: Runtime.PYTHON_3_9,
        environment: {
          POSTS_TABLE_NAME: dataStack.postsTable.tableName,
        },
      });

      const getPostFunction = new Function(this, `GetPostFunction-${id}`, {
        functionName: 'GetPost',
        code: Code.fromAsset('lambdas/get_post'),
        handler: 'app.handler',
        runtime: Runtime.PYTHON_3_9,
        environment: {
          POSTS_TABLE_NAME: dataStack.postsTable.tableName,
        }
      });

      const ssmReadPolicy = new iam.PolicyStatement({
        actions: ["ssm:GetParameter",
                  "ssm:GetParameters",
                  "ssm:GetParametersByPath"],
        resources: [`arn:aws:ssm:${region}:${account}:parameter/*`],
        effect: iam.Effect.ALLOW
      });

      const authUserFunction = new Function(this, `AuthUserFunction-${id}`, {
        functionName: 'AuthUser',
        code: Code.fromAsset('lambdas/auth_user'),
        handler: 'app.handler',
        runtime: Runtime.PYTHON_3_9,
        environment: {
          USER_POOL_ID: authStack.userPool.userPoolId,
          USER_POOL_CLIENT_ID: authStack.userPoolClient.userPoolClientId
        },
        initialPolicy: [ssmReadPolicy]
      });

      // Grant permission to Lambda to access the DynamoDB table
      dataStack.postsTable.grantReadWriteData(createPostFunction);
      dataStack.postsTable.grantReadData(listPostsFunction);
      dataStack.postsTable.grantReadData(getPostFunction);

      // Define the API Gateway
      const api = new apigateway.RestApi(this, `BlogApi-${id}`, {
        endpointTypes: [apigateway.EndpointType.REGIONAL],
        deploy: true,
        deployOptions: {
          stageName: stageName,
        },
        domainName: {
          domainName: API_DOMAIN_NAME,
          certificate: certificateStack.apiCertificate,
          securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
          endpointType: apigateway.EndpointType.EDGE,
        },
      });

      this.addCorsOptions(api.root);

      // Cognito User pool to Authorize users.
      const authorizer = new apigateway.CognitoUserPoolsAuthorizer(this, `BlogApiAuthorizer-${id}`, {
        authorizerName: 'CognitoAPIAuthorizer',
        cognitoUserPools: [authStack.userPool],
      });

      // Define the API Gateway resources
      const posts = api.root.addResource('posts');
      posts.addMethod('GET', new apigateway.LambdaIntegration(listPostsFunction), 
        {
          authorizer: authorizer,
          authorizationType: apigateway.AuthorizationType.COGNITO
        }
      );

      const getPost = posts.addResource('{postId}');
      getPost.addMethod('GET', new apigateway.LambdaIntegration(getPostFunction), 
        {
          authorizer: authorizer,
          authorizationType: apigateway.AuthorizationType.COGNITO
        }
      );

      const postPost = posts.addResource('create');
      postPost.addMethod('POST', new apigateway.LambdaIntegration(createPostFunction), 
        {
          authorizer: authorizer,
          authorizationType: apigateway.AuthorizationType.COGNITO
        }
      );

      const authUser = api.root.addResource('authUser');
      authUser.addMethod('POST', new apigateway.LambdaIntegration(authUserFunction));

      // Add DNS records to the hosted zone to redirect from the domain name to the CloudFront distribution
      new route53.ARecord(this, `BlogApiRecord-${id}`, {
        recordName: API_DOMAIN_NAME, 
        zone: certificateStack.hostedZone,
        target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(api)),
      });
  }
}
