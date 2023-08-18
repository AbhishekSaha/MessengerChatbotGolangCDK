import { Stack, StackProps} from 'aws-cdk-lib';
import * as codebuild from "aws-cdk-lib/aws-codebuild";
import * as codecommit from "aws-cdk-lib/aws-codecommit";
import * as ecr from "aws-cdk-lib/aws-ecr";
import * as codepipeline from "aws-cdk-lib/aws-codepipeline";
import * as codepipeline_actions from "aws-cdk-lib/aws-codepipeline-actions";
import { Construct } from 'constructs';
import * as yaml from 'yaml';
import * as fs from "fs";

export class DockerDeploymentStack extends Stack {

  readonly ecrImageRepo:ecr.Repository;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);


    const codeRepo = codecommit.Repository.fromRepositoryName(this, 'MessengerChatbotGolangRepo',
      'MessengerChatbotGolang'
    );
    this.ecrImageRepo = new ecr.Repository(this, id + "_Repo");

    const buildImage = new codebuild.Project(this, id + "_BuildImage", {
      buildSpec: codebuild.BuildSpec.fromObject(yaml.parse(fs.readFileSync('./buildspecs/buildspec.yaml', 'utf8'))),
      source: codebuild.Source.codeCommit({ repository: codeRepo }),
      environment: {
        privileged: true,
        environmentVariables: {
          AWS_ACCOUNT_ID: { value: process.env?.CDK_DEFAULT_ACCOUNT || "" },
          REGION: { value: process.env?.CDK_DEFAULT_REGION || "" },
          IMAGE_TAG: { value: "latest" },
          IMAGE_REPO_NAME: { value: this.ecrImageRepo.repositoryName },
          REPOSITORY_URI: { value: this.ecrImageRepo.repositoryUri },
        },
      },
    });

    this.ecrImageRepo.grantPullPush(buildImage);


    // Creates new pipeline artifacts
    const sourceArtifact = new codepipeline.Artifact("SourceArtifact");
    const buildArtifact = new codepipeline.Artifact("BuildArtifact");

    // Creates the source stage for CodePipeline
    const sourceStage = {
      stageName: "Source",
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: "AppCodeCommit",
          branch: "main",
          output: sourceArtifact,
          repository: codeRepo,
        }),
      ],
    };

    const buildStage = {
      stageName: "Build",
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: "DockerBuildPush",
          input: new codepipeline.Artifact("SourceArtifact"),
          project: buildImage,
          outputs: [buildArtifact],
        }),
      ],
    };

    const codePipeline = new codepipeline.Pipeline(this, id + "_Pipeline", {
      pipelineName: "MessengerChatbotGolangPipeline",
      stages: [sourceStage, buildStage],
    });




  }
}
