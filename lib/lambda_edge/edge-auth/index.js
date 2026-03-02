"use strict";

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;

  request.headers["x-my-edge-auth"] = [
    { key: "X-My-Edge-Auth", value: "ok" }
  ];

  return request;
};