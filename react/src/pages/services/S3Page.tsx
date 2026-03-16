import { useMemo } from "react";
import { useTemplateBuilder } from "../../contexts/TemplateBuilderProvider";

import S3Icon from "../../assets/AWS/amazon_s3.svg";
import HelpIcon from "../../assets/help.svg";

type UseCase =
  | "general"
  | "cloudfront"
  | "static-website"
  | "logging"
  | "backup";

type EncryptionType = "NONE" | "SSE-S3" | "SSE-KMS";
type ViewMode = "form" | "preview";

type TagItem = {
  key: string;
  value: string;
};

type AuthProps = {
  isAuthenticated: boolean;
};

type BucketFormGroup = {
  id: string;
  useCase: UseCase;
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

function isValidCfnLogicalId(value: string) {
  return /^[A-Za-z][A-Za-z0-9]{0,254}$/.test(value);
}

function isValidBucketName(value: string) {
  if (!value) return false;
  if (value.length < 3 || value.length > 63) return false;
  if (!/^[a-z0-9][a-z0-9.-]*[a-z0-9]$/.test(value)) return false;
  if (/\.\./.test(value)) return false;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(value)) return false;
  return true;
}

function toYamlScalar(value: string) {
  if (!value) return "''";
  if (/^[A-Za-z0-9._:/=+\-@*]+$/.test(value)) {
    return value;
  }
  return `'${value.replace(/'/g, "''")}'`;
}

function normalizeBucketId(value: string) {
  return value.trim();
}

function normalizeBucketName(value: string) {
  return value.trim().toLowerCase();
}

function createEmptyGroup(index: number): BucketFormGroup {
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

export default function S3Page({ isAuthenticated }: AuthProps) {
  const {
    s3ViewMode: viewMode,
    setS3ViewMode: setViewMode,
    s3Groups: groups,
    setS3Groups: setGroups,
  } = useTemplateBuilder();

  const guestGroupLimit = 1;
  const canAddMoreGroups = isAuthenticated || groups.length < guestGroupLimit;
  const showGuestLimitMessage = !isAuthenticated && groups.length >= guestGroupLimit;

  const updateGroupField = <K extends keyof BucketFormGroup>(
    groupId: string,
    field: K,
    value: BucketFormGroup[K]
  ) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId ? { ...group, [field]: value } : group
      )
    );
  };

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
              deletepolicy: true,
              updatepolicy: true,
              versioning: true,
              blockPublicAccess: true,
              encryptionType: "SSE-S3",
              kmsKeyArn: "",
              lifecycleEnabled: false,
              corsEnabled: false,
              accessLoggingEnabled: false,
              websiteHostingEnabled: false,
              createBucketPolicy: false,
              allowCloudFrontReadOnly: false,
              allowedPrincipalArn: "",
            };

          case "cloudfront":
            return {
              ...base,
              deletepolicy: true,
              updatepolicy: true,
              versioning: true,
              blockPublicAccess: true,
              encryptionType: "SSE-S3",
              kmsKeyArn: "",
              lifecycleEnabled: false,
              corsEnabled: false,
              accessLoggingEnabled: false,
              websiteHostingEnabled: false,
              createBucketPolicy: true,
              allowCloudFrontReadOnly: true,
              allowedPrincipalArn: "",
            };

          case "static-website":
            return {
              ...base,
              deletepolicy: true,
              updatepolicy: true,
              versioning: true,
              blockPublicAccess: false,
              encryptionType: "SSE-S3",
              kmsKeyArn: "",
              lifecycleEnabled: false,
              corsEnabled: true,
              corsAllowedOrigins: "*",
              corsAllowedMethods: "GET,HEAD",
              corsAllowedHeaders: "*",
              accessLoggingEnabled: false,
              websiteHostingEnabled: true,
              createBucketPolicy: false,
              allowCloudFrontReadOnly: false,
              allowedPrincipalArn: "",
            };

          case "logging":
            return {
              ...base,
              deletepolicy: true,
              updatepolicy: true,
              versioning: true,
              blockPublicAccess: true,
              encryptionType: "SSE-S3",
              kmsKeyArn: "",
              lifecycleEnabled: true,
              expirationDays: 90,
              corsEnabled: false,
              accessLoggingEnabled: false,
              websiteHostingEnabled: false,
              createBucketPolicy: false,
              allowCloudFrontReadOnly: false,
              allowedPrincipalArn: "",
            };

          case "backup":
            return {
              ...base,
              deletepolicy: true,
              updatepolicy: true,
              versioning: true,
              blockPublicAccess: true,
              encryptionType: "SSE-KMS",
              kmsKeyArn: "",
              lifecycleEnabled: true,
              expirationDays: 365,
              corsEnabled: false,
              accessLoggingEnabled: false,
              websiteHostingEnabled: false,
              createBucketPolicy: false,
              allowCloudFrontReadOnly: false,
              allowedPrincipalArn: "",
            };
        }
      })
    );
  };

  const addGroup = () => {
    if (!canAddMoreGroups) {
      window.alert("未認証ユーザーはS3バケット設定を1つまでしか追加できません。");
      return;
    }

    setGroups((prev) => [...prev, createEmptyGroup(prev.length)]);
  };

  const removeGroup = (groupId: string, index: number) => {
    if (window.confirm(`バケット${index + 1}の削除を行います。よろしいですか？`)) {
      setGroups((prev) => prev.filter((group) => group.id !== groupId));
      window.alert("削除しました");
    }
  };

  const resetGroup = (groupId: string, index: number) => {
    if (window.confirm(`バケット${index + 1}を初期化します。よろしいですか？`)) {
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

  const addTag = (groupId: string) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? { ...group, tags: [...group.tags, { key: "", value: "" }] }
          : group
      )
    );
  };

  const updateTag = (
    groupId: string,
    index: number,
    field: keyof TagItem,
    value: string
  ) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tags: group.tags.map((tag, i) =>
                i === index ? { ...tag, [field]: value } : tag
              ),
            }
          : group
      )
    );
  };

  const removeTag = (groupId: string, index: number) => {
    setGroups((prev) =>
      prev.map((group) =>
        group.id === groupId
          ? {
              ...group,
              tags: group.tags.filter((_, i) => i !== index),
            }
          : group
      )
    );
  };

  const hasError = useMemo(() => {
    if (groups.length === 0) return false;

    return groups.some((group) => {
      const normalizedBucketId = normalizeBucketId(group.bucketId);
      const normalizedBucketName = normalizeBucketName(group.bucketName);

      const bucketIdError =
        normalizedBucketId && !isValidCfnLogicalId(normalizedBucketId);

      const bucketNameError =
        normalizedBucketName && !isValidBucketName(normalizedBucketName);

      const bucketIdDuplicate =
        normalizedBucketId &&
        groups.filter(
          (item) => normalizeBucketId(item.bucketId) === normalizedBucketId
        ).length > 1;

      const bucketNameDuplicate =
        normalizedBucketName &&
        groups.filter(
          (item) =>
            normalizeBucketName(item.bucketName) === normalizedBucketName
        ).length > 1;

      const kmsKeyError =
        group.encryptionType === "SSE-KMS" && !group.kmsKeyArn.trim();

      const loggingError =
        group.accessLoggingEnabled && !group.logBucketName.trim();

      return Boolean(
        bucketIdError ||
          bucketNameError ||
          bucketIdDuplicate ||
          bucketNameDuplicate ||
          kmsKeyError ||
          loggingError
      );
    });
  }, [groups]);

  const warningMessages = useMemo(() => {
    const warnings: string[] = [];

    groups.forEach((group, index) => {
      const prefix = groups.length > 1 ? `バケット${index + 1}: ` : "";

      if (!group.blockPublicAccess) {
        warnings.push(
          `${prefix}Block Public Access が無効です。意図しない公開設定に注意してください。`
        );
      }

      if (group.websiteHostingEnabled && group.blockPublicAccess) {
        warnings.push(
          `${prefix}Static Website Hosting を有効にしていますが、Block Public Access が有効のままだと公開用途では利用しづらい構成です。`
        );
      }

      if (group.encryptionType === "NONE") {
        warnings.push(`${prefix}サーバーサイド暗号化が無効です。`);
      }
    });

    return warnings;
  }, [groups]);

  const template = useMemo(() => {
    if (groups.length === 0) {
      return "";
    }

    const lines: string[] = [];
    const resources: string[] = [];
    const outputs: string[] = [];

    groups.forEach((group, index) => {
      const resolvedBucketId =
        group.bucketId.trim() || `S3Bucket${String(index + 1).padStart(2, "0")}`;

      const bucketProperties: string[] = [];

      if (group.bucketName.trim()) {
        bucketProperties.push(
          `      BucketName: ${toYamlScalar(group.bucketName.trim())}`
        );
      }

      bucketProperties.push(`      VersioningConfiguration:`);
      bucketProperties.push(
        `        Status: ${group.versioning ? "Enabled" : "Suspended"}`
      );

      if (group.encryptionType === "SSE-S3") {
        bucketProperties.push(`      BucketEncryption:`);
        bucketProperties.push(`        ServerSideEncryptionConfiguration:`);
        bucketProperties.push(`          - ServerSideEncryptionByDefault:`);
        bucketProperties.push(`              SSEAlgorithm: AES256`);
      }

      if (group.encryptionType === "SSE-KMS") {
        bucketProperties.push(`      BucketEncryption:`);
        bucketProperties.push(`        ServerSideEncryptionConfiguration:`);
        bucketProperties.push(`          - ServerSideEncryptionByDefault:`);
        bucketProperties.push(`              SSEAlgorithm: aws:kms`);
        bucketProperties.push(
          `              KMSMasterKeyID: ${toYamlScalar(
            group.kmsKeyArn.trim() ||
              "arn:aws:kms:ap-northeast-1:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
          )}`
        );
      }

      if (group.accessLoggingEnabled && group.logBucketName.trim()) {
        bucketProperties.push(`      LoggingConfiguration:`);
        bucketProperties.push(
          `        DestinationBucketName: ${toYamlScalar(
            group.logBucketName.trim()
          )}`
        );
        bucketProperties.push(
          `        LogFilePrefix: ${toYamlScalar(
            group.logPrefix.trim() || "s3-access-logs/"
          )}`
        );
      }

      if (group.websiteHostingEnabled) {
        bucketProperties.push(`      WebsiteConfiguration:`);
        bucketProperties.push(
          `        IndexDocument: ${toYamlScalar(
            group.indexDocument.trim() || "index.html"
          )}`
        );
        bucketProperties.push(
          `        ErrorDocument: ${toYamlScalar(
            group.errorDocument.trim() || "error.html"
          )}`
        );
      }

      if (group.lifecycleEnabled) {
        bucketProperties.push(`      LifecycleConfiguration:`);
        bucketProperties.push(`        Rules:`);
        bucketProperties.push(`          - Id: ExpireObjectsRule`);
        bucketProperties.push(`            Status: Enabled`);
        bucketProperties.push(
          `            ExpirationInDays: ${
            Number.isFinite(group.expirationDays) && group.expirationDays > 0
              ? group.expirationDays
              : 30
          }`
        );
      }

      if (group.corsEnabled) {
        const origins = group.corsAllowedOrigins
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        const methods = group.corsAllowedMethods
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        const headers = group.corsAllowedHeaders
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean);

        bucketProperties.push(`      CorsConfiguration:`);
        bucketProperties.push(`        CorsRules:`);
        bucketProperties.push(`          - AllowedOrigins:`);
        origins.forEach((origin) => {
          bucketProperties.push(`              - ${toYamlScalar(origin)}`);
        });

        bucketProperties.push(`            AllowedMethods:`);
        methods.forEach((method) => {
          bucketProperties.push(`              - ${toYamlScalar(method)}`);
        });

        if (headers.length > 0) {
          bucketProperties.push(`            AllowedHeaders:`);
          headers.forEach((header) => {
            bucketProperties.push(`              - ${toYamlScalar(header)}`);
          });
        }
      }

      const filteredTags = group.tags.filter(
        (tag) => tag.key.trim() && tag.value.trim()
      );

      if (filteredTags.length > 0) {
        bucketProperties.push(`      Tags:`);
        filteredTags.forEach((tag) => {
          bucketProperties.push(`        - Key: ${toYamlScalar(tag.key.trim())}`);
          bucketProperties.push(
            `          Value: ${toYamlScalar(tag.value.trim())}`
          );
        });
      }

      resources.push(`  ${resolvedBucketId}:`);

      if (group.deletepolicy) {
        resources.push(`    DeletionPolicy: Retain`);
      }

      if (group.updatepolicy) {
        resources.push(`    UpdateReplacePolicy: Retain`);
      }

      resources.push(`    Type: AWS::S3::Bucket`);
      resources.push(`    Properties:`);
      resources.push(...bucketProperties);

      if (group.blockPublicAccess) {
        resources.push(``);
        resources.push(`  ${resolvedBucketId}PublicAccessBlock:`);
        resources.push(`    Type: AWS::S3::BucketPublicAccessBlock`);
        resources.push(`    Properties:`);
        resources.push(`      Bucket: !Ref ${resolvedBucketId}`);
        resources.push(`      BlockPublicAcls: true`);
        resources.push(`      IgnorePublicAcls: true`);
        resources.push(`      BlockPublicPolicy: true`);
        resources.push(`      RestrictPublicBuckets: true`);
      }

      if (group.createBucketPolicy) {
        resources.push(``);
        resources.push(`  ${resolvedBucketId}Policy:`);
        resources.push(`    Type: AWS::S3::BucketPolicy`);
        resources.push(`    Properties:`);
        resources.push(`      Bucket: !Ref ${resolvedBucketId}`);
        resources.push(`      PolicyDocument:`);
        resources.push(`        Version: '2012-10-17'`);
        resources.push(`        Statement:`);

        if (group.allowedPrincipalArn.trim()) {
          resources.push(`          - Sid: AllowSpecificPrincipal`);
          resources.push(`            Effect: Allow`);
          resources.push(`            Principal:`);
          resources.push(
            `              AWS: ${toYamlScalar(group.allowedPrincipalArn.trim())}`
          );
          resources.push(`            Action:`);
          resources.push(`              - s3:GetObject`);
          resources.push(`              - s3:PutObject`);
          resources.push(`              - s3:ListBucket`);
          resources.push(`            Resource:`);
          resources.push(`              - !GetAtt ${resolvedBucketId}.Arn`);
          resources.push(`              - !Sub '\${${resolvedBucketId}.Arn}/*'`);
        }

        if (group.allowCloudFrontReadOnly) {
          resources.push(`          - Sid: AllowCloudFrontReadOnly`);
          resources.push(`            Effect: Allow`);
          resources.push(`            Principal:`);
          resources.push(`              Service: cloudfront.amazonaws.com`);
          resources.push(`            Action: s3:GetObject`);
          resources.push(`            Resource: !Sub '\${${resolvedBucketId}.Arn}/*'`);
          resources.push(`            Condition:`);
          resources.push(`              StringEquals:`);
          resources.push(
            `                AWS:SourceArn: arn:aws:cloudfront::123456789012:distribution/EXAMPLE123`
          );
        }

        if (
          !group.allowedPrincipalArn.trim() &&
          !group.allowCloudFrontReadOnly
        ) {
          resources.push(`          []`);
        }
      }

      outputs.push(`  ${resolvedBucketId}Name:`);
      outputs.push(`    Value: !Ref ${resolvedBucketId}`);
      outputs.push(`  ${resolvedBucketId}Arn:`);
      outputs.push(`    Value: !GetAtt ${resolvedBucketId}.Arn`);

      if (group.websiteHostingEnabled) {
        outputs.push(`  ${resolvedBucketId}WebsiteURL:`);
        outputs.push(`    Value: !GetAtt ${resolvedBucketId}.WebsiteURL`);
      }

      if (index !== groups.length - 1) {
        resources.push(``);
      }
    });

    lines.push(`AWSTemplateFormatVersion: '2010-09-09'`);
    lines.push(`Description: S3 buckets created by CFnTemplateBuilder`);
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
          <img src={S3Icon} className="aws-icon" alt="AmazonS3" />
          <h2>Amazon S3</h2>
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
                <h3>S3バケットはまだ追加されていません</h3>
              </div>

              <p>
                S3テンプレートを作成する場合は「追加」ボタンを押して、
                バケット設定を作成してください。
              </p>

              {!isAuthenticated && (
                <p className="input-error">
                  未認証ユーザーはS3バケット設定を1つまで追加できます。
                </p>
              )}

              <button
                type="button"
                className="add-group-button"
                onClick={addGroup}
                disabled={!canAddMoreGroups}
              >
                追加
              </button>
            </div>
          ) : (
            <>
              {groups.map((group, index) => {
                const normalizedBucketId = normalizeBucketId(group.bucketId);
                const normalizedBucketName = normalizeBucketName(group.bucketName);

                const bucketIdError =
                  normalizedBucketId && !isValidCfnLogicalId(normalizedBucketId)
                    ? "CloudFormationの論理IDは英字で始まり、英数字のみ使用できます。"
                    : "";

                const bucketNameError =
                  normalizedBucketName &&
                  !isValidBucketName(normalizedBucketName)
                    ? "S3バケット名は 3〜63 文字、小文字英数字・ハイフン・ドットのみ使用可能です。"
                    : "";

                const bucketIdDuplicate =
                  normalizedBucketId &&
                  groups.filter(
                    (item) =>
                      normalizeBucketId(item.bucketId) === normalizedBucketId
                  ).length > 1
                    ? "IDが他のバケットと重複しています。"
                    : "";

                const bucketNameDuplicate =
                  normalizedBucketName &&
                  groups.filter(
                    (item) =>
                      normalizeBucketName(item.bucketName) === normalizedBucketName
                  ).length > 1
                    ? "バケット名が他のバケットと重複しています。"
                    : "";

                const kmsKeyError =
                  group.encryptionType === "SSE-KMS" && !group.kmsKeyArn.trim()
                    ? "SSE-KMSを使う場合はKMS Key ARNを入力してください。"
                    : "";

                const loggingError =
                  group.accessLoggingEnabled && !group.logBucketName.trim()
                    ? "Access Loggingを有効にする場合はログ保存先バケット名が必要です。"
                    : "";

                return (
                  <div className="form-section" key={group.id}>
                    <div className="group-header">
                      <h3>バケット {index + 1}</h3>
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
                            <strong>汎用バケット</strong>
                            <p>標準的なS3バケット向けの基本構成です。</p>
                          </div>
                          <div className="help-panel-item">
                            <strong>CloudFront オリジン用</strong>
                            <p>CloudFront から配信する前提の構成です。</p>
                          </div>
                          <div className="help-panel-item">
                            <strong>静的ウェブサイト公開用</strong>
                            <p>S3 の静的ウェブサイト公開に使う用途向けです。</p>
                          </div>
                          <div className="help-panel-item">
                            <strong>ログ保存用</strong>
                            <p>アクセスログや監査ログの保管向けです。</p>
                          </div>
                          <div className="help-panel-item">
                            <strong>バックアップ保存用</strong>
                            <p>バックアップデータの安全な保管向けです。</p>
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
                        <option value="general">汎用バケット</option>
                        <option value="cloudfront">CloudFront オリジン用</option>
                        <option value="static-website">静的ウェブサイト公開用</option>
                        <option value="logging">ログ保存用</option>
                        <option value="backup">バックアップ保存用</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`bucketId-${group.id}`}>ID</label>
                      <input
                        id={`bucketId-${group.id}`}
                        type="text"
                        value={group.bucketId}
                        onChange={(e) =>
                          updateGroupField(group.id, "bucketId", e.target.value)
                        }
                        placeholder="S3Bucket01"
                      />
                      {bucketIdError && <p className="input-error">{bucketIdError}</p>}
                      {bucketIdDuplicate && (
                        <p className="input-error">{bucketIdDuplicate}</p>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor={`bucketName-${group.id}`}>バケット名</label>
                      <input
                        id={`bucketName-${group.id}`}
                        type="text"
                        value={group.bucketName}
                        onChange={(e) =>
                          updateGroupField(group.id, "bucketName", e.target.value)
                        }
                        placeholder="example-app-assets-prod"
                      />
                      {bucketNameError && (
                        <p className="input-error">{bucketNameError}</p>
                      )}
                      {bucketNameDuplicate && (
                        <p className="input-error">{bucketNameDuplicate}</p>
                      )}
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.deletepolicy}
                          onChange={(e) =>
                            updateGroupField(group.id, "deletepolicy", e.target.checked)
                          }
                        />
                        DeletionPolicy
                      </label>
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.updatepolicy}
                          onChange={(e) =>
                            updateGroupField(group.id, "updatepolicy", e.target.checked)
                          }
                        />
                        UpdateReplacePolicy
                      </label>
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.versioning}
                          onChange={(e) =>
                            updateGroupField(group.id, "versioning", e.target.checked)
                          }
                        />
                        バージョニング有効化
                      </label>
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.blockPublicAccess}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "blockPublicAccess",
                              e.target.checked
                            )
                          }
                        />
                        パブリックアクセスブロック有効化
                      </label>
                    </div>

                    <div className="form-group">
                      <label htmlFor={`encryptionType-${group.id}`}>暗号化方式</label>
                      <select
                        id={`encryptionType-${group.id}`}
                        value={group.encryptionType}
                        onChange={(e) =>
                          updateGroupField(
                            group.id,
                            "encryptionType",
                            e.target.value as EncryptionType
                          )
                        }
                      >
                        <option value="SSE-S3">SSE-S3</option>
                        <option value="SSE-KMS">SSE-KMS</option>
                        <option value="NONE">None</option>
                      </select>
                    </div>

                    {group.encryptionType === "SSE-KMS" && (
                      <div className="form-group">
                        <label htmlFor={`kmsKeyArn-${group.id}`}>KMS Key ARN</label>
                        <input
                          id={`kmsKeyArn-${group.id}`}
                          type="text"
                          value={group.kmsKeyArn}
                          onChange={(e) =>
                            updateGroupField(group.id, "kmsKeyArn", e.target.value)
                          }
                          placeholder="arn:aws:kms:ap-northeast-1:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                        />
                        {kmsKeyError && <p className="input-error">{kmsKeyError}</p>}
                      </div>
                    )}

                    <div className="form-group">
                      <label>Tags</label>
                      <div className="tag-list">
                        {group.tags.map((tag, tagIndex) => (
                          <div
                            className="tag-row"
                            key={`${group.id}-${tagIndex}-${tag.key}-${tag.value}`}
                          >
                            <input
                              type="text"
                              value={tag.key}
                              placeholder="Key"
                              onChange={(e) =>
                                updateTag(group.id, tagIndex, "key", e.target.value)
                              }
                            />
                            <input
                              type="text"
                              value={tag.value}
                              placeholder="Value"
                              onChange={(e) =>
                                updateTag(group.id, tagIndex, "value", e.target.value)
                              }
                            />
                            <button
                              type="button"
                              onClick={() => removeTag(group.id, tagIndex)}
                            >
                              削除
                            </button>
                          </div>
                        ))}
                      </div>

                      <button
                        type="button"
                        className="add-tag-button"
                        onClick={() => addTag(group.id)}
                      >
                        Tag追加
                      </button>
                    </div>

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.lifecycleEnabled}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "lifecycleEnabled",
                              e.target.checked
                            )
                          }
                        />
                        ライフサイクル有効化
                      </label>
                    </div>

                    {group.lifecycleEnabled && (
                      <div className="form-group">
                        <label htmlFor={`expirationDays-${group.id}`}>
                          Expiration Days
                        </label>
                        <input
                          id={`expirationDays-${group.id}`}
                          type="number"
                          min={1}
                          value={group.expirationDays}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "expirationDays",
                              Number(e.target.value)
                            )
                          }
                        />
                      </div>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.corsEnabled}
                          onChange={(e) =>
                            updateGroupField(group.id, "corsEnabled", e.target.checked)
                          }
                        />
                        CORS有効化
                      </label>
                    </div>

                    {group.corsEnabled && (
                      <>
                        <div className="form-group">
                          <label htmlFor={`corsAllowedOrigins-${group.id}`}>
                            Allowed Origins
                          </label>
                          <input
                            id={`corsAllowedOrigins-${group.id}`}
                            type="text"
                            value={group.corsAllowedOrigins}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "corsAllowedOrigins",
                                e.target.value
                              )
                            }
                            placeholder="*, https://example.com"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`corsAllowedMethods-${group.id}`}>
                            Allowed Methods
                          </label>
                          <input
                            id={`corsAllowedMethods-${group.id}`}
                            type="text"
                            value={group.corsAllowedMethods}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "corsAllowedMethods",
                                e.target.value
                              )
                            }
                            placeholder="GET,HEAD,PUT,POST"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`corsAllowedHeaders-${group.id}`}>
                            Allowed Headers
                          </label>
                          <input
                            id={`corsAllowedHeaders-${group.id}`}
                            type="text"
                            value={group.corsAllowedHeaders}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "corsAllowedHeaders",
                                e.target.value
                              )
                            }
                            placeholder="*"
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.accessLoggingEnabled}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "accessLoggingEnabled",
                              e.target.checked
                            )
                          }
                        />
                        Access Logging有効化
                      </label>
                    </div>

                    {group.accessLoggingEnabled && (
                      <>
                        <div className="form-group">
                          <label htmlFor={`logBucketName-${group.id}`}>
                            Log Bucket Name
                          </label>
                          <input
                            id={`logBucketName-${group.id}`}
                            type="text"
                            value={group.logBucketName}
                            onChange={(e) =>
                              updateGroupField(group.id, "logBucketName", e.target.value)
                            }
                            placeholder="example-log-bucket"
                          />
                          {loggingError && (
                            <p className="input-error">{loggingError}</p>
                          )}
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
                            placeholder="s3-access-logs/"
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.websiteHostingEnabled}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "websiteHostingEnabled",
                              e.target.checked
                            )
                          }
                        />
                        Static Website Hosting有効化
                      </label>
                    </div>

                    {group.websiteHostingEnabled && (
                      <>
                        <div className="form-group">
                          <label htmlFor={`indexDocument-${group.id}`}>
                            Index Document
                          </label>
                          <input
                            id={`indexDocument-${group.id}`}
                            type="text"
                            value={group.indexDocument}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "indexDocument",
                                e.target.value
                              )
                            }
                            placeholder="index.html"
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor={`errorDocument-${group.id}`}>
                            Error Document
                          </label>
                          <input
                            id={`errorDocument-${group.id}`}
                            type="text"
                            value={group.errorDocument}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "errorDocument",
                                e.target.value
                              )
                            }
                            placeholder="error.html"
                          />
                        </div>
                      </>
                    )}

                    <div className="form-group checkbox-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={group.createBucketPolicy}
                          onChange={(e) =>
                            updateGroupField(
                              group.id,
                              "createBucketPolicy",
                              e.target.checked
                            )
                          }
                        />
                        Bucket Policy生成
                      </label>
                    </div>

                    {group.createBucketPolicy && (
                      <>
                        <div className="form-group checkbox-group">
                          <label>
                            <input
                              type="checkbox"
                              checked={group.allowCloudFrontReadOnly}
                              onChange={(e) =>
                                updateGroupField(
                                  group.id,
                                  "allowCloudFrontReadOnly",
                                  e.target.checked
                                )
                              }
                            />
                            CloudFront ReadOnly許可サンプルを追加
                          </label>
                        </div>

                        <div className="form-group">
                          <label htmlFor={`allowedPrincipalArn-${group.id}`}>
                            Allowed Principal ARN
                          </label>
                          <input
                            id={`allowedPrincipalArn-${group.id}`}
                            type="text"
                            value={group.allowedPrincipalArn}
                            onChange={(e) =>
                              updateGroupField(
                                group.id,
                                "allowedPrincipalArn",
                                e.target.value
                              )
                            }
                            placeholder="arn:aws:iam::123456789012:role/ExampleRole"
                          />
                        </div>
                      </>
                    )}
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

              {showGuestLimitMessage && (
                <p className="input-error">
                  未認証ユーザーはS3バケット設定を1つまでしか追加できません。
                </p>
              )}

              <button
                type="button"
                className="add-group-button"
                onClick={addGroup}
                disabled={!canAddMoreGroups}
              >
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
            <div>
              <button type="button" disabled={hasError || isTemplateEmpty}>
                Download
              </button>

              <button
                type="button"
                onClick={handleCopy}
                disabled={hasError || isTemplateEmpty}
              >
                Copy
              </button>
            </div>
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