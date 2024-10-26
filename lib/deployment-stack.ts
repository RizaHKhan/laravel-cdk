import { SecretValue, Stack, StackProps } from "aws-cdk-lib";
import {
  BuildSpec,
  LinuxBuildImage,
  PipelineProject,
} from "aws-cdk-lib/aws-codebuild";
import { ServerDeploymentGroup } from "aws-cdk-lib/aws-codedeploy";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
  CodeBuildAction,
  CodeDeployServerDeployAction,
  GitHubSourceAction,
} from "aws-cdk-lib/aws-codepipeline-actions";
import {
  CompositePrincipal,
  PolicyDocument,
  PolicyStatement,
  Role,
  ServicePrincipal,
} from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";

interface DeploymentStackProps extends StackProps {
  deploymentGroup: ServerDeploymentGroup;
  artifactBucket: Bucket;
  sourceArtifact: Artifact;
  buildArtifact: Artifact;
}

export class DeploymentStack extends Stack {
  private oauthToken: SecretValue;

  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    const { artifactBucket, deploymentGroup, sourceArtifact, buildArtifact } =
      props;
    this.oauthToken = SecretValue.secretsManager("github-token");

    const role = new Role(this, "PipelineRole", {
      assumedBy: new CompositePrincipal(
        new ServicePrincipal("codebuild.amazonaws.com"),
        new ServicePrincipal("codepipeline.amazonaws.com"),
      ),
      inlinePolicies: {
        CdkDeployPermissions: new PolicyDocument({
          statements: [
            new PolicyStatement({
              actions: ["sts:AssumeRole"],
              resources: ["arn:aws:iam::*:role/cdk-*"],
            }),
          ],
        }),
      },
    });

    new Pipeline(this, "Pipeline", {
      pipelineName: "Laravel-pipeline",
      role,
      artifactBucket,
      stages: [
        {
          stageName: "Source",
          actions: [
            new GitHubSourceAction({
              actionName: "Source",
              owner: "RizaHKhan",
              repo: "laravel-app-for-cdk",
              branch: "master",
              oauthToken: this.oauthToken,
              output: sourceArtifact,
            }),
          ],
        },
        {
          stageName: "Build",
          actions: [
            new CodeBuildAction({
              actionName: "Build",
              project: new PipelineProject(this, "BuildProject", {
                environment: {
                  buildImage: LinuxBuildImage.AMAZON_LINUX_2_5,
                },
                buildSpec: BuildSpec.fromObject({
                  version: "0.2",
                  phases: {
                    install: {
                      "runtime-versions": {
                        nodejs: "20.x",
                        php: "8.3",
                      },
                      commands: [
                        "npm install",
                        "curl -sS https://getcomposer.org/installer | php", // Install Composer
                        "php composer.phar install --no-dev --optimize-autoloader", // Install PHP dependencies
                      ],
                    },
                    build: {
                      commands: ["npm run build"],
                    },
                  },
                  artifacts: {
                    "base-directory": "./", // Adjust this to the appropriate base directory if different
                    files: [
                      "**/*", // Frontend assets
                    ],
                  },
                }),
              }),
              input: sourceArtifact,
              outputs: [buildArtifact],
            }),
          ],
        },
        {
          stageName: "Deploy",
          actions: [
            new CodeDeployServerDeployAction({
              actionName: "DeployToEc2",
              input: buildArtifact,
              deploymentGroup,
            }),
          ],
        },
      ],
    });
  }
}
