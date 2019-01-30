#!/usr/bin/env node

'use strict';

/*
  Copyright 2018 DigitalSailors e.K.

  Licensed under the Apache License, Version 2.0 (the License);
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an AS IS BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

/*
  NOTES:
  npx ~/GitHub/smokedetector/smokedetector.js
*/

const R = require('ramda');
const fs = require('fs');
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');

const smokedetector = require('./smokedetector-function.js');

const descriptionText = 'This configuration is used by smokedetector. smokedetector allows you to quickly check that the most important urls on a website work. Learn more at https://github.com/digital-sailors/smokedetector';

const optionDefinitions = [
  { name: 'environment', type: String, defaultOption: true, typeLabel: '{underline environment}', description: 'The environment to use. Default: The first configured environment' },
  { name: 'file', alias: 'f', type: String, defaultValue: 'smokedetector.json', typeLabel: '{underline file}', description: 'The configuration file to use. Default: smokedetector.json' },
  { name: 'init', type: Boolean, description: 'Creates an empty configuration file.' },
  XXX { name: 'refresh', type: Boolean, description: 'Discards all previous results and records new expected values for all urls' },
  { name: 'help', alias: 'h', type: Boolean, description: 'Print this usage guide.' }
];

const options = commandLineArgs(optionDefinitions);

if (options.help) {
  const sections = [
    {
      header: 'Smokedetector',
      content: 'A simple smoke test utility for websites.'
    },
    {
      header: 'Synopsis',
      content: [
        '$ npx smokedetector',
        '$ npx smokedetector [{bold --file} {underline file}] [[{bold --environment}] {underline environment}]',
        '$ npx smokedetector {bold --init}',
        '$ npx smokedetector {bold --refresh}',
        '$ npx smokedetector {bold --help}',
      ]
    },
    {
      header: 'Options',
      optionList: optionDefinitions
    }
  ]
  const usage = commandLineUsage(sections)
  console.log(usage)
  return;
} else if (options.init) {
  if (fs.existsSync(options.file)) {
    console.log(`File ${options.file} already exists. Not overwriting this file`);
    return;
  } else {
    const config = {
      description: descriptionText,
      servers: {
        live: {
          host: 'yourserverhere'
        }
      },
      urlspace: {
        http: {
          '/': {},
          '/your/other/http/urls/here.html': {}
        },
        https: {
          '/': {},
          '/your/other/https/urls/here.html': {}
        }
      }
    };

    fs.writeFileSync(options.file, JSON.stringify(config, null, 2));
    return;
  }
}

try {
  const smokedetectorConfigFile = fs.readFileSync(options.file);
  const event = {
    config: JSON.parse(smokedetectorConfigFile),
    hostSelector: options.environment
  }
  
  smokedetector.handler(event, null, r => {
    const description = {
      description: descriptionText
    };
  
    const config = R.merge(description, R.omit([ 'description' ], r));
  
    fs.writeFileSync(options.file, JSON.stringify(config, null, 2));
  });  
} catch (e) {
  if (e.errno == -2) {
    console.log('You have no smokedetector.json file, create one by running: npx smokedetector --init');
  } else {
    console.log(e);
  }
}




