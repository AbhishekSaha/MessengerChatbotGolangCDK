import {Stack, StackProps} from "aws-cdk-lib";
import * as ecr from "aws-cdk-lib/aws-ecr";
import {Construct} from "constructs";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as iam from "aws-cdk-lib/aws-iam";


interface LambdaStackProps extends StackProps {
    ecrImageRepo: ecr.Repository;
}

export class LambdaStack extends Stack {
    constructor(scope: Construct, id: string, props: LambdaStackProps) {
        super(scope, id, props);

        const lambdaIamRole = new iam.Role(
            this,
            id + 'LambdaRole',
            {
                assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
                managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'),]
            }
        )

        const chatbotLambda = new lambda.DockerImageFunction(
            this,
            id + 'Lambda', {
                code: lambda.DockerImageCode.fromEcr(props.ecrImageRepo),
                role: lambdaIamRole,
                memorySize: 128,
                architecture: lambda.Architecture.ARM_64,
            }
        )

        const apiGateway = new apigateway.LambdaRestApi(
            this,
            id + 'ApiGateway',
            {
                handler: chatbotLambda
            }
        )
    }


}