import * as cdk from "aws-cdk-lib";
import { CfnOutput, CfnParameter, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";
import { RemovalPolicy } from "aws-cdk-lib";

import { S3BucketConstruct } from "./constructs/s3_bucket";
import { CloudFrontConstruct} from "./constructs/cloudfront";
import { CognitoConstruct } from "./constructs/cognito";

export class FrontendStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // ------------------------------------------------------------
    // Parameters
    // ------------------------------------------------------------
    const projectName = new CfnParameter(this, "ProjectName", {
      type: "String",
      description: "Project name for tagging and resource naming",
    });

    const environment = new CfnParameter(this, "Environment", {
      type: "String",
      default: "prod",
      allowedValues: ["dev", "prod"],
      description: "Deployment environment",
    });

    const s3BucketName = new CfnParameter(this, "S3BucketName", {
      type: "String",
      description: "S3 bucket name for static hosting",
    });

    // ------------------------------------------------------------
    // Tags
    // ------------------------------------------------------------
    Tags.of(this).add("Project", projectName.valueAsString);
    Tags.of(this).add("Env", environment.valueAsString);

    // ------------------------------------------------------------
    // Resources
    // ------------------------------------------------------------

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

  //CloudFrontDisutributionArnを変数へ格納
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

    const CognitoResource = new CognitoConstruct(this, "CognitoConstruct", {
      callbackUrls: [`${CloudFrontUrl}/callback`],
      logoutUrls: [`${CloudFrontUrl}/logout`],
      cognitoDomainPrefix: `cfn-templatebuilder-auth-${environment.valueAsString}`,
      removalPolicy: RemovalPolicy.RETAIN,
    })

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

    new CfnOutput(this, "UserPoolId", {
      value: CognitoResource.userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: CognitoResource.userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "IssuerUrl", {
      value: CognitoResource.issuerUrl
    });
  }
}

