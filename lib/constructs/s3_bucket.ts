import { RemovalPolicy } from "aws-cdk-lib";
import { Construct} from "constructs";
import * as s3 from "aws-cdk-lib/aws-s3";

export interface S3ConstructProps {
    bucketName: string;
}

//------------------------------------------------------------
//S3Bucket
//------------------------------------------------------------

export class S3BucketConstruct extends Construct {
    public readonly bucket: s3.Bucket;

    constructor(scope: Construct, id: string, props: S3BucketConstructProps){
        super(scope, id);

        this.bucket = new s3.Bucket(this,"Bucket",{
            bucketName: props.bucketName,
            removalPolicy: RemovalPolicy.RETAIN,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        });
    }
}