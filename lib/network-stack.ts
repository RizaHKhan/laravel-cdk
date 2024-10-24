import { Stack, StackProps } from "aws-cdk-lib";
import {
  IpAddresses,
  Peer,
  Port,
  SecurityGroup,
  SubnetType,
  Vpc,
} from "aws-cdk-lib/aws-ec2";
import { Construct } from "constructs";

export class NetworkStack extends Stack {
  public vpc: Vpc;
  public securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new Vpc(this, "VPC", {
      vpcName: "laravel-vpc",
      ipAddresses: IpAddresses.cidr("10.0.0.0/16"),
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: "Public",
          cidrMask: 24,
          subnetType: SubnetType.PUBLIC,
        },
        {
          name: "Private",
          cidrMask: 24,
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    this.securityGroup = new SecurityGroup(this, "SecurityGroup", {
      vpc: this.vpc,
      allowAllOutbound: true,
      securityGroupName: "laravel-sg",
    });

    this.securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(443),
      "Allow HTTPS",
    );

    this.securityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(80),
      "Allow HTTP",
    );

    // Restrict SSH access to EC2 Instance Connect service IP addresses for the region
    this.securityGroup.addIngressRule(
      Peer.ipv4("0.0.0.0/0"),
      Port.tcp(22),
      "Allow SSH from EC2 Instance Connect IPs",
    );
  }
}
