import * as cdk from "aws-cdk-lib";
import { CfnOutput, CfnParameter, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";

import { S3BucketConstruct } from "./constructs/s3_bucket";
import { CloudFrontConstruct} from "./constructs/cloudfront";

export class FrontendStack extends Stack {
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
    Tags.of(this).add("Project", projectName.valueAsString);
    Tags.of(this).add("Env", environment.valueAsString);

    // ------------------------------------------------------------
    // Resources
    // ------------------------------------------------------------

    //S3バケット名作成
    const bucketNameWithEnv = cdk.Fn.join("-",[
      s3BucketName.valueAsString,
      environment.valueAsString,
    ]);

    //S3バケット作成
    const s3Construct = new S3BucketConstruct(this, "S3frontConstruct", {
      bucketName: bucketNameWithEnv,
    });

    //CloudFront作成
    const cloudfrontConstruct = new CloudFrontConstruct(
      this,
      "CloudFrontConstruct", 
    {
      originBucket: s3Construct.bucket,
      isSpa: true,
      defaultRootObject: "index.html",
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200, 
    }
  );

  //CloudFrontArn格納
    const cloudfrontDistributionArn = cdk.Stack.of(this).formatArn({
      service: "cloudfront",
      resource: "distribution",
      resourceName: cloudfrontConstruct.distribution.distributionId,
      region: "",
      account: cdk.Stack.of(this).account,
    });

    //S3バケットポリシー作成
    s3Construct.grantReadFromCloudFront({
      cloudfrontDistributionArn,
    });

    // ------------------------------------------------------------
    // Outputs
    // ------------------------------------------------------------
    new CfnOutput(this, "S3BucketNameOutput", {
      value: s3Construct.bucket.bucketName,
    });

    new CfnOutput(this, "CloudFrontDistributionId", {
      value: cloudfrontConstruct.distribution.distributionId,
    });

    new CfnOutput(this, "CloudFrontDomainName", {
      value: cloudfrontConstruct.distribution.distributionDomainName,
    });

    new CfnOutput(this, "CloudFrontUrl", {
      value: `https://${cloudfrontConstruct.distribution.distributionDomainName}`,
    });
  }
}

