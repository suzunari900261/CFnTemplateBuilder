"use strict";

function header(req, nameLower) {
  return req.headers?.[nameLower]?.[0]?.value;
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;

  // CloudFront の Cookie ヘッダーは "a=b; c=d" 形式
  const parts = cookieHeader.split(";").map((v) => v.trim());
  for (const p of parts) {
    const i = p.indexOf("=");
    if (i <= 0) continue;
    const k = p.slice(0, i);
    const v = p.slice(i + 1);
    out[k] = decodeURIComponent(v);
  }
  return out;
}

function redirect(location) {
  return {
    status: "302",
    statusDescription: "Found",
    headers: {
      location: [{ key: "Location", value: location }],
      // 認証系リダイレクトはキャッシュさせない
      "cache-control": [
        { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
      ],
      pragma: [{ key: "Pragma", value: "no-cache" }],
    },
  };
}

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const uri = request.uri || "/";

  const cognitoDomain = process.env.COGNITO_DOMAIN; // 例: https://xxx.auth.ap-northeast-1.amazoncognito.com
  const clientId = process.env.USER_POOL_CLIENT_ID;

  if (!cognitoDomain || !clientId) {
    // env不足は設定ミスなので明示的に 500
    return {
      status: "500",
      statusDescription: "Server Error",
      headers: {
        "content-type": [{ key: "Content-Type", value: "text/plain; charset=utf-8" }],
        "cache-control": [{ key: "Cache-Control", value: "no-store" }],
      },
      body: "Missing env: COGNITO_DOMAIN or USER_POOL_CLIENT_ID",
    };
  }

  // CloudFront ドメイン（xxxx.cloudfront.net）
  const host = header(request, "host");
  const redirectUri = `https://${host}/callback`;
  const logoutUri = `https://${host}/logout`;

  // /logout は Hosted UI の logout endpoint に飛ばす（Cookie削除は次ステップ）
  if (uri.startsWith("/logout")) {
    const logoutUrl =
      `${cognitoDomain}/logout` +
      `?client_id=${encodeURIComponent(clientId)}` +
      `&logout_uri=${encodeURIComponent(logoutUri)}`;

    return redirect(logoutUrl);
  }

  // /callback は「Cognito から戻ってくる受け口」
  // 次ステップでここに code→token 交換 & Set-Cookie を実装する
  if (uri.startsWith("/callback")) {
    // いまはデバッグしやすいようにトップへ戻す
    // （次ステップでは code を見て token 交換に進む）
    return redirect("/");
  }

  // それ以外は「認証済みか」を Cookie で判定（次ステップで token を保存する前提）
  const cookieHeader = request.headers.cookie?.[0]?.value;
  const cookies = parseCookies(cookieHeader);

  // ここでは Cookie 名を仮に "id_token" とする（次ステップで合わせる）
  // Cookie がある＝認証済み扱い（JWT検証は後で追加可能）
  if (cookies.id_token) {
    return request; // 認証済み → S3へ
  }

  // 未認証 → Hosted UI authorize（Authorization Code Grant）
  // state に「元のパス」を入れて、ログイン後に戻せるようにする（次ステップで利用）
  const state = encodeURIComponent(uri);

  const authorizeUrl =
    `${cognitoDomain}/oauth2/authorize` +
    `?response_type=code` +
    `&client_id=${encodeURIComponent(clientId)}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent("openid email profile")}` +
    `&state=${state}`;

  return redirect(authorizeUrl);
};