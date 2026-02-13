import * as cdk from "aws-cdk-lib";
import { CfnOutput, CfnParameter, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";

import { S3BucketConstruct } from "./constructs/s3_bucket";

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

    const s3Construct = new S3BucketConstruct(this, "S3frontConstruct", {
      bucketName: bucketNameWithEnv,
    });

    // ------------------------------------------------------------
    // Outputs
    // ------------------------------------------------------------
    new CfnOutput(this, "S3BucketNameOutput", {
      value: s3Construct.bucket.bucketName,
    });
  }
}

