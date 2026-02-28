import * as cdk from "aws-cdk-lib";
import { Match, Template } from "aws-cdk-lib/assertions";
import { FrontendStack } from "../lib/frontend-stack";

describe("FrontendStack (S3 + CloudFront OAC)", () => {
  const synth = () => {
    const app = new cdk.App();

    const stack = new FrontendStack(app, "TestStack", {
      env: { region: "ap-northeast-1" },
    });

    return Template.fromStack(stack);
  };

  test("S3 Bucket is created", () => {
    const template = synth();
    template.resourceCountIs("AWS::S3::Bucket", 1);
  });

  test("S3 Bucket has private + secure settings", () => {
    const template = synth();

    template.hasResourceProperties("AWS::S3::Bucket", {
      // Block public access
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },

      // SSE-S3 encryption (S3_MANAGED)
      BucketEncryption: {
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: { SSEAlgorithm: "AES256" },
          }),
        ]),
      },

      // ObjectOwnership: BUCKET_OWNER_ENFORCED
      OwnershipControls: {
        Rules: Match.arrayWith([
          Match.objectLike({ ObjectOwnership: "BucketOwnerEnforced" }),
        ]),
      },
    });
  });

  test("BucketPolicy enforces SSL and allows CloudFront distribution read (OAC)", () => {
    const template = synth();

    // BucketPolicy 自体が作られていること（enforceSSL や addToResourcePolicy により生成される）
    template.resourceCountIs("AWS::S3::BucketPolicy", 1);

    template.hasResourceProperties("AWS::S3::BucketPolicy", {
      PolicyDocument: {
        Statement: Match.arrayWith([
          // enforceSSL: true により HTTP を拒否する Deny が入ることが多い
          Match.objectLike({
            Effect: "Deny",
            Action: "s3:*",
            Condition: Match.objectLike({
              Bool: Match.objectLike({
                "aws:SecureTransport": "false",
              }),
            }),
          }),

          // grantReadFromCloudFront() で追加した Allow
          Match.objectLike({
            Sid: "AllowCloudFrontServicePrincipalReadOnly",
            Effect: "Allow",
            Action: "s3:GetObject",
            Principal: { Service: "cloudfront.amazonaws.com" },
            Resource: Match.anyValue(), // arn:...:bucket/* になる（Join等）
            Condition: {
              StringEquals: {
                "AWS:SourceArn": Match.anyValue(), // formatArn の結果（Join/Ref を含む）
              },
            },
          }),
        ]),
      },
    });
  });

  test("CloudFront Distribution and OAC are created", () => {
    const template = synth();

    template.resourceCountIs("AWS::CloudFront::Distribution", 1);

    // OACを使っている場合、多くの構成で OriginAccessControl リソースが作られる
    template.resourceCountIs("AWS::CloudFront::OriginAccessControl", 1);

    // ついでに defaultRootObject など軽く確認（必要なら）
    template.hasResourceProperties("AWS::CloudFront::Distribution", {
      DistributionConfig: Match.objectLike({
        DefaultRootObject: "index.html",
        Enabled: true,
      }),
    });
  });
});
