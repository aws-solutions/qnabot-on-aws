/*
Copyright 2017-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.

Licensed under the Amazon Software License (the "License"). You may not use this file
except in compliance with the License. A copy of the License is located at

http://aws.amazon.com/asl/

or in the "license" file accompanying this file. This file is distributed on an "AS IS"
BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, express or implied. See the
License for the specific language governing permissions and limitations under the License.
*/

var port=8001
module.exports = {
  src_folders: ['specs'],
  output_folder: 'reports',
  page_objects_path:"pages",

  selenium: {
    start_process: true,
    server_path: require('selenium-server').path,
    port: port,
    cli_args: {
      'webdriver.chrome.driver': require('chromedriver').path
    }
  },

  test_settings: {
    default: {
      launch_url:process.env.URL,
      selenium_port: port,
      selenium_host: 'localhost',
      silent: true,
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
           args: [
                "--headless"
            ]
        },
        javascriptEnabled: true,
        acceptSslCerts: true
      }
    }
  }
}
