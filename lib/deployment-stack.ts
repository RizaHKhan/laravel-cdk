import { RemovalPolicy, SecretValue, Stack, StackProps } from "aws-cdk-lib";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import { ServerDeploymentGroup } from "aws-cdk-lib/aws-codedeploy";
import { Artifact, Pipeline } from "aws-cdk-lib/aws-codepipeline";
import {
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
}

export class DeploymentStack extends Stack {
  private oauthToken: SecretValue;

  constructor(scope: Construct, id: string, props: DeploymentStackProps) {
    super(scope, id, props);

    const { artifactBucket, deploymentGroup, sourceArtifact } = props;
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
        // {
        //   stageName: "Build",
        //   actions: [],
        // },
        {
          stageName: "Deploy",
          actions: [
            new CodeDeployServerDeployAction({
              actionName: "DeployToEc2",
              input: sourceArtifact,
              deploymentGroup,
            }),
          ],
        },
      ],
    });
  }
}
