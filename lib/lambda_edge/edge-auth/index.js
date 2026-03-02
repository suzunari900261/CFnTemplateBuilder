"use strict";

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;

  request.headers["x-edge-auth"] = [{ key: "x-edge-auth", value: "ok" }];

  return request;
};