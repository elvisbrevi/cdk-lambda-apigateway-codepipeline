import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

export class DataStack extends cdk.Stack {

    readonly postsTable : Table;

    constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
        super(scope, id, props);

        // Define the DynamoDB table
        this.postsTable = new Table(this, `PostsTable-${id}`, {
            partitionKey: { name: 'id', type: AttributeType.STRING },
            tableName: 'Posts',
            removalPolicy: cdk.RemovalPolicy.DESTROY,
        });

    }

}