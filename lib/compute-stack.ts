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

export class ComputeStack extends Stack {
  private instanceRole: Role;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.instanceRole = new Role(this, "InstanceRole", {
      assumedBy: new ServicePrincipal("ec2.amazonaws.com"),
      managedPolicies: [
        ManagedPolicy.fromAwsManagedPolicyName("AmazonSSMManagedInstanceCore"),
      ],
    });
  }

  lauchAppInstance({
    vpc,
    securityGroup,
  }: {
    vpc: Vpc;
    securityGroup: SecurityGroup;
  }): void {
    const script = readFileSync(path.join(__dirname, '../scripts/laravel.sh'), 'utf8');

    const userData = UserData.custom(script)

    const launchTemplate = new LaunchTemplate(this, "AppInstance", {
      instanceType: new InstanceType("t3.micro"),
      machineImage: new AmazonLinuxImage({
        generation: AmazonLinuxGeneration.AMAZON_LINUX_2023,
      }),
      role: this.instanceRole,
      securityGroup,
      userData
    });

    new AutoScalingGroup(this, "AutoScalingGroup", {
      vpc,
      launchTemplate,
      desiredCapacity: 1,
      vpcSubnets: { subnetType: SubnetType.PUBLIC }
    });
  }
}
