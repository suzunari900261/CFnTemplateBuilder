import * as s3 from "aws-cdk-lib/aws-s3"; //S3関連のクラスをAWS CDK本体ライブラリから取得
import { Construct} from "constructs"; //constructsライブラリの基本クラス
import { RemovalPolicy } from "aws-cdk-lib"; //スタック削除時のリソース削除ポリシー制御用
import * as iam from "aws-cdk-lib/aws-iam";

//S3BucketConstructに渡す設定パラメータ
export interface S3BucketConstructProps {
    bucketName: string;
}

export class S3BucketConstruct extends Construct {
//------------------------------------------------------------
//S3Bucket
//------------------------------------------------------------
//public:クラス外から参照可能
//readonly:一度代入したら再代入できない
//bucket: s3.Bucket:bucket変数にS3.bucket型オブジェクトを入れる
    public readonly bucket: s3.Bucket;

//scope:Constructの親
//id:CDK内で一意となる識別子
//props:外部から渡される設定値
    constructor(scope: Construct, id: string, props: S3BucketConstructProps){
        super(scope, id);//Constructの初期化

//this.bucket:このConstructのプロパティ
//new s3.Bucket:このCostruct配下にBucket作成
        this.bucket = new s3.Bucket(this,"Bucket",{
            bucketName: props.bucketName,//バケット名

            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, //パブリックアクセス全拒否
            publicReadAccess: false, //バケット公開拒否
　　
            encryption: s3.BucketEncryption.S3_MANAGED, //暗号化(S3マネージド)
            enforceSSL: true, //HTTPSのみ許可
            objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
            //ACLを無効化し、バケット所有者を常にオブジェクト所有者にする(推奨設定)

            removalPolicy: RemovalPolicy.RETAIN, //削除ポリシー
            autoDeleteObjects: false,//スタック削除時に自動削除を行わない
        });
    }

//------------------------------------------------------------
//BucketPolicy
//------------------------------------------------------------
//grantReadFromCloudFront呼び出し時に実行
//cloudfrontDistributionArnを文字列で受け取り
    public grantReadFromCloudFront(params: { cloudfrontDistributionArn: string }) {
      this.bucket.addToResourcePolicy( //バケットポリシーにStatement追加
        new iam.PolicyStatement({ //バケットポリシーに追加する Statement を作成
          sid: "AllowCloudFrontServicePrincipalReadOnly",
          principals: [new iam.ServicePrincipal("cloudfront.amazonaws.com")], //CloudFrontサービスプリンシパル許可
          actions: ["s3:GetObject"],//許可アクション
          resources: [`${this.bucket.bucketArn}/*`],//許可リソース
          conditions: {
            StringEquals: {
              "AWS:SourceArn": params.cloudfrontDistributionArn,//許可CloudFrontArn
            },
          },
        })
      );
    }
}