'use strict';

/*
  Copyright 2018 DigitalSailors e.K.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const R = require('ramda');
const fetch = require('node-fetch');

exports.handler = async function(event, context, callback) {
  const description = {
    description: 'This file is used by smokedetector. smokedetector allows you to quickly check that the most important urls on a website work.'
  };

  const config = R.merge(description, R.omit([ 'description' ], event.config));

  const hostSelector = event.hostSelector || R.keys(config.servers)[0];
  const host = config.servers[hostSelector].host;
  const disableHttps = config.servers[hostSelector].disableHttps;

  console.log('Testing', host);

  config.urlspace.http = await checkProtocol('http://', host, config.urlspace.http || {});
  config.urlspace.https = await checkProtocol(disableHttps ? 'http://' : 'https://', host, config.urlspace.https || {});

  const httpResult = evaluateResult('http://', host, config.urlspace.http || {});
  const httpsResult = evaluateResult(disableHttps ? 'http://' : 'https://', host, config.urlspace.https || {});
  config.result = R.mergeWith(R.add, httpResult, httpsResult);

  console.log(config.result);

  callback(config);
}

function evaluateResult(protocol, host, urlspace) {
  const evaluateHost = R.partial(evaluateURL) ([ protocol, host ]);
  return R.compose(R.map(R.length), R.groupBy(b => b ? 'Succeeded' : 'Failed'), R.values, R.mapObjIndexed(evaluateHost)) (urlspace);
}

function evaluateURL(protocol, host, config, url) {
  if (config.expectedStatus == config.status) {
    return true;
  } else {
    console.error(`${protocol}${host}${url}: [Expected: ${config.expectedStatus}] Status: ${config.status}`);
    return false;
  }
}

async function checkProtocol(protocol, host, urlspace) {
  const checkHost = R.partial(checkURL) ([ protocol, host ]);
  const resultPromises = R.compose(R.values, R.mapObjIndexed(checkHost)) (urlspace);
  const urlResults = await Promise.all(resultPromises);
  return R.mergeAll(urlResults);
}

async function checkURL(protocol, host, config, url) {
  const response = await fetch(protocol + host + url);
  if (!config.expectedStatus) {
    config.expectedStatus = response.status;
  }
  config.status = response.status;
  return R.objOf(url, config);
}
