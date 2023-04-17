import { StackProps, Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiStack } from "./api-stack";
import { AuthStack } from "./auth-stack";

export class ApiStage extends Stage {

    constructor(scope: Construct, stageName: string, props?: StackProps) {
        super(scope, stageName, props);
    
        const authStack = new AuthStack(this, 'personal-blog-auth', stageName);
        new ApiStack(this, 'personal-blog-api', stageName, authStack).addDependency(authStack);
    }
    
}