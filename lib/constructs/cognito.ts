import { Construct } from "constructs";
import { Stack } from "aws-cdk-lib";
import {
  aws_cognito as cognito,
  Duration,
  RemovalPolicy,
} from "aws-cdk-lib";

import {
  AwsCustomResource,
  AwsCustomResourcePolicy,
  PhysicalResourceId,
} from "aws-cdk-lib/custom-resources";

export interface CognitoConstructProps {
  readonly callbackUrls: string[];
  readonly logoutUrls: string[];
  readonly cognitoDomainPrefix?: string;
  readonly removalPolicy?: RemovalPolicy;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly issuerUrl: string;
  public readonly hostedUiBaseUrl?: string;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    const removalPolicy = props.removalPolicy ?? RemovalPolicy.RETAIN;

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: "cfn-template-builder-users",
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
      removalPolicy,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      generateSecret: false,
      authFlows: {
        userSrp: true,
        userPassword: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.PROFILE,
        ],
        callbackUrls: props.callbackUrls,
        logoutUrls: props.logoutUrls,
      },
      refreshTokenValidity: Duration.days(30),
      accessTokenValidity: Duration.minutes(60),
      idTokenValidity: Duration.minutes(60),
      preventUserExistenceErrors: true,
    });

    if (props.cognitoDomainPrefix) {
      this.userPool.addDomain("HostedUiDomain", {
        cognitoDomain: { domainPrefix: props.cognitoDomainPrefix },
      });
    }

    this.issuerUrl = this.userPool.userPoolProviderUrl;

    const region = Stack.of(this).region;
    this.hostedUiBaseUrl = `https://${props.cognitoDomainPrefix}.auth.${region}.amazoncognito.com`;
  }
}