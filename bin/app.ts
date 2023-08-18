import * as cdk from 'aws-cdk-lib';
import {DockerDeploymentStack} from "../lib/docker_deployment-stack";
import {LambdaStack} from "../lib/lambda-stack";

const app = new cdk.App();
const messenger_stack = new DockerDeploymentStack(app, "DockerStack")
const lambda_stack = new LambdaStack(app, "LambdaStack", {ecrImageRepo: messenger_stack.ecrImageRepo});
app.synth()