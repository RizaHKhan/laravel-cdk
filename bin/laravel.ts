#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { ComputeStack } from "../lib/compute-stack";
import { DeploymentStack } from "../lib/deployment-stack";

const app = new cdk.App();

const network = new NetworkStack(app, "NetworkStack", {});

const compute = new ComputeStack(app, "ComputeStack", {
  vpc: network.vpc,
  securityGroup: network.securityGroup,
});

new DeploymentStack(app, "DeploymentStack", {
  deploymentGroup: compute.deploymentGroup,
  artifactBucket: compute.artifactBucket,
  sourceArtifact: compute.sourceArtifact,
  buildArtifact: compute.buildArtifact,
});
