import { StackProps, Stage } from "aws-cdk-lib";
import { Construct } from "constructs";
import { ApiStack } from "../stacks/api-stack";
import { AuthStack } from "../stacks/auth-stack";
import { DataStack } from "../stacks/data-stack";
import { CertificateStack } from "../stacks/certificateStack";

export class ApiStage extends Stage {

    constructor(scope: Construct, stageName: string, props?: StackProps) {
        super(scope, stageName, props);

        // Common props for all stacks
        const commonProps : StackProps = {
            tags: {
                'Project': 'Blog',
                'Stage': stageName,
            },
            env: props?.env
        };
        
        const certificateStack = new CertificateStack(this, 'blog-certificate', stageName, commonProps);
        const dataStack = new DataStack(this, 'blog-data', stageName, commonProps);
        const authStack = new AuthStack(this, 'blog-auth', stageName, commonProps);

        const apiStack = new ApiStack(
            this, 
            'blog-api', 
            stageName, 
            dataStack, 
            authStack, 
            certificateStack,
            commonProps
        );
        apiStack.addDependency(certificateStack);
        apiStack.addDependency(authStack);
        apiStack.addDependency(dataStack);
    }
    
}