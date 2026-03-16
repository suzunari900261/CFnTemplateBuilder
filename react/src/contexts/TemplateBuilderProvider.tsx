import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type S3UseCase =
  | "general"
  | "cloudfront"
  | "static-website"
  | "logging"
  | "backup";

type EncryptionType = "NONE" | "SSE-S3" | "SSE-KMS";
type S3ViewMode = "form" | "preview";

type TagItem = {
  key: string;
  value: string;
};

export type BucketFormGroup = {
  id: string;
  useCase: S3UseCase;
  bucketId: string;
  bucketName: string;
  deletepolicy: boolean;
  updatepolicy: boolean;
  versioning: boolean;
  blockPublicAccess: boolean;
  encryptionType: EncryptionType;
  kmsKeyArn: string;
  tags: TagItem[];
  lifecycleEnabled: boolean;
  expirationDays: number;
  corsEnabled: boolean;
  corsAllowedOrigins: string;
  corsAllowedMethods: string;
  corsAllowedHeaders: string;
  accessLoggingEnabled: boolean;
  logBucketName: string;
  logPrefix: string;
  websiteHostingEnabled: boolean;
  indexDocument: string;
  errorDocument: string;
  createBucketPolicy: boolean;
  allowedPrincipalArn: string;
  allowCloudFrontReadOnly: boolean;
  isUseCaseHelpOpen: boolean;
};

type CloudFrontUseCase =
  | "general"
  | "s3-private"
  | "static-website"
  | "alb"
  | "api";

type CloudFrontViewMode = "form" | "preview";
type OriginType = "s3" | "custom";
type PriceClass = "PriceClass_All" | "PriceClass_200" | "PriceClass_100";
type ViewerProtocolPolicy = "allow-all" | "redirect-to-https" | "https-only";
type HttpVersion = "http1.1" | "http2" | "http2and3" | "http3";
type AllowedMethodsPreset = "GET_HEAD" | "GET_HEAD_OPTIONS" | "ALL";
type MinimumProtocolVersion =
  | "TLSv1"
  | "TLSv1.1_2016"
  | "TLSv1.2_2018"
  | "TLSv1.2_2021";
type SslSupportMethod = "sni-only" | "vip" | "static-ip";

export type CloudFrontFormGroup = {
  id: string;
  useCase: CloudFrontUseCase;
  distributionId: string;
  comment: string;
  enabled: boolean;
  priceClass: PriceClass;
  httpVersion: HttpVersion;
  defaultRootObject: string;
  originType: OriginType;
  originId: string;
  originDomainName: string;
  originPath: string;
  viewerProtocolPolicy: ViewerProtocolPolicy;
  compress: boolean;
  allowedMethodsPreset: AllowedMethodsPreset;
  cachePolicyId: string;
  originRequestPolicyId: string;
  responseHeadersPolicyId: string;
  aliasesEnabled: boolean;
  aliasesText: string;
  acmCertificateEnabled: boolean;
  acmCertificateArn: string;
  minimumProtocolVersion: MinimumProtocolVersion;
  sslSupportMethod: SslSupportMethod;
  loggingEnabled: boolean;
  logBucket: string;
  logPrefix: string;
  includeCookies: boolean;
  webAclEnabled: boolean;
  webAclArn: string;
  createOac: boolean;
  oacId: string;
  oacName: string;
  oacDescription: string;
  signingBehavior: "always" | "never" | "no-override";
  signingProtocol: "sigv4";
  customHeadersEnabled: boolean;
  customHeadersText: string;
  ipv6Enabled: boolean;
  isIpv6Enabled: boolean;
  isUseCaseHelpOpen: boolean;
};

type TemplateBuilderState = {
  s3ViewMode: S3ViewMode;
  setS3ViewMode: React.Dispatch<React.SetStateAction<S3ViewMode>>;
  s3Groups: BucketFormGroup[];
  setS3Groups: React.Dispatch<React.SetStateAction<BucketFormGroup[]>>;

  cloudFrontViewMode: CloudFrontViewMode;
  setCloudFrontViewMode: React.Dispatch<React.SetStateAction<CloudFrontViewMode>>;
  cloudFrontGroups: CloudFrontFormGroup[];
  setCloudFrontGroups: React.Dispatch<React.SetStateAction<CloudFrontFormGroup[]>>;
};

const STORAGE_KEY = "cfn-template-builder-state-v1";

