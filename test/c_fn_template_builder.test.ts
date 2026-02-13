import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { FrontendStack } from '../lib/frontend-stack';

test('S3 Bucket is created', () => {
  const app = new cdk.App();

  const stack = new FrontendStack(app, 'TestStack', {
    env: {
      region: 'ap-northeast-1', // リージョンのみ指定
    },
  });

  const template = Template.fromStack(stack);

  template.resourceCountIs('AWS::S3::Bucket', 1);
});
