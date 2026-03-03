#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';

const app = new cdk.App();

const account = process.env.AWS_ACCOUNT;
const region = process.env.AWS_REGION;

const env: cdk.Environment = {
  account,
  region,
};

new FrontendStack(app, 'CFnTemplateBuilder-FrontendStack', {
  env,
  crossRegionReferences: true,
});

app.synth();