function createS3EmptyGroup(index: number): BucketFormGroup {
  return {
    id: `bucket-group-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    useCase: "general",
    bucketId: `S3Bucket${String(index + 1).padStart(2, "0")}`,
    bucketName: "",
    deletepolicy: true,
    updatepolicy: true,
    versioning: true,
    blockPublicAccess: true,
    encryptionType: "SSE-S3",
    kmsKeyArn: "",
    tags: [],
    lifecycleEnabled: false,
    expirationDays: 30,
    corsEnabled: false,
    corsAllowedOrigins: "*",
    corsAllowedMethods: "GET,HEAD,PUT,POST",
    corsAllowedHeaders: "*",
    accessLoggingEnabled: false,
    logBucketName: "",
    logPrefix: "s3-access-logs/",
    websiteHostingEnabled: false,
    indexDocument: "index.html",
    errorDocument: "error.html",
    createBucketPolicy: false,
    allowedPrincipalArn: "",
    allowCloudFrontReadOnly: false,
    isUseCaseHelpOpen: false,
  };
}

function createCloudFrontEmptyGroup(index: number): CloudFrontFormGroup {
  return {
    id: `cloudfront-group-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 8)}`,
    useCase: "general",
    distributionId: `CloudFrontDistribution${String(index + 1).padStart(2, "0")}`,
    comment: "",
    enabled: true,
    priceClass: "PriceClass_200",
    httpVersion: "http2",
    defaultRootObject: "index.html",
    originType: "s3",
    originId: `S3Origin${String(index + 1).padStart(2, "0")}`,
    originDomainName: "",
    originPath: "",
    viewerProtocolPolicy: "redirect-to-https",
    compress: true,
    allowedMethodsPreset: "GET_HEAD",
    cachePolicyId: "658327ea-f89d-4fab-a63d-7e88639e58f6",
    originRequestPolicyId: "",
    responseHeadersPolicyId: "",
    aliasesEnabled: false,
    aliasesText: "",
    acmCertificateEnabled: false,
    acmCertificateArn: "",
    minimumProtocolVersion: "TLSv1.2_2021",
    sslSupportMethod: "sni-only",
    loggingEnabled: false,
    logBucket: "",
    logPrefix: "cloudfront-logs/",
    includeCookies: false,
    webAclEnabled: false,
    webAclArn: "",
    createOac: false,
    oacId: `CloudFrontOAC${String(index + 1).padStart(2, "0")}`,
    oacName: `cloudfront-oac-${String(index + 1).padStart(2, "0")}`,
    oacDescription: "Origin Access Control for S3 origin",
    signingBehavior: "always",
    signingProtocol: "sigv4",
    customHeadersEnabled: false,
    customHeadersText: "",
    ipv6Enabled: true,
    isIpv6Enabled: true,
    isUseCaseHelpOpen: false,
  };
}

function getInitialState() {
  if (typeof window === "undefined") {
    return {
      s3ViewMode: "form" as S3ViewMode,
      s3Groups: [] as BucketFormGroup[],
      cloudFrontViewMode: "form" as CloudFrontViewMode,
      cloudFrontGroups: [] as CloudFrontFormGroup[],
    };
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    return {
      s3ViewMode: "form" as S3ViewMode,
      s3Groups: [] as BucketFormGroup[],
      cloudFrontViewMode: "form" as CloudFrontViewMode,
      cloudFrontGroups: [] as CloudFrontFormGroup[],
    };
  }

  try {
    const parsed = JSON.parse(saved);

    return {
      s3ViewMode: parsed.s3ViewMode ?? "form",
      s3Groups: Array.isArray(parsed.s3Groups) ? parsed.s3Groups : [],
      cloudFrontViewMode: parsed.cloudFrontViewMode ?? "form",
      cloudFrontGroups: Array.isArray(parsed.cloudFrontGroups)
        ? parsed.cloudFrontGroups
        : [],
    };
  } catch {
    return {
      s3ViewMode: "form" as S3ViewMode,
      s3Groups: [] as BucketFormGroup[],
      cloudFrontViewMode: "form" as CloudFrontViewMode,
      cloudFrontGroups: [] as CloudFrontFormGroup[],
    };
  }
}

const TemplateBuilderContext = createContext<TemplateBuilderState | null>(null);

export function TemplateBuilderProvider({
  children,
}: {
  children: ReactNode;
}) {
  const initial = getInitialState();

  const [s3ViewMode, setS3ViewMode] = useState<S3ViewMode>(initial.s3ViewMode);
  const [s3Groups, setS3Groups] = useState<BucketFormGroup[]>(initial.s3Groups);

  const [cloudFrontViewMode, setCloudFrontViewMode] =
    useState<CloudFrontViewMode>(initial.cloudFrontViewMode);
  const [cloudFrontGroups, setCloudFrontGroups] = useState<CloudFrontFormGroup[]>(
    initial.cloudFrontGroups
  );

  useEffect(() => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        s3ViewMode,
        s3Groups,
        cloudFrontViewMode,
        cloudFrontGroups,
      })
    );
  }, [s3ViewMode, s3Groups, cloudFrontViewMode, cloudFrontGroups]);

  const value = useMemo(
    () => ({
      s3ViewMode,
      setS3ViewMode,
      s3Groups,
      setS3Groups,
      cloudFrontViewMode,
      setCloudFrontViewMode,
      cloudFrontGroups,
      setCloudFrontGroups,
    }),
    [s3ViewMode, s3Groups, cloudFrontViewMode, cloudFrontGroups]
  );

  return (
    <TemplateBuilderContext.Provider value={value}>
      {children}
    </TemplateBuilderContext.Provider>
  );
}

export function useTemplateBuilder() {
  const context = useContext(TemplateBuilderContext);
  if (!context) {
    throw new Error("useTemplateBuilder must be used within TemplateBuilderProvider");
  }
  return context;
}

export function createInitialS3Group(index = 0) {
  return createS3EmptyGroup(index);
}

export function createInitialCloudFrontGroup(index = 0) {
  return createCloudFrontEmptyGroup(index);
}