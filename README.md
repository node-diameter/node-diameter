# node-diameter

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

node-diameter will use dictionaries you put in 'dictionaries' directory, in Wireshark xml format. On first launch, it will parse XML files, and store the dictionary in 'dictionary.json', in LokiJS database. 

