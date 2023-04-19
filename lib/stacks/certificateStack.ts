import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { HostedZone, IHostedZone } from 'aws-cdk-lib/aws-route53';
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager';

const DOMAIN_NAME = "elvisbrevi.com";
const API_DOMAIN_NAME = `blogapi.${DOMAIN_NAME}`;

export class CertificateStack extends cdk.Stack {

    readonly apiCertificate: Certificate;
    readonly hostedZone: IHostedZone;

    constructor(scope: Construct, id: string, stageName: string, props?: StackProps) {
        super(scope, id, props);

        //Get The Hosted Zone
        this.hostedZone = HostedZone.fromLookup(this, `HostedZone-${id}`, {
            domainName: DOMAIN_NAME,
        });

        // Create the HTTPS certificates
        this.apiCertificate = new Certificate(this, `apiCertificate-${id}`, {
            domainName: API_DOMAIN_NAME,
            validation: CertificateValidation.fromDns(this.hostedZone),
        });
    }
}