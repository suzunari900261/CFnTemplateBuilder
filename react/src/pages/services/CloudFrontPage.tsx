import { useMemo } from "react";
import { useTemplateBuilder } from "../../contexts/TemplateBuilderProvider";

import CloudFrontIcon from "../../assets/AWS/amazon_cloudfront.svg";
import HelpIcon from "../../assets/help.svg";

type UseCase =
  | "general"
  | "s3-private"
  | "static-website"
  | "alb"
  | "api";

type ViewMode = "form" | "preview";

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

type CloudFrontFormGroup = {
  id: string;
  useCase: UseCase;
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


type SelectableS3Bucket = {
  id: string;
  bucketId: string;
  bucketName: string;
  websiteHostingEnabled: boolean;
  originType: OriginType;
  suggestedDomainName: string;
  label: string;
};

function buildSuggestedS3OriginDomainName(
  bucketName: string,
  websiteHostingEnabled: boolean
) {
  const normalizedBucketName = bucketName.trim();

  if (!normalizedBucketName) {
    return "";
  }

  if (websiteHostingEnabled) {
    return `${normalizedBucketName}.s3-website-ap-northeast-1.amazonaws.com`;
  }

  return `${normalizedBucketName}.s3.amazonaws.com`;
}

function isValidCfnLogicalId(value: string) {
  return /^[A-Za-z][A-Za-z0-9]{0,254}$/.test(value);
}

function normalizeLogicalId(value: string) {
  return value.trim();
}

function normalizeDomainName(value: string) {
  return value.trim().toLowerCase();
}

function toYamlScalar(value: string) {
  if (!value) return "''";
  if (/^[A-Za-z0-9._:/=+\-@*]+$/.test(value)) {
    return value;
  }
  return `'${value.replace(/'/g, "''")}'`;
}

function splitCsv(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAllowedMethods(methodPreset: AllowedMethodsPreset) {
  switch (methodPreset) {
    case "GET_HEAD":
      return ["GET", "HEAD"];
    case "GET_HEAD_OPTIONS":
      return ["GET", "HEAD", "OPTIONS"];
    case "ALL":
      return ["GET", "HEAD", "OPTIONS", "PUT", "PATCH", "POST", "DELETE"];
  }
}

function getCachedMethods(methodPreset: AllowedMethodsPreset) {
  switch (methodPreset) {
    case "GET_HEAD":
      return ["GET", "HEAD"];
    case "GET_HEAD_OPTIONS":
      return ["GET", "HEAD", "OPTIONS"];
    case "ALL":
      return ["GET", "HEAD", "OPTIONS"];
  }
}

function createEmptyGroup(index: number): CloudFrontFormGroup {
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

export default function CloudFrontPage() {
  const {
    s3Groups,
    cloudFrontViewMode: viewMode,
    setCloudFrontViewMode: setViewMode,
    cloudFrontGroups: groups,
    setCloudFrontGroups: setGroups,
  } = useTemplateBuilder();

  const updateGroupField = <K extends keyof CloudFrontFormGroup>(
    groupId: string,
    field: K,
    value: CloudFrontFormGroup[K]
  ) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, [field]: value } : group
      )
    );
  };


  const selectableS3Buckets = useMemo<SelectableS3Bucket[]>(() => {
    return s3Groups
      .map((group): SelectableS3Bucket => {
        const bucketId = typeof group.bucketId === "string" ? group.bucketId.trim() : "";
        const bucketName =
          typeof group.bucketName === "string" ? group.bucketName.trim() : "";
        const websiteHostingEnabled = Boolean(group.websiteHostingEnabled);
        const suggestedDomainName = buildSuggestedS3OriginDomainName(
          bucketName,
          websiteHostingEnabled
        );

        return {
          id: group.id,
          bucketId,
          bucketName,
          websiteHostingEnabled,
          originType: websiteHostingEnabled ? "custom" : "s3",
          suggestedDomainName,
          label: bucketName
            ? `${bucketName}${bucketId ? ` (${bucketId})` : ""}`
            : bucketId || "名称未設定バケット",
        };
      })
      .filter((group) => group.bucketName);
  }, [s3Groups]);

  const applyPreset = (groupId: string, preset: UseCase) => {
    setGroups((prev) =>
      prev.map((group) => {
        if (group.id !== groupId) return group;

        const base = {
          ...group,
          useCase: preset,
        };

        switch (preset) {
          case "general":
            return {
              ...base,
              enabled: true,
              priceClass: "PriceClass_200",
              httpVersion: "http2",
              defaultRootObject: "index.html",
              originType: "s3",
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
              loggingEnabled: false,
              logBucket: "",
              webAclEnabled: false,
              webAclArn: "",
              createOac: false,
              customHeadersEnabled: false,
              customHeadersText: "",
            };

          case "s3-private":
            return {
              ...base,
              enabled: true,
              priceClass: "PriceClass_200",
              httpVersion: "http2",
              defaultRootObject: "index.html",
              originType: "s3",
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
              loggingEnabled: false,
              logBucket: "",
              webAclEnabled: false,
              webAclArn: "",
              createOac: true,
              customHeadersEnabled: false,
              customHeadersText: "",
            };

          case "static-website":
            return {
              ...base,
              enabled: true,
              priceClass: "PriceClass_200",
              httpVersion: "http2",
              defaultRootObject: "index.html",
              originType: "custom",
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
              loggingEnabled: false,
              logBucket: "",
              webAclEnabled: false,
              webAclArn: "",
              createOac: false,
              customHeadersEnabled: false,
              customHeadersText: "",
            };

          case "alb":
            return {
              ...base,
              enabled: true,
              priceClass: "PriceClass_200",
              httpVersion: "http2",
              defaultRootObject: "",
              originType: "custom",
              viewerProtocolPolicy: "redirect-to-https",
              compress: true,
              allowedMethodsPreset: "ALL",
              cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
              originRequestPolicyId: "",
              responseHeadersPolicyId: "",
              aliasesEnabled: false,
              aliasesText: "",
              acmCertificateEnabled: false,
              acmCertificateArn: "",
              loggingEnabled: false,
              logBucket: "",
              webAclEnabled: false,
              webAclArn: "",
              createOac: false,
              customHeadersEnabled: false,
              customHeadersText: "",
            };

          case "api":
            return {
              ...base,
              enabled: true,
              priceClass: "PriceClass_100",
              httpVersion: "http2",
              defaultRootObject: "",
              originType: "custom",
              viewerProtocolPolicy: "https-only",
              compress: true,
              allowedMethodsPreset: "ALL",
              cachePolicyId: "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
              originRequestPolicyId: "",
              responseHeadersPolicyId: "",
              aliasesEnabled: false,
              aliasesText: "",
              acmCertificateEnabled: false,
              acmCertificateArn: "",
              loggingEnabled: false,
              logBucket: "",
              webAclEnabled: false,
              webAclArn: "",
              createOac: false,
              customHeadersEnabled: false,
              customHeadersText: "",
            };
        }
      })
    );
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, createEmptyGroup(prev.length)]);
  };

  const removeGroup = (groupId: string, index: number) => {
    if (window.confirm(`Distribution ${index + 1} の削除を行います。よろしいですか？`)) {
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      window.alert("削除しました");
    }
  };

  const resetGroup = (groupId: string, index: number) => {
    if (window.confirm(`Distribution ${index + 1} を初期化します。よろしいですか？`)) {
      setGroups((prev) =>
        prev.map((group) =>
          group.id === groupId
            ? {
                ...createEmptyGroup(index),
                id: group.id,
              }
            : group
        )
      );
      window.alert("リセットしました");
    }
  };

  const hasError = useMemo(() => {
    if (groups.length === 0) return false;

    return groups.some((group) => {
      const normalizedDistributionId = normalizeLogicalId(group.distributionId);
      const normalizedOriginId = normalizeLogicalId(group.originId);
      const normalizedDomainName = normalizeDomainName(group.originDomainName);

      const distributionIdError =
        normalizedDistributionId &&
        !isValidCfnLogicalId(normalizedDistributionId);

      const distributionIdDuplicate =
        normalizedDistributionId &&
        groups.filter(
          (item) =>
            normalizeLogicalId(item.distributionId) === normalizedDistributionId
        ).length > 1;

      const originIdError =
        normalizedOriginId && !isValidCfnLogicalId(normalizedOriginId);

      const acmCertificateError =
        group.acmCertificateEnabled && !group.acmCertificateArn.trim();

      const loggingError = group.loggingEnabled && !group.logBucket.trim();

      const webAclError = group.webAclEnabled && !group.webAclArn.trim();

      const oacError = group.createOac && group.originType !== "s3";

      const originDomainError = !normalizedDomainName;

      const aliasCertError =
        group.aliasesEnabled &&
        splitCsv(group.aliasesText).length > 0 &&
        !group.acmCertificateEnabled;

      return Boolean(
        distributionIdError ||
          distributionIdDuplicate ||
          originIdError ||
          acmCertificateError ||
          loggingError ||
          webAclError ||
          oacError ||
          originDomainError ||
          aliasCertError
      );
    });
  }, [groups]);

  const warningMessages = useMemo(() => {
    const warnings: string[] = [];

    groups.forEach((group, index) => {
      const prefix = groups.length > 1 ? `Distribution ${index + 1}: ` : "";

      if (group.originType === "custom" && group.createOac) {
        warnings.push(
          `${prefix}Origin Access Control は S3 origin 前提です。Custom origin では利用できません。`
        );
      }

      if (
        group.aliasesEnabled &&
        splitCsv(group.aliasesText).length > 0 &&
        !group.acmCertificateEnabled
      ) {
        warnings.push(
          `${prefix}Alternate Domain Names (CNAME) を使う場合は ACM 証明書も設定するのが一般的です。`
        );
      }

      if (group.viewerProtocolPolicy === "allow-all") {
        warnings.push(
          `${prefix}Viewer Protocol Policy が allow-all です。HTTP アクセスを許可する構成になります。`
        );
      }

      if (group.loggingEnabled && !group.logBucket.trim()) {
        warnings.push(
          `${prefix}Logging を有効にしていますが、ログ保存先バケットが未入力です。`
        );
      }

      if (!group.originDomainName.trim()) {
        warnings.push(`${prefix}Origin Domain Name が未入力です。`);
      }

      const linkedS3Bucket = selectableS3Buckets.find(
        (bucket) => bucket.suggestedDomainName === group.originDomainName.trim()
      );

      if (
        group.originType === "s3" &&
        linkedS3Bucket?.websiteHostingEnabled
      ) {
        warnings.push(
          `${prefix}Static Website Hosting 有効のS3が選択されています。この場合は Custom Origin と website endpoint を使う必要があります。`
        );
      }
    });

    return warnings;
  }, [groups, selectableS3Buckets]);

  const template = useMemo(() => {
    if (groups.length === 0) {
      return "";
    }

    const lines: string[] = [];
    const resources: string[] = [];
    const outputs: string[] = [];

    groups.forEach((group, index) => {
      const resolvedDistributionId =
        group.distributionId.trim() ||
        `CloudFrontDistribution${String(index + 1).padStart(2, "0")}`;

      const resolvedOriginId =
        group.originId.trim() ||
        `Origin${String(index + 1).padStart(2, "0")}`;

      const resolvedOacId =
        group.oacId.trim() ||
        `CloudFrontOAC${String(index + 1).padStart(2, "0")}`;

      const aliases = splitCsv(group.aliasesText);
      const customHeaders = splitCsv(group.customHeadersText);
      const allowedMethods = getAllowedMethods(group.allowedMethodsPreset);
      const cachedMethods = getCachedMethods(group.allowedMethodsPreset);
      const linkedS3Bucket = selectableS3Buckets.find(
        (bucket) => bucket.suggestedDomainName === group.originDomainName.trim()
      );
      const shouldUseLinkedS3GetAtt =
        group.originType === "s3" &&
        Boolean(linkedS3Bucket?.bucketId) &&
        !linkedS3Bucket.websiteHostingEnabled;

      if (group.createOac && group.originType === "s3") {
        resources.push(`  ${resolvedOacId}:`);
        resources.push(`    Type: AWS::CloudFront::OriginAccessControl`);
        resources.push(`    Properties:`);
        resources.push(`      OriginAccessControlConfig:`);
        resources.push(
          `        Name: ${toYamlScalar(
            group.oacName.trim() || `cloudfront-oac-${index + 1}`
          )}`
        );
        resources.push(
          `        Description: ${toYamlScalar(
            group.oacDescription.trim() || "Origin Access Control for S3 origin"
          )}`
        );
        resources.push(`        OriginAccessControlOriginType: s3`);
        resources.push(`        SigningBehavior: ${group.signingBehavior}`);
        resources.push(`        SigningProtocol: ${group.signingProtocol}`);
        resources.push(``);
      }

      resources.push(`  ${resolvedDistributionId}:`);
      resources.push(`    Type: AWS::CloudFront::Distribution`);
      resources.push(`    Properties:`);
      resources.push(`      DistributionConfig:`);
      resources.push(`        Enabled: ${group.enabled ? "true" : "false"}`);

      if (group.comment.trim()) {
        resources.push(`        Comment: ${toYamlScalar(group.comment.trim())}`);
      }

      resources.push(`        PriceClass: ${group.priceClass}`);
      resources.push(`        HttpVersion: ${group.httpVersion}`);
      resources.push(`        IPV6Enabled: ${group.isIpv6Enabled ? "true" : "false"}`);

      if (group.defaultRootObject.trim()) {
        resources.push(
          `        DefaultRootObject: ${toYamlScalar(
            group.defaultRootObject.trim()
          )}`
        );
      }

      if (aliases.length > 0) {
        resources.push(`        Aliases:`);
        aliases.forEach((alias) => {
          resources.push(`          - ${toYamlScalar(alias)}`);
        });
      }

      resources.push(`        Origins:`);
      resources.push(`          - Id: ${toYamlScalar(resolvedOriginId)}`);
      if (shouldUseLinkedS3GetAtt) {
        resources.push(
          `            DomainName: !GetAtt ${linkedS3Bucket!.bucketId}.RegionalDomainName`
        );
      } else {
        resources.push(
          `            DomainName: ${toYamlScalar(group.originDomainName.trim())}`
        );
      }

      if (group.originPath.trim()) {
        resources.push(
          `            OriginPath: ${toYamlScalar(group.originPath.trim())}`
        );
      }

      if (group.originType === "s3") {
        resources.push(`            S3OriginConfig: {}`);
        if (group.createOac) {
          resources.push(`            OriginAccessControlId: !GetAtt ${resolvedOacId}.Id`);
        }
      } else {
        resources.push(`            CustomOriginConfig:`);
        resources.push(`              OriginProtocolPolicy: https-only`);
        resources.push(`              HTTPPort: 80`);
        resources.push(`              HTTPSPort: 443`);
        resources.push(`              OriginSSLProtocols:`);
        resources.push(`                - TLSv1.2`);
      }

      if (group.customHeadersEnabled && customHeaders.length > 0) {
        resources.push(`            OriginCustomHeaders:`);
        customHeaders.forEach((header, headerIndex) => {
          const [name, ...rest] = header.split(":");
          const value = rest.join(":").trim();
          if (name?.trim() && value) {
            resources.push(`              - HeaderName: ${toYamlScalar(name.trim())}`);
            resources.push(`                HeaderValue: ${toYamlScalar(value)}`);
          } else {
            resources.push(
              `              - HeaderName: ${toYamlScalar(
                `X-Custom-Header-${headerIndex + 1}`
              )}`
            );
            resources.push(`                HeaderValue: ${toYamlScalar(header.trim())}`);
          }
        });
      }

      resources.push(`        DefaultCacheBehavior:`);
      resources.push(`          TargetOriginId: ${toYamlScalar(resolvedOriginId)}`);
      resources.push(
        `          ViewerProtocolPolicy: ${group.viewerProtocolPolicy}`
      );
      resources.push(`          Compress: ${group.compress ? "true" : "false"}`);

      resources.push(`          AllowedMethods:`);
      allowedMethods.forEach((method) => {
        resources.push(`            - ${method}`);
      });

      resources.push(`          CachedMethods:`);
      cachedMethods.forEach((method) => {
        resources.push(`            - ${method}`);
      });

      if (group.cachePolicyId.trim()) {
        resources.push(
          `          CachePolicyId: ${toYamlScalar(group.cachePolicyId.trim())}`
        );
      }

      if (group.originRequestPolicyId.trim()) {
        resources.push(
          `          OriginRequestPolicyId: ${toYamlScalar(
            group.originRequestPolicyId.trim()
          )}`
        );
      }

      if (group.responseHeadersPolicyId.trim()) {
        resources.push(
          `          ResponseHeadersPolicyId: ${toYamlScalar(
            group.responseHeadersPolicyId.trim()
          )}`
        );
      }

      if (group.loggingEnabled && group.logBucket.trim()) {
        resources.push(`        Logging:`);
        resources.push(
          `          Bucket: ${toYamlScalar(group.logBucket.trim())}`
        );
        resources.push(
          `          Prefix: ${toYamlScalar(
            group.logPrefix.trim() || "cloudfront-logs/"
          )}`
        );
        resources.push(
          `          IncludeCookies: ${group.includeCookies ? "true" : "false"}`
        );
      }

      if (group.webAclEnabled && group.webAclArn.trim()) {
        resources.push(`        WebACLId: ${toYamlScalar(group.webAclArn.trim())}`);
      }

      if (group.acmCertificateEnabled && group.acmCertificateArn.trim()) {
        resources.push(`        ViewerCertificate:`);
        resources.push(
          `          AcmCertificateArn: ${toYamlScalar(
            group.acmCertificateArn.trim()
          )}`
        );
        resources.push(
          `          MinimumProtocolVersion: ${group.minimumProtocolVersion}`
        );
        resources.push(`          SslSupportMethod: ${group.sslSupportMethod}`);
      } else {
        resources.push(`        ViewerCertificate:`);
        resources.push(`          CloudFrontDefaultCertificate: true`);
      }

      outputs.push(`  ${resolvedDistributionId}Id:`);
      outputs.push(`    Value: !Ref ${resolvedDistributionId}`);
      outputs.push(`  ${resolvedDistributionId}DomainName:`);
      outputs.push(`    Value: !GetAtt ${resolvedDistributionId}.DomainName`);

      if (index !== groups.length - 1) {
        resources.push(``);
      }
    });

    lines.push(`AWSTemplateFormatVersion: '2010-09-09'`);
    lines.push(`Description: CloudFront distributions created by CFnTemplateBuilder`);
    lines.push(``);
    lines.push(`Resources:`);
    lines.push(...resources);
    lines.push(``);
    lines.push(`Outputs:`);
    lines.push(...outputs);

    return lines.join("\n");
  }, [groups]);

  const handleCopy = async () => {
    if (!template) return;

    try {
      await navigator.clipboard.writeText(template);
      window.alert("テンプレートをコピーしました。");
    } catch {
      window.alert("コピーに失敗しました。");
    }
  };

  const isTemplateEmpty = groups.length === 0;

  return (
    <main
      className={`aws-page ${
        viewMode === "preview" ? "preview-mode" : "form-mode"
      }`}
    >
      <div className="aws-page-top">
        <div className="aws-page-title">
          <img src={CloudFrontIcon} className="aws-icon" alt="AmazonCloudFront" />
          <h2>Amazon CloudFront</h2>
        </div>

        <button
          type="button"
          className="preview-toggle-button"
          onClick={() =>
            setViewMode((prev: ViewMode) => (prev === "form" ? "preview" : "form"))
          }
        >
          {viewMode === "form" ? "プレビュー" : "編集に戻る"}
        </button>
      </div>

      {viewMode === "form" && (
        <>
          {groups.length === 0 ? (
            <div className="form-section empty-state-section">
              <div className="group-header">
                <h3>CloudFront Distribution はまだ追加されていません</h3>
              </div>

              <p>
                CloudFrontテンプレートを作成する場合は「追加」ボタンを押して、
                Distribution設定を作成してください。
              </p>

              <button
                type="button"
                className="add-group-button"
                onClick={addGroup}
              >
                追加
              </button>
            </div>
          ) : (
            <>
              {groups.map((group, index) => {
                const normalizedDistributionId = normalizeLogicalId(group.distributionId);
                const normalizedOriginId = normalizeLogicalId(group.originId);
                const selectedS3OriginOption = selectableS3Buckets.find(
                  (bucket) => bucket.suggestedDomainName === group.originDomainName.trim()
                );

                const distributionIdError =
                  normalizedDistributionId &&
                  !isValidCfnLogicalId(normalizedDistributionId)
                    ? "CloudFormationの論理IDは英字で始まり、英数字のみ使用できます。"
                    : "";

                const distributionIdDuplicate =
                  normalizedDistributionId &&
                  groups.filter(
                    (item) =>
                      normalizeLogicalId(item.distributionId) ===
                      normalizedDistributionId
                  ).length > 1
                    ? "IDが他のDistributionと重複しています。"
                    : "";

                const originIdError =
                  normalizedOriginId && !isValidCfnLogicalId(normalizedOriginId)
                    ? "Origin ID は英字で始まり、英数字のみ使用できます。"
                    : "";

                const originDomainError = !group.originDomainName.trim()
                  ? "Origin Domain Name を入力してください。"
                  : "";

                const acmCertificateError =
                  group.acmCertificateEnabled && !group.acmCertificateArn.trim()
                    ? "ACM証明書を使う場合は ACM Certificate ARN を入力してください。"
                    : "";

                const loggingError =
                  group.loggingEnabled && !group.logBucket.trim()
                    ? "Loggingを有効にする場合はログ保存先バケット名が必要です。"
                    : "";

                const webAclError =
                  group.webAclEnabled && !group.webAclArn.trim()
                    ? "WAFを有効にする場合は Web ACL ARN を入力してください。"
                    : "";

                const oacError =
                  group.createOac && group.originType !== "s3"
                    ? "Origin Access Control は S3 origin のときのみ利用できます。"
                    : "";

                const aliasCertError =
                  group.aliasesEnabled &&
                  splitCsv(group.aliasesText).length > 0 &&
                  !group.acmCertificateEnabled
                    ? "Aliases を設定する場合は ACM Certificate も設定するのが一般的です。"
                    : "";

                return (
                  <div className="form-section" key={group.id}>
                    <div className="group-header">
                      <h3>Distribution {index + 1}</h3>
                      <div className="group-header-button">
                        <button
                          type="button"
                          className="remove-group-button"
                          onClick={() => removeGroup(group.id, index)}
                        >
                          削除
                        </button>
                        <button
                          type="button"
                          className="remove-group-button"
                          onClick={() => resetGroup(group.id, index)}
                        >
                          リセット
                        </button>
                      </div>
                    </div>

                    <div className="form-group">
                      <div className="usecase-header">
                        <label htmlFor={`useCase-${group.id}`}>用途プリセット</label>
                        <button
                          type="button"
                          className="help-icon-button"
                          onClick={() =>
                            updateGroupField(
                              group.id,
                              "isUseCaseHelpOpen",
                              !group.isUseCaseHelpOpen
                            )
                          }
                          aria-label="用途プリセットの説明を表示"
                        >
                          <img src={HelpIcon} className="help-icon" alt="" />
                        </button>
                      </div>

                      {group.isUseCaseHelpOpen && (
                        <div className="help-panel">
                          <div className="help-panel-item">
                            <strong>汎用Distribution</strong>
                            <p>標準的なCloudFront配信用の基本構成です。</p>
                          </div>
                          <div className="help-panel-item">
                            <strong>S3 Private Origin</strong>
                            <p>S3バケットを非公開オリジンとして利用する前提の構成です。</p>
                          </div>
                          <div className="help-panel-item">
                            <strong>静的ウェブサイト公開用</strong>
                            <p>S3 Static Website Endpoint や独自Webサーバーを origin にする構成です。</p>
                          </div>
                          <div className="help-panel-item">
                            <strong>ALB配信用</strong>
                            <p>ALBをoriginとして使うアプリ配信用の構成です。</p>
                          </div>
                          <div className="help-panel-item">
                            <strong>API配信用</strong>
                            <p>API GatewayやALB配下APIをCloudFront経由で配信する用途向けです。</p>
                          </div>
                        </div>
                      )}

                      <select
                        id={`useCase-${group.id}`}
                        value={group.useCase}
                        onChange={(e) =>
                          applyPreset(group.id, e.target.value as UseCase)
                        }
                      >
                        <option value="general">汎用Distribution</option>
                        <option value="s3-private">S3 Private Origin</option>
                        <option value="static-website">静的ウェブサイト公開用</option>
                        <option value="alb">ALB配信用</option>
                        <option value="api">API配信用</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`distributionId-${group.id}`}>ID</label>
                      <input
                        id={`distributionId-${group.id}`}
                        type="text"
                        value={group.distributionId}
                        onChange={(e) =>
                          updateGroupField(group.id, "distributionId", e.target.value)
                        }
                        placeholder="CloudFrontDistribution01"
                      />
                      {distributionIdError && (
                        <p className="input-error">{distributionIdError}</p>
                      )}
                      {distributionIdDuplicate && (
                        <p className="input-error">{distributionIdDuplicate}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor={`comment-${group.id}`}>Comment</label>
                      <input
                        id={`comment-${group.id}`}
                        type="text"
                        value={group.comment}
                        onChange={(e) =>
                          updateGroupField(group.id, "comment", e.target.value)
                        }
                        placeholder="example distribution"
                      />
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.enabled}
                          onChange={(e) =>
                            updateGroupField(group.id, "enabled", e.target.checked)
                          }
                        />
                        Distribution有効化
                      </label>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`priceClass-${group.id}`}>Price Class</label>
                      <select
                        id={`priceClass-${group.id}`}
                        value={group.priceClass}
                        onChange={(e) =>
                          updateGroupField(group.id, "priceClass", e.target.value as PriceClass)
                        }
                      >
                        <option value="PriceClass_All">PriceClass_All</option>
                        <option value="PriceClass_200">PriceClass_200</option>
                        <option value="PriceClass_100">PriceClass_100</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`httpVersion-${group.id}`}>HTTP Version</label>
                      <select
                        id={`httpVersion-${group.id}`}
                        value={group.httpVersion}
                        onChange={(e) =>
                          updateGroupField(group.id, "httpVersion", e.target.value as HttpVersion)
                        }
                      >
                        <option value="http1.1">http1.1</option>
                        <option value="http2">http2</option>
                        <option value="http2and3">http2and3</option>
                        <option value="http3">http3</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`defaultRootObject-${group.id}`}>
                        Default Root Object
                      </label>
                      <input
                        id={`defaultRootObject-${group.id}`}
                        type="text"
                        value={group.defaultRootObject}
                        onChange={(e) =>
                          updateGroupField(group.id, "defaultRootObject", e.target.value)
                        }
                        placeholder="index.html"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`originType-${group.id}`}>Origin Type</label>
                      <select
                        id={`originType-${group.id}`}
                        value={group.originType}
                        onChange={(e) =>
                          updateGroupField(group.id, "originType", e.target.value as OriginType)
                        }
                      >
                        <option value="s3">S3 Origin</option>
                        <option value="custom">Custom Origin</option>
                      </select>
                    </div>

                    {selectableS3Buckets.length > 0 && (
                      <div className="form-group">
                        <label htmlFor={`linkedS3Origin-${group.id}`}>
                          作成済みS3バケットから選択
                        </label>
                        <select
                          id={`linkedS3Origin-${group.id}`}
                          value={selectedS3OriginOption?.id ?? ""}
                          onChange={(e) => {
                            const selectedBucket = selectableS3Buckets.find(
                              (bucket) => bucket.id === e.target.value
                            );

                            if (!selectedBucket) {
                              return;
                            }

                            updateGroupField(
                              group.id,
                              "originType",
                              selectedBucket.originType
                            );
                            updateGroupField(
                              group.id,
                              "originDomainName",
                              selectedBucket.suggestedDomainName
                            );

                            if (selectedBucket.originType === "custom") {
                              updateGroupField(group.id, "createOac", false);
                            }
                          }}
                        >
                          <option value="">手入力する場合は未選択</option>
                          {selectableS3Buckets.map((bucket) => (
                            <option key={bucket.id} value={bucket.id}>
                              {bucket.label}
                            </option>
                          ))}
                        </select>
                        <p className="input-help">
                          S3ページで設定済みのバケットを選ぶと、Origin Type と Origin Domain Name を自動入力します。
                        </p>
                        {selectedS3OriginOption?.websiteHostingEnabled && (
                          <p className="input-help">
                            Static Website Hosting が有効なバケットのため、Origin Type は Custom Origin に自動切替します。
                          </p>
                        )}
                      </div>
                    )}

                    <div className="form-group">
                      <label htmlFor={`originId-${group.id}`}>Origin ID</label>
                      <input
                        id={`originId-${group.id}`}
                        type="text"
                        value={group.originId}
                        onChange={(e) =>
                          updateGroupField(group.id, "originId", e.target.value)
                        }
                        placeholder="S3Origin01"
                      />
                      {originIdError && <p className="input-error">{originIdError}</p>}
                    </div>

                    <div className="form-group">
                      <label htmlFor={`originDomainName-${group.id}`}>Origin Domain Name</label>
                      <input
                        id={`originDomainName-${group.id}`}
                        type="text"
                        value={group.originDomainName}
                        onChange={(e) =>
                          updateGroupField(group.id, "originDomainName", e.target.value)
                        }
                        placeholder="example-bucket.s3.ap-northeast-1.amazonaws.com"
                      />
                      {originDomainError && (
                        <p className="input-error">{originDomainError}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor={`originPath-${group.id}`}>Origin Path</label>
                      <input
                        id={`originPath-${group.id}`}
                        type="text"
                        value={group.originPath}
                        onChange={(e) =>
                          updateGroupField(group.id, "originPath", e.target.value)
                        }
                        placeholder="/prod"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`viewerProtocolPolicy-${group.id}`}>
                        Viewer Protocol Policy
                      </label>
                      <select
                        id={`viewerProtocolPolicy-${group.id}`}
                        value={group.viewerProtocolPolicy}
                        onChange={(e) =>
                          updateGroupField(
                            group.id,
                            "viewerProtocolPolicy",
                            e.target.value as ViewerProtocolPolicy
                          )
                        }
                      >
                        <option value="redirect-to-https">redirect-to-https</option>
                        <option value="https-only">https-only</option>
                        <option value="allow-all">allow-all</option>
                      </select>
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.compress}
                          onChange={(e) =>
                            updateGroupField(group.id, "compress", e.target.checked)
                          }
                        />
                        Compress有効化
                      </label>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`allowedMethodsPreset-${group.id}`}>
                        Allowed Methods
                      </label>
                      <select
                        id={`allowedMethodsPreset-${group.id}`}
                        value={group.allowedMethodsPreset}
                        onChange={(e) =>
                          updateGroupField(
                            group.id,
                            "allowedMethodsPreset",
                            e.target.value as AllowedMethodsPreset
                          )
                        }
                      >
                        <option value="GET_HEAD">GET, HEAD</option>
                        <option value="GET_HEAD_OPTIONS">GET, HEAD, OPTIONS</option>
                        <option value="ALL">ALL</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`cachePolicyId-${group.id}`}>Cache Policy ID</label>
                      <input
                        id={`cachePolicyId-${group.id}`}
                        type="text"
                        value={group.cachePolicyId}
                        onChange={(e) =>
                          updateGroupField(group.id, "cachePolicyId", e.target.value)
                        }
                        placeholder="658327ea-f89d-4fab-a63d-7e88639e58f6"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`originRequestPolicyId-${group.id}`}>
                        Origin Request Policy ID
                      </label>
                      <input
                        id={`originRequestPolicyId-${group.id}`}
                        type="text"
                        value={group.originRequestPolicyId}
                        onChange={(e) =>
                          updateGroupField(
                            group.id,
                            "originRequestPolicyId",
                            e.target.value
                          )
                        }
                        placeholder="任意"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor={`responseHeadersPolicyId-${group.id}`}>
                        Response Headers Policy ID
                      </label>
                      <input
                        id={`responseHeadersPolicyId-${group.id}`}
                        type="text"
                        value={group.responseHeadersPolicyId}
                        onChange={(e) =>
                          updateGroupField(
                            group.id,
                            "responseHeadersPolicyId",
                            e.target.value
                          )
                        }
                        placeholder="任意"
                      />
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.aliasesEnabled}
                          onChange={(e) =>
                            updateGroupField(group.id, "aliasesEnabled", e.target.checked)
                          }
                        />
                        Alternate Domain Names (CNAME) 有効化
                      </label>
                    </div>

                    {group.aliasesEnabled && (
                      <div className="form-group">
                        <label htmlFor={`aliasesText-${group.id}`}>Aliases</label>
                        <input
                          id={`aliasesText-${group.id}`}
                          type="text"
                          value={group.aliasesText}
                          onChange={(e) =>
                            updateGroupField(group.id, "aliasesText", e.target.value)
                          }
                          placeholder="cdn.example.com, static.example.com"
                        />
                        {aliasCertError && (
                          <p className="input-error">{aliasCertError}</p>
                        )}
                      </div>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.acmCertificateEnabled}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "acmCertificateEnabled",
                              e.target.checked
                            )
                          }
                        />
                        ACM Certificate設定
                      </label>
                    </div>

                    {group.acmCertificateEnabled && (
                      <>
                        <div className="form-group">
                          <label htmlFor={`acmCertificateArn-${group.id}`}>
                            ACM Certificate ARN
                          </label>
                          <input
                            id={`acmCertificateArn-${group.id}`}
                            type="text"
                            value={group.acmCertificateArn}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "acmCertificateArn",
                                e.target.value
                              )
                            }
                            placeholder="arn:aws:acm:us-east-1:123456789012:certificate/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                          />
                          {acmCertificateError && (
                            <p className="input-error">{acmCertificateError}</p>
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor={`minimumProtocolVersion-${group.id}`}>
                            Minimum Protocol Version
                          </label>
                          <select
                            id={`minimumProtocolVersion-${group.id}`}
                            value={group.minimumProtocolVersion}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "minimumProtocolVersion",
                                e.target.value as MinimumProtocolVersion
                              )
                            }
                          >
                            <option value="TLSv1">TLSv1</option>
                            <option value="TLSv1.1_2016">TLSv1.1_2016</option>
                            <option value="TLSv1.2_2018">TLSv1.2_2018</option>
                            <option value="TLSv1.2_2021">TLSv1.2_2021</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`sslSupportMethod-${group.id}`}>
                            SSL Support Method
                          </label>
                          <select
                            id={`sslSupportMethod-${group.id}`}
                            value={group.sslSupportMethod}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "sslSupportMethod",
                                e.target.value as SslSupportMethod
                              )
                            }
                          >
                            <option value="sni-only">sni-only</option>
                            <option value="vip">vip</option>
                            <option value="static-ip">static-ip</option>
                          </select>
                        </div>
                      </>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.loggingEnabled}
                          onChange={(e) =>
                            updateGroupField(group.id, "loggingEnabled", e.target.checked)
                          }
                        />
                        Logging有効化
                      </label>
                    </div>

                    {group.loggingEnabled && (
                      <>
                        <div className="form-group">
                          <label htmlFor={`logBucket-${group.id}`}>Log Bucket</label>
                          <input
                            id={`logBucket-${group.id}`}
                            type="text"
                            value={group.logBucket}
                            onChange={(e) =>
                              updateGroupField(group.id, "logBucket", e.target.value)
                            }
                            placeholder="example-log-bucket.s3.amazonaws.com"
                          />
                          {loggingError && <p className="input-error">{loggingError}</p>}
                        </div>

                        <div className="form-group">
                          <label htmlFor={`logPrefix-${group.id}`}>Log Prefix</label>
                          <input
                            id={`logPrefix-${group.id}`}
                            type="text"
                            value={group.logPrefix}
                            onChange={(e) =>
                              updateGroupField(group.id, "logPrefix", e.target.value)
                            }
                            placeholder="cloudfront-logs/"
                          />
                        </div>

                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={group.includeCookies}
                              onChange={(e) =>
                                updateGroupField(
                                  group.id,
                                  "includeCookies",
                                  e.target.checked
                                )
                              }
                            />
                            Include Cookies
                          </label>
                        </div>
                      </>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.webAclEnabled}
                          onChange={(e) =>
                            updateGroupField(group.id, "webAclEnabled", e.target.checked)
                          }
                        />
                        AWS WAF連携
                      </label>
                    </div>

                    {group.webAclEnabled && (
                      <div className="form-group">
                        <label htmlFor={`webAclArn-${group.id}`}>Web ACL ARN</label>
                        <input
                          id={`webAclArn-${group.id}`}
                          type="text"
                          value={group.webAclArn}
                          onChange={(e) =>
                            updateGroupField(group.id, "webAclArn", e.target.value)
                          }
                          placeholder="arn:aws:wafv2:us-east-1:123456789012:global/webacl/example/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                        {webAclError && <p className="input-error">{webAclError}</p>}
                      </div>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.createOac}
                          onChange={(e) =>
                            updateGroupField(group.id, "createOac", e.target.checked)
                          }
                        />
                        Origin Access Control生成
                      </label>
                    </div>

                    {group.createOac && (
                      <>
                        <div className="form-group">
                          <label htmlFor={`oacId-${group.id}`}>OAC ID</label>
                          <input
                            id={`oacId-${group.id}`}
                            type="text"
                            value={group.oacId}
                            onChange={(e) =>
                              updateGroupField(group.id, "oacId", e.target.value)
                            }
                            placeholder="CloudFrontOAC01"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`oacName-${group.id}`}>OAC Name</label>
                          <input
                            id={`oacName-${group.id}`}
                            type="text"
                            value={group.oacName}
                            onChange={(e) =>
                              updateGroupField(group.id, "oacName", e.target.value)
                            }
                            placeholder="cloudfront-oac-01"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`oacDescription-${group.id}`}>
                            OAC Description
                          </label>
                          <input
                            id={`oacDescription-${group.id}`}
                            type="text"
                            value={group.oacDescription}
                            onChange={(e) =>
                              updateGroupField(group.id, "oacDescription", e.target.value)
                            }
                            placeholder="Origin Access Control for S3 origin"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`signingBehavior-${group.id}`}>
                            Signing Behavior
                          </label>
                          <select
                            id={`signingBehavior-${group.id}`}
                            value={group.signingBehavior}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "signingBehavior",
                                e.target.value as "always" | "never" | "no-override"
                              )
                            }
                          >
                            <option value="always">always</option>
                            <option value="never">never</option>
                            <option value="no-override">no-override</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`signingProtocol-${group.id}`}>
                            Signing Protocol
                          </label>
                          <select
                            id={`signingProtocol-${group.id}`}
                            value={group.signingProtocol}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "signingProtocol",
                                e.target.value as "sigv4"
                              )
                            }
                          >
                            <option value="sigv4">sigv4</option>
                          </select>
                        </div>

                        {oacError && <p className="input-error">{oacError}</p>}
                      </>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.customHeadersEnabled}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "customHeadersEnabled",
                              e.target.checked
                            )
                          }
                        />
                        Origin Custom Headers有効化
                      </label>
                    </div>

                    {group.customHeadersEnabled && (
                      <div className="form-group">
                        <label htmlFor={`customHeadersText-${group.id}`}>
                          Custom Headers
                        </label>
                        <input
                          id={`customHeadersText-${group.id}`}
                          type="text"
                          value={group.customHeadersText}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "customHeadersText",
                              e.target.value
                            )
                          }
                          placeholder="X-Env: prod, X-App: cfn-builder"
                        />
                      </div>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.isIpv6Enabled}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "isIpv6Enabled",
                              e.target.checked
                            )
                          }
                        />
                        IPv6有効化
                      </label>
                    </div>
                  </div>
                );
              })}

              {warningMessages.length > 0 && (
                <div className="warning-section">
                  <h3>Warning</h3>
                  {warningMessages.map((message, index) => (
                    <p key={`${index}-${message}`}>{message}</p>
                  ))}
                </div>
              )}

              <button type="button" className="add-group-button" onClick={addGroup}>
                追加
              </button>
            </>
          )}
        </>
      )}

      {viewMode === "preview" && (
        <div className="preview-section">
          <div className="preview-section-header">
            <h3>Generated CloudFormation Template</h3>
            <button
              type="button"
              onClick={handleCopy}
              disabled={hasError || isTemplateEmpty}
            >
              Copy
            </button>
          </div>

          {isTemplateEmpty ? (
            <p className="empty-preview-message">
              No Template
            </p>
          ) : (
            <>
              <textarea value={template} readOnly rows={36} />

              {hasError && (
                <p className="input-error">
                  入力エラーがあるため、そのままでは実運用向けテンプレートとして使えません。
                </p>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
}