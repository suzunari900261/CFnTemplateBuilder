import { Construct } from "constructs";
import { Stack, RemovalPolicy, aws_cognito as cognito } from "aws-cdk-lib";

export interface CognitoConstructProps {
  readonly callbackUrls: string[];
  readonly logoutUrls?: string[];
  readonly cognitoDomainPrefix: string;
  readonly userPoolName: string;
}

export class CognitoConstruct extends Construct {
  public readonly userPool: cognito.UserPool;
  public readonly userPoolClient: cognito.UserPoolClient;
  public readonly issuerUrl: string;
  public readonly hostedUiBaseUrl: string;

  constructor(scope: Construct, id: string, props: CognitoConstructProps) {
    super(scope, id);

    this.userPool = new cognito.UserPool(this, "UserPool", {
      userPoolName: props.userPoolName,
      selfSignUpEnabled: true,
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
      },
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool: this.userPool,
      generateSecret: false,
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
        logoutUrls: props.logoutUrls ?? [],
      },
    });

    const domain = this.userPool.addDomain("HostedUiDomain", {
      cognitoDomain: {
        domainPrefix: props.cognitoDomainPrefix,
      },
      managedLoginVersion: cognito.ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

    new cognito.CfnManagedLoginBranding(this, "ManagedLoginBranding", {
      userPoolId: this.userPool.userPoolId,
      clientId: this.userPoolClient.userPoolClientId,
      useCognitoProvidedValues: true,
    }).addDependency(domain.node.defaultChild as cognito.CfnUserPoolDomain);

    const region = Stack.of(this).region;
    this.hostedUiBaseUrl = `https://${props.cognitoDomainPrefix}.auth.${region}.amazoncognito.com`;
    this.issuerUrl = this.userPool.userPoolProviderUrl;
  }
}