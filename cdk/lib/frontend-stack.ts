import * as cdk from "aws-cdk-lib";
import { CfnOutput, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";

import { S3BucketConstruct } from "./constructs/s3_bucket";
import { CloudFrontConstruct} from "./constructs/cloudfront";

export class FrontendStack extends Stack {
  public readonly cloudFrontUrl: string;
  public readonly cloudFrontDomainName: string;
  public readonly cloudFrontDistributionId: string;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ------------------------------------------------------------
    // Parameters
    // ------------------------------------------------------------
    const projectName = process.env.PROJECT_NAME;
    const environment = process.env.ENVIRONMENT;
    const s3BucketName = process.env.S3_BUCKET_NAME;

    if (!projectName || !environment || !s3BucketName) {
      throw new Error("Missing env vars: PROJECT_NAME / ENVIRONMENT / S3_BUCKET_NAME");
    }

    // ------------------------------------------------------------
    // Tags
    // ------------------------------------------------------------
    Tags.of(this).add("Project", projectName);
    Tags.of(this).add("Env", environment);

    // ------------------------------------------------------------
    // Resources
    // ------------------------------------------------------------

    //バケット名設定
    const bucketNameWithEnv = `${s3BucketName}-${environment}`;

    //S3バケット作成
    const s3Resource = new S3BucketConstruct(this, "S3frontConstruct", {
      bucketName: bucketNameWithEnv,
    });

    //CloudFront作成
    const cloudfrontResource = new CloudFrontConstruct(
      this,
      "CloudFrontConstruct", 
    {
      originBucket: s3Resource.bucket,
      isSpa: true,
      defaultRootObject: "index.html",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200, 
    }
  );

  //CloudFrontDisutributionURLを変数へ格納
    const cloudFrontUrl = `https://${cloudfrontResource.distribution.distributionDomainName}`;

  //CloudFrontArn格納
    const cloudfrontDistributionArn = cdk.Stack.of(this).formatArn({
      service: "cloudfront",
      resource: "distribution",
      resourceName: cloudfrontResource.distribution.distributionId,
      region: "",
      account: cdk.Stack.of(this).account,
    });

    //S3バケットポリシー作成
    s3Resource.grantReadFromCloudFront({
      cloudfrontDistributionArn,
    });

    this.cloudFrontDomainName =
    cloudfrontResource.distribution.distributionDomainName;

    this.cloudFrontUrl = `https://${this.cloudFrontDomainName}`;

    this.cloudFrontDistributionId =
    cloudfrontResource.distribution.distributionId;

    // ------------------------------------------------------------
    // Outputs
    // ------------------------------------------------------------
    new CfnOutput(this, "S3BucketNameOutput", {
      value: s3Resource.bucket.bucketName,
    });

    new CfnOutput(this, "CloudFrontDistributionId", {
      value: cloudfrontResource.distribution.distributionId,
    });

    new CfnOutput(this, "CloudFrontDomainName", {
      value: cloudfrontResource.distribution.distributionDomainName,
    });

    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${cloudfrontResource.distribution.distributionDomainName}`,
    });
  }
}

