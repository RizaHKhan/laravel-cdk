#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { NetworkStack } from "../lib/network-stack";
import { ComputeStack } from "../lib/compute-stack";

const app = new cdk.App();

const network = new NetworkStack(app, "NetworkStack", {});
const compute = new ComputeStack(app, "ComputeStack", {});

compute.lauchAppInstance({
  vpc: network.vpc,
  securityGroup: network.securityGroup,
});
