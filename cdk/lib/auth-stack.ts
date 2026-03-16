import * as cdk from "aws-cdk-lib";
import { CfnOutput, Stack, StackProps, Tags } from "aws-cdk-lib";
import { Construct } from "constructs";

import { CognitoConstruct } from "./constructs/cognito";

interface AuthStackProps extends StackProps {
    projectName: string;
    environment: string;
    callbackUrls: string[];
    logoutUrls: string[];
}

export class AuthStack extends Stack {
  constructor(scope: Construct, id: string, props?: AuthStackProps) {
    super(scope, id, props);

    Tags.of(this).add("Project", props.projectName);
    Tags.of(this).add("Env", props.environment);

    const userPoolName = `${props.projectName}-userpool-${props.environment}`;
    
    //Cognito作成
    const cognitoResource = new CognitoConstruct(this, "CognitoConstruct", {
      userPoolName,
      callbackUrls: props.callbackUrls,
      logoutUrls: props.logoutUrls,
      cognitoDomainPrefix: `${props.projectName}-auth-${props.environment}`,
    });

    // ------------------------------------------------------------
    // Outputs
    // ------------------------------------------------------------
    new CfnOutput(this, "UserPoolId", {
      value: cognitoResource.userPool.userPoolId,
    });

    new CfnOutput(this, "UserPoolClientId", {
      value: cognitoResource.userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, "IssuerUrl", {
      value: cognitoResource.issuerUrl,
    });
  }
}