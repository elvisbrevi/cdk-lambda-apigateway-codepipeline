#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodePipelineStack } from '../lib/stacks/codepipeline-stack';

const env = { 
  account: process.env.CDK_DEFAULT_ACCOUNT, 
  region: 'us-east-1' 
};

const app = new cdk.App();

new CodePipelineStack(app, 'pipeline-blog-backend', { env: env });

app.synth();