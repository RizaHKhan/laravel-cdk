import { Stack, StackProps } from "aws-cdk-lib";
import { AutoScalingGroup } from "aws-cdk-lib/aws-autoscaling";
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
import { Construct } from "constructs";
import { readFileSync } from "fs";
import path = require("path");

interface ComputeStackProps extends StackProps {
  vpc: Vpc;
  securityGroup: SecurityGroup;
}

export class ComputeStack extends Stack {
  private instanceRole: Role;
  public autoScalingGroup: AutoScalingGroup;

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
      instanceType: new InstanceType("t3.micro"),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      role: this.instanceRole,
      securityGroup,
      userData,
    });

    this.autoScalingGroup = new AutoScalingGroup(this, "AutoScalingGroup", {
      vpc,
      launchTemplate,
      desiredCapacity: 1,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });
  }
}
