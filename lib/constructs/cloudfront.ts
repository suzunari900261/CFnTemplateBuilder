//AWS CDKライブラリ読み込み
import { Construct } from "constructs"; //constructsライブラリの基本クラス
import { //CDK本体ライブラリから各サービスを読み込み
  aws_cloudfront as cloudfront, //CloudFront関連のクラスをcloudfrontと言う名前空間で使用
  aws_cloudfront_origins as origins, //CloudFrontのOrigin(オリジン設定用ヘルパー)
  aws_s3 as s3, //S3関連のクラスをs3と言う名前空間で使用
  Duration, //CDKで時間指定(TTL)をするためのユーティリティ
} from "aws-cdk-lib"; //AWS CDK本体ライブラリ

import { aws_lambda as lambda } from "aws-cdk-lib"; //Lambda関連のクラスをlambdaと言う名前空間で使用

//CloudFrontConstructに渡す設定パラメータ
export interface CloudFrontConstructProps {
  readonly originBucket: s3.IBucket; //CloudFront配信元S3バケット
  //Bucket:CDKで新規作成した実態
  //IBucket:既存含めバケットとして使えるもの
  readonly isSpa?: boolean; //SPA向け設定
  readonly defaultRootObject?: string; //デフォルトルートオブジェクト
  readonly priceClass?: cloudfront.PriceClass; //CloudFrontの配信エッジの範囲
  readonly edgeAuthFunctionVersion?: lambda.IVersion; //Lambda@Edgeのversion
}

//------------------------------------------------------------
//CloudFront
//------------------------------------------------------------
export class CloudFrontConstruct extends Construct {
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: CloudFrontConstructProps) {
//scope:Constructの親
//id:CDK内で一意となる識別子
//props:外部から渡される設定値
    super(scope, id); //Constructの初期化

    //ルートURL,propsで指定が無ければ"index.html"使用
    const defaultRootObject = props.defaultRootObject ?? "index.html";
    //SPA向け設定フラグ,未設定の場合はtrue
    const isSpa = props.isSpa ?? true;
    //セキュリティレスポンスヘッダー
    const responseHeadersPolicy = new cloudfront.ResponseHeadersPolicy(
      this,
      "SecurityHeadersPolicy", 
      {
        securityHeadersBehavior: { //セキュリティヘッダー設定
          //nosniff（MIMEタイプ推測禁止）
          contentTypeOptions: { override: true },
          //iframe禁止（クリックジャッキング対策）
          frameOptions: {
            frameOption: cloudfront.HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: { //参照元URLを送らない（情報漏えい防止）
            referrerPolicy: cloudfront.HeadersReferrerPolicy.NO_REFERRER,
            override: true,
          },
          strictTransportSecurity: { //HTTPS通信を強制（HSTS）
            accessControlMaxAge: Duration.days(365), //有効期間1年
            includeSubdomains: true, //サブドメイン含む
            preload: true, //ブラウザpreload対象
            override: true,
          },
          xssProtection: { //XSS攻撃検知時にブロック（旧ブラウザ向け）
            protection: true,
            modeBlock: true,
            override: true,
          },
        },
      }
    );

    //Origin設定(OACアクセス制限)
    const origin = origins.S3BucketOrigin.withOriginAccessControl(
      props.originBucket
    );

    //CloudFront Distribution作成
    this.distribution = new cloudfront.Distribution(this, "Distribution", {
      defaultRootObject, // "/" へのアクセス時に返すファイル
      priceClass: props.priceClass ?? cloudfront.PriceClass.PRICE_CLASS_200, //配信エッジ範囲（コスト制御）未指定なら200
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021, //最低TLSバージョン（古いTLSを許可しない）

      // Default behavior
      defaultBehavior: {
        origin, //S3Bucket
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS, //HTTPアクセスはHTTPSへリダイレクト
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS, //静的サイト想定：GET/HEAD/OPTIONSのみ許可
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED, //CloudFront推奨の最適化キャッシュ
        compress: true, //圧縮転送（gzip/brotli）
        responseHeadersPolicy, //レスポンスにセキュリティヘッダー付与

        edgeLambdas: props.edgeAuthFunctionVersion
          ? [
              {
                functionVersion: oprops.edgeAuthFunctionVersion,
                eventType: cloudfront.LambdaEdgeEventType.VIEWER_REQUEST,
              },
          ]
        : undefined,
      },

      // SPA向けフォールバック設定
      errorResponses: isSpa
        ? [
            {
              httpStatus: 403, //S3のアクセス拒否
              responseHttpStatus: 200, //ブラウザには成功として返す
              responsePagePath: `/${defaultRootObject}`, //index.htmlへフォールバック
              ttl: Duration.minutes(1), //短めのTTL（反映を早める）
            },
            {
              httpStatus: 404, //Not Found
              responseHttpStatus: 200,
              responsePagePath: `/${defaultRootObject}`,
              ttl: Duration.minutes(1),
            },
          ]
        : undefined, //SPAでなければ通常のエラー応答
    });
  }
}