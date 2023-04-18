"use strict"
import { Construct } from 'constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { CodePipeline, CodePipelineProps, CodePipelineSource, ShellStep } from 'aws-cdk-lib/pipelines';
import { ApiStage } from './stages/api-stage';

export class CodePipelineStack extends Stack {
  
  constructor(scope: Construct, id: string, props?: StackProps) {
    
    super(scope, id, props);

    const pipeline = new CodePipeline(this, id, {
      pipelineName: id,
      synth: new ShellStep('synth-step', {
        input: CodePipelineSource.gitHub('elvisbrevi/personal-website-back', 'master'),
        installCommands: ['npm i -g npm@latest'],
        commands: ['npm install',
                   'npm ci',
                   'npm run build',
                   'npx cdk synth'],
        primaryOutputDirectory: 'cdk.out'
      }),
    });

    pipeline.addStage(new ApiStage(this, 'prod', {
      env: props?.env
    }));

  }

}