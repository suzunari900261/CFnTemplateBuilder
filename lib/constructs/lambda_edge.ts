import { Construct } from "constructs";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";
import { aws_lambda as lambda } from "aws-cdk-lib";
import * as path from "path";

export class EdgeAuthConstruct extends Construct {
    public readonly edgeFn: cloudfront.experimental.EdgeFunction;

    constructor(scope: Construct, id: string) {
        super(scope, id);

        this.edgeFn = new cloudfront.experimental.EdgeFunction(this, "AuthEdgeFn", {
            runtime: lambda.Runtime.NODEJS_18_X,
            handler: "index.handler",
            code: lambda.Code.fromAsset(
                path.join(__dirname, "../lambda_edge/edge-auth")
            ),
        });
    }
}