#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const account = process.env.CDK_DEFAULT_ACCOUNT;
const region  = process.env.CDK_DEFAULT_REGION;

new FrontendStack(app, 'CFnTemplateBuilder-FrontendStack', {
  env: { account, region },
  crossRegionReferences: true,
});

app.synth();
