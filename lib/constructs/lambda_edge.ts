import { Construct } from "constructs";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import * as path from "path";
import * as fs from "fs";

export interface EdgeAuthConstructProps {
  readonly cognitoDomain: string;
  readonly userPoolClientId: string;
}

export class EdgeAuthConstruct extends Construct {
  public readonly edgeFn: cloudfront.experimental.EdgeFunction;

  constructor(scope: Construct, id: string, props: EdgeAuthConstructProps) {
    super(scope, id);

    const entry = path.join(process.cwd(), "lib", "lambda_edge", "edge-auth", "index.js");
    const template = fs.readFileSync(entry, "utf8");

    const inlined = template
      .replace(/"__COGNITO_DOMAIN__"/g, JSON.stringify(props.cognitoDomain))
      .replace(/"__CLIENT_ID__"/g, JSON.stringify(props.userPoolClientId));

    this.edgeFn = new cloudfront.experimental.EdgeFunction(this, "AuthEdgeFn", {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: "index.handler",
      code: lambda.Code.fromInline(inlined),
    });
  }
}