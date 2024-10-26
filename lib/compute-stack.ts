import { RemovalPolicy, Stack, StackProps } from "aws-cdk-lib";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
import { ServerDeploymentGroup } from "aws-cdk-lib/aws-codedeploy";
import { Artifact } from "aws-cdk-lib/aws-codepipeline";
import {
  AmazonLinuxGeneration,
  AmazonLinuxImage,
  InstanceType,
  LaunchTemplate,
  SecurityGroup,
  SubnetType,
  UserData,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { ManagedPolicy, Role, ServicePrincipal } from "aws-cdk-lib/aws-iam";
import { Bucket } from "aws-cdk-lib/aws-s3";
import { Construct } from "constructs";
import { readFileSync } from "fs";
import path = require("path");

interface ComputeStackProps extends StackProps {
  vpc: Vpc;
  securityGroup: SecurityGroup;
}

export class ComputeStack extends Stack {
  private instanceRole: Role;
  public deploymentGroup: ServerDeploymentGroup;
  public artifactBucket: Bucket;
  public sourceArtifact: Artifact;
  public buildArtifact: Artifact;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    const { vpc, securityGroup } = props;

    this.instanceRole = new Role(this, "InstanceRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
      ],
    });

    const script = readFileSync(
      path.join(__dirname, "../scripts/laravel.sh"),
      "utf8",
    );

    const userData = UserData.forLinux();
    userData.addCommands(script);

    const launchTemplate = new LaunchTemplate(this, "AppInstance", {
      instanceType: new InstanceType("t2.micro"),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      role: this.instanceRole,
      securityGroup,
      userData,
    });

    const autoScalingGroup = new AutoScalingGroup(this, "AutoScalingGroup", {
      vpc,
      launchTemplate,
      desiredCapacity: 1,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });

    this.deploymentGroup = new ServerDeploymentGroup(this, "DeploymentGroup", {
      autoScalingGroups: [autoScalingGroup],
    });

    this.artifactBucket = new Bucket(this, "ArtifactBucket", {
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.sourceArtifact = new Artifact("SourceArtifact");
    this.buildArtifact = new Artifact("BuildArtifact");
  }
}
