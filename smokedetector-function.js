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
var URL = require('url').URL;

exports.handler = async function(event, context, callback) {

  const config = event.config;
  
  const hostSelector = event.hostSelector || R.keys(config.servers)[0];
  const host = config.servers[hostSelector].host;
  const disableHttps = config.servers[hostSelector].disableHttps;

  console.log('Testing', host);

  if (disableHttps) {
    // prefer https uris (remove http uris from check that have an https equivalent)
    const httpURIs = config.urlspace.https ? R.keys(config.urlspace.https) : [];
    const httpUrlspace = R.omit(httpURIs, config.urlspace.http || {});

    const httpCheckResult = await checkProtocol('http://', host, httpUrlspace, event.verbose);
    config.urlspace.http = R.merge(config.urlspace.http, httpCheckResult);

    const httpsCheckResult = await checkProtocol('http://', host, config.urlspace.https || {}, event.verbose);
    config.urlspace.https = R.merge(config.urlspace.https, httpsCheckResult);

    const httpResult = evaluateResult('http://', host, httpUrlspace);
    const httpsResult = evaluateResult('http://', host, config.urlspace.https || {});

    config.result = config.result || {};
    config.result[hostSelector] = R.mergeWith(R.add, httpResult, httpsResult);
  } else {
    config.urlspace.http = await checkProtocol('http://', host, config.urlspace.http || {}, event.verbose);
    config.urlspace.https = await checkProtocol('https://', host, config.urlspace.https || {}, event.verbose);

    const httpResult = evaluateResult('http://', host, config.urlspace.http || {});
    const httpsResult = evaluateResult('https://', host, config.urlspace.https || {});
    
    config.result = config.result || {};
    config.result[hostSelector] = R.mergeWith(R.add, httpResult, httpsResult);    
  }

  console.log(config.result[hostSelector]);

  callback(config);
}

function evaluateResult(protocol, host, urlspace) {
  const evaluateHost = R.partial(evaluateURL) ([ protocol, host ]);
  return R.compose(R.map(R.length), R.groupBy(b => b ? 'Succeeded' : 'Failed'), R.values, R.mapObjIndexed(evaluateHost)) (urlspace);
}

function evaluateURL(protocol, host, config, url) {
  if (config.expectedStatus == config.status) {
    if (config.expectedLocationURI == config.locationURI) {
      return true;
    } else {
      console.error(`${protocol}${host}${url}: Status: ${config.status} [Expected location: ${config.expectedLocationURI}] Location: ${config.locationURI}`);
      return false;
      }
  } else {
    console.error(`${protocol}${host}${url}: [Expected status: ${config.expectedStatus}] Status: ${config.status}`);
    return false;
  }
}

async function checkProtocol(protocol, host, urlspace, verbose) {
  const checkHost = R.partial(checkURL) ([ protocol, host, verbose ]);
  const resultPromises = R.compose(R.values, R.mapObjIndexed(checkHost)) (urlspace);
  const urlResults = await Promise.allSettled(resultPromises);
  return R.mergeAll(R.pluck('value', urlResults));  // maybe check status of promises?  { status: 'fulfilled' }
}

async function checkURL(protocol, host, verbose, config, url) {
  const finalUrl = protocol + host + url;
  if (verbose) {
    console.log('Checking URL:', finalUrl);
  }
  const response = await fetch(finalUrl, { redirect: 'manual' });

  // status
  config.status = response.status;
  if (verbose) {
    console.log(`Got status ${config.status} for URL:`, finalUrl);
  }
  if (!config.expectedStatus) {
    config.expectedStatus = response.status;
  }

  // location header, if present
  const location = response.headers.get('location');
  if (location) {
    // TODO check host
    const locationUrl = new URL(location);
    const relativeURI = `${locationUrl.pathname}${locationUrl.search}${locationUrl.hash}`;
    config.locationURI = relativeURI;
    if (!config.expectedLocationURI) {
      config.expectedLocationURI = relativeURI;
    }
  }

  return R.objOf(url, config);
}
