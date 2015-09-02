# node-diameter

[![Gitter](https://img.shields.io/badge/gitter-join%20chat-1dce73.svg)](https://gitter.im/node-diameter/node-diameter?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge)
[![Code Climate](https://codeclimate.com/github/node-diameter/node-diameter/badges/gpa.svg)](https://codeclimate.com/github/node-diameter/node-diameter)

node-diameter is node.js implementation of Base Diameter protocol. 

> *Warning* - still under development, expect frequent API changes. 

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

## Dictionary

node-diameter uses the dictionary stored in 'dictionary.json', which is a LokiJS database. You can generate this database from Wireshark style dictionary XML files with:

https://github.com/node-diameter/node-diameter-dictionary-parser
