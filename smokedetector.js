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

const R = require('ramda');
const fs = require('fs');

const smokedetector = require('./smokedetector-function.js');

const descriptionText = 'This configuration is used by smokedetector. smokedetector allows you to quickly check that the most important urls on a website work. Learn more at https://github.com/digital-sailors/smokedetector';

if (process.argv[2] == 'init') {
  if (fs.existsSync('smokedetector.json')) {
    console.log('File smokedetector.json already exists. Not overwriting this file');
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

    fs.writeFileSync('smokedetector.json', JSON.stringify(config, null, 2));
    return;
  }
}

try {
  const smokedetectorConfigFile = fs.readFileSync('smokedetector.json');
  const event = {
    config: JSON.parse(smokedetectorConfigFile),
    hostSelector: process.argv[2]
  }
  
  smokedetector.handler(event, null, r => {
    const description = {
      description: descriptionText
    };
  
    const config = R.merge(description, R.omit([ 'description' ], r));
  
    fs.writeFileSync('smokedetector.json', JSON.stringify(config, null, 2));
  });  
} catch (e) {
  if (e.errno == -2) {
    console.log('You have no smokedetector.json file, create one by running: npm smokedetector init');
  } else {
    console.log(e);
  }
}




