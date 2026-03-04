"use strict";

const COGNITO_DOMAIN = "__COGNITO_DOMAIN__";
const CLIENT_ID = "__CLIENT_ID__";

const SCOPE = "openid email profile";
const ID_TOKEN_COOKIE = "id_token";

function redirect(location) {
  return {
    status: "302",
    statusDescription: "Found",
    headers: {
      location: [{ key: "Location", value: location }],
      "cache-control": [{ key: "Cache-Control", value: "no-store" }],
    },
  };
}

exports.handler = async (event) => {
  const req = event.Records[0].cf.request;
  const uri = req.uri || "/";
  const host = req.headers.host?.[0]?.value;

  const cookie = (req.headers.cookie || []).map((h) => h.value).join("; ");

  const redirectUri = `https://${host}/callback`;
  const logoutUri = `https://${host}/logout`;

  if (uri.startsWith("/logout")) {
    return redirect(
      `${COGNITO_DOMAIN}/logout` +
        `?client_id=${encodeURIComponent(CLIENT_ID)}` +
        `&logout_uri=${encodeURIComponent(logoutUri)}`
    );
  }

  if (uri.startsWith("/callback")) {
    return redirect("/");
  }

  const authed = new RegExp(`(?:^|;\\s*)${ID_TOKEN_COOKIE}=`).test(cookie);
  if (authed) return req;

  const state = encodeURIComponent(uri);
  return redirect(
    `${COGNITO_DOMAIN}/oauth2/authorize` +
      `?response_type=code` +
      `&client_id=${encodeURIComponent(CLIENT_ID)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&scope=${encodeURIComponent(SCOPE)}` +
      `&state=${state}`
  );
};