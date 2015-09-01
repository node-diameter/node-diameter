# node-diameter

[![Join the chat at https://gitter.im/node-diameter/node-diameter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/node-diameter/node-diameter?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

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

