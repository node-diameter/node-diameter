# node-diameter

[![Gitter](https://img.shields.io/badge/gitter-join%20chat-1dce73.svg)](https://gitter.im/node-diameter/node-diameter?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![npm version](https://badge.fury.io/js/diameter.svg)](http://badge.fury.io/js/diameter)
[![Build Status](https://travis-ci.org/node-diameter/node-diameter.svg?branch=master)](https://travis-ci.org/node-diameter/node-diameter)
[![Code Climate](https://codeclimate.com/github/node-diameter/node-diameter/badges/gpa.svg)](https://codeclimate.com/github/node-diameter/node-diameter)
[![Test Coverage](https://codeclimate.com/github/node-diameter/node-diameter/badges/coverage.svg)](https://codeclimate.com/github/node-diameter/node-diameter/coverage)

node-diameter is node.js implementation of Base Diameter protocol. 


## Usage

Check client and server in 'examples' directory. 

To see it in action:

````bash
$ npm install
````

### Start server:
````bash
$ npm run-script example-server
````

### Start client:
````bash
$ npm run-script example-client
````

## Using custom diameter dictionaries

To use your own diameter dictionary, set the 'DIAMETER_DICTIONARY' environment variable to path of the json file containing your dictionary, or name of node module that provides it. See 'node-diameter-dictionary' module for json file format, and how to create a node module that provides a dictionary. 

Note: this module has a dependency on 'node-diameter-dictionary' module, so if you are using your own dictionary, you can optionaly remove the 'node-diameter-dictionary' dependency when doing the npm shrinkwrap of your application. 

## Complementary library

Makes it easier to work with diameter messages, by converting the arrays to objects:

[https://github.com/node-diameter/node-diameter-avp-object](https://github.com/node-diameter/node-diameter-avp-object)
