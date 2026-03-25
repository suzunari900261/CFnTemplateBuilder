#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { FrontendStack } from '../lib/frontend-stack';
import { AuthStack } from '../lib/auth-stack'

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};

const frontendStack = new FrontendStack(app, 'CFnTemplateBuilder-FrontendStack', {
  env,
});

new AuthStack(app, 'CFnTemplateBuilder-AuthStack', {
  env,
  projectName: process.env.PROJECT_NAME!,
  environment: process.env.ENVIRONMENT!,
  callbackUrls: [`${frontendStack.cloudFrontUrl}/callback`],
  logoutUrls: [`${frontendStack.cloudFrontUrl}/logout`],
});

app.synth();
