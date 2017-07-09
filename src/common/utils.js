const utils = require('ntils');
const path = require('path');

utils.resolve = function (from, to) {
  if (!from || !to || /^\S+\:\/\//.test(to)) return to;
  let fromParts = from.split('://');
  let protocol, baseUri;
  if (fromParts.length > 1) {
    protocol = fromParts[0];
    baseUri = fromParts[1];
  } else {
    protocol = '';
    baseUri = fromParts[0];
  }
  baseUri = path.dirname(path.normalize(`/${baseUri}`));
  let resolveUri = path.resolve(baseUri, to);
  if (protocol) {
    resolveUri = `${protocol}:/${resolveUri}`;
  }
  return resolveUri;
};

module.exports = utils;