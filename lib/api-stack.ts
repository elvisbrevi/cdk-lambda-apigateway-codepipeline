import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import * as cdkDynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdkLambda from 'aws-cdk-lib/aws-lambda';
import * as cdkApigtw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

const DOMAIN_NAME = "elvisbrevi.com";
const API_DOMAIN_NAME = `blogapi.${DOMAIN_NAME}`;

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
    super(scope, id, props);

    // Define the DynamoDB table
    const postsTable = new cdkDynamodb.Table(this, `PostsTable-${id}`, {
      partitionKey: { name: 'id', type: cdkDynamodb.AttributeType.STRING },
      tableName: 'Posts',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Define the Lambda functions
    const createPostFunction = new cdkLambda.Function(this, `CreatePostFunction-${id}`, {
      functionName: 'CreatePost',
      code: cdkLambda.Code.fromAsset('lambdas/create_post'),
      handler: 'app.handler',
      runtime: cdkLambda.Runtime.PYTHON_3_9,
      environment: {
        POSTS_TABLE_NAME: postsTable.tableName,
      },
    });

    const listPostsFunction = new cdkLambda.Function(this, `ListPostsFunction-${id}`, {
      functionName: 'ListPosts',
      code: cdkLambda.Code.fromAsset('lambdas/list_posts'),
      handler: 'app.handler',
      runtime: cdkLambda.Runtime.PYTHON_3_9,
      environment: {
        POSTS_TABLE_NAME: postsTable.tableName,
      },
    });

    const getPostFunction = new cdkLambda.Function(this, `GetPostFunction-${id}`, {
      functionName: 'GetPost',
      code: cdkLambda.Code.fromAsset('lambdas/get_post'),
      handler: 'app.handler',
      runtime: cdkLambda.Runtime.PYTHON_3_9,
      environment: {
        POSTS_TABLE_NAME: postsTable.tableName,
      }
    });

    // Grant permission to Lambda to access the DynamoDB table
    postsTable.grantReadWriteData(createPostFunction);
    postsTable.grantReadData(listPostsFunction);
    postsTable.grantReadData(getPostFunction);

    //Get The Hosted Zone
    const hostedZone = route53.HostedZone.fromLookup(this, `HostedZone-${id}`, {
      domainName: DOMAIN_NAME,
    });

    // Create the HTTPS certificate
    const httpsCertificate = new acm.Certificate(this, `HttpsCertificate-${id}`, {
      domainName: API_DOMAIN_NAME,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // Define the API Gateway
    const api = new cdkApigtw.LambdaRestApi(this, `BlogApi-${id}`, {
      handler: listPostsFunction,
      proxy: false,
      restApiName: 'Blog API',
      domainName: {
        domainName: API_DOMAIN_NAME,
        certificate: httpsCertificate,
        securityPolicy: cdkApigtw.SecurityPolicy.TLS_1_2,
        endpointType: cdkApigtw.EndpointType.EDGE,
      },
    });

    // Define the API Gateway resources
    const posts = api.root.addResource('posts');
    posts.addMethod('GET', new cdkApigtw.LambdaIntegration(listPostsFunction));

    const getPost = posts.addResource('{postId}');
    getPost.addMethod('GET', new cdkApigtw.LambdaIntegration(getPostFunction));

    const postPost = posts.addResource('create');
    postPost.addMethod('POST', new cdkApigtw.LambdaIntegration(createPostFunction));

    // Add DNS records to the hosted zone to redirect from the domain name to the CloudFront distribution
    new route53.ARecord(this, `BlogApiRecord-${id}`, {
      recordName: API_DOMAIN_NAME, 
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(new route53Targets.ApiGateway(api)),
    });
    
  }
}
