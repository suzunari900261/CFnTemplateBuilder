#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region  = process.env.CDK_DEFAULT_REGION;

if (!account || !region) {
  throw new Error(
    `Missing env. account=${account ?? "undefined"}, region=${region ?? "undefined"}`
  );
}

new FrontendStack(app, 'CFnTemplateBuilder-FrontendStack', {
  env: { account, region },
  crossRegionReferences: true,
});

app.synth();
