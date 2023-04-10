import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import * as cdkDynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as cdkLambda from 'aws-cdk-lib/aws-lambda';
import * as cdkApigtw from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';

export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
    super(scope, id, props);

    // Define the DynamoDB table
    const postsTable = new cdkDynamodb.Table(this, `PostsTable-${id}`, {
      partitionKey: { name: 'id', type: cdkDynamodb.AttributeType.STRING },
      tableName: 'Posts',
    });

    // Define the Lambda functions
    const createPostFunction = new cdkLambda.Function(this, `CreatePostFunction-${id}`, {
      functionName: 'CreatePost',
      code: cdkLambda.Code.fromAsset('lambdas/create_post'),
      handler: 'handler',
      runtime: cdkLambda.Runtime.PYTHON_3_9,
      environment: {
        POSTS_TABLE_NAME: postsTable.tableName,
      },
    });

    const listPostsFunction = new cdkLambda.Function(this, `ListPostsFunction-${id}`, {
      functionName: 'ListPosts',
      code: cdkLambda.Code.fromAsset('lambdas/list_posts'),
      handler: 'handler',
      runtime: cdkLambda.Runtime.PYTHON_3_9,
      environment: {
        POSTS_TABLE_NAME: postsTable.tableName,
      },
    });

    const getPostFunction = new cdkLambda.Function(this, `GetPostFunction-${id}`, {
      functionName: 'GetPost',
      code: cdkLambda.Code.fromAsset('lambdas/get_post'),
      handler: 'handler',
      runtime: cdkLambda.Runtime.PYTHON_3_9,
      environment: {
        POSTS_TABLE_NAME: postsTable.tableName,
      }
    });

    // Grant permission to Lambda to access the DynamoDB table
    postsTable.grantReadWriteData(createPostFunction);
    postsTable.grantReadData(listPostsFunction);
    postsTable.grantReadData(getPostFunction);

    // Define the API Gateway
    const api = new cdkApigtw.LambdaRestApi(this, `BlogApi-${id}`, {
      handler: listPostsFunction,
      proxy: false
    });

    const posts = api.root.addResource('posts');
    posts.addMethod('GET', new cdkApigtw.LambdaIntegration(listPostsFunction));

    const post = posts.addResource('{post}');
    post.addMethod('GET', new cdkApigtw.LambdaIntegration(getPostFunction));
    post.addMethod('POST', new cdkApigtw.LambdaIntegration(createPostFunction));
    
  }
}
