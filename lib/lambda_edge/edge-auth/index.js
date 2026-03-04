'use strict';

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  return request;
};