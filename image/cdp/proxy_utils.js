const utils = require('../utils');
const request = require('request');

qp_base_url = 'https://quantumpuppy.com'

async function get_proxy() {
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/proxy/${process.env.PROXY_ID}/`
    var headers = {'Content-Type': 'application/json'}
    console.log("Getting proxy...")
    request.get({url: url, headers: headers}, function(err, httpResponse, data) {
      resolve(JSON.parse(data));
    });
  });
}

async function triggerProxyRotation() {
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/proxy/${process.env.PROXY_ID}/ip_rotation/trigger/`
    var headers = {'Content-Type': 'application/json'}
    console.log("Triggering IP rotation...")
    request.post({url: url, headers: headers}, function(error, httpResponse, data) {
      if (error) throw new Error(error);
      resolve();
    });
  });
}

async function hasIPRotated() {
  return new Promise((resolve, reject) => {
    var url = `${qp_base_url}/star-destroyer/proxy/${process.env.PROXY_ID}/ip_rotation/status/`
    var headers = {'Content-Type': 'application/json'}
    console.log("Checking IP rotation status...")
    request.get({url: url, headers: headers}, function(error, httpResponse, data) {
      if (error) throw new Error(error);
      var resp = JSON.parse(data);
      console.log("data", resp)
      resolve(resp['has_ip_rotated']);
    });
  });
}

async function rotateIPAddress(maxAttempts = 20) {
  await exports.triggerProxyRotation();
  let hasIPRotated = await exports.hasIPRotated()
  const retryWait = 3000;
  let currentAttempt = 1;
  while (!hasIPRotated && currentAttempt <= maxAttempts) {
    console.log(`Attempt # ${currentAttempt} IP has not been rotated yet. Waiting for ${retryWait / 1000} seconds before checking status again.`)
    await utils.sleep(retryWait);
    hasIPRotated = await exports.hasIPRotated()
    currentAttempt++;
  }

  if (hasIPRotated) {
    console.log(`Attempt # ${currentAttempt} IP rotated successfully after ${(retryWait * currentAttempt) / 1000} seconds. Continuing..`)
  } else {
    console.log(`Attempt # ${currentAttempt} IP is still not rotated after ${(retryWait * currentAttempt) / 1000} seconds. Quit..`)
  }
  return hasIPRotated;
}

exports.get_proxy = get_proxy;
exports.triggerProxyRotation = triggerProxyRotation;
exports.hasIPRotated = hasIPRotated;
exports.rotateIPAddress = rotateIPAddress;
