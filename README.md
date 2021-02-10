# canhazdb-driver-nedb
![GitHub code size in bytes](https://img.shields.io/github/languages/code-size/canhazdb/driver-nedb)
[![GitHub package.json version](https://img.shields.io/github/package-json/v/canhazdb/driver-nedb)](https://github.com/canhazdb/driver-nedb/blob/master/package.json)
[![GitHub](https://img.shields.io/github/license/canhazdb/driver-nedb)](https://github.com/canhazdb/driver-nedb/blob/master/LICENSE)
[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg)](https://github.com/standard/semistandard)

An nedb driver for canhazdb.

### Server Via the CLI
```bash
npm install --global canhazdb-driver-nedb
```

```bash
canhazdb-server \
  --driver canhazdb-driver-nedb \
  --host localhost \
  --port 7061 \
  --query-port 8061 \
  --data-dir ./canhazdb/one \
  --tls-ca ./certs/ca.cert.pem \
  --tls-cert ./certs/localhost.cert.pem \
  --tls-key ./certs/localhost.privkey.pem
```

### Server Via NodeJS
```bash
npm install --save canhazdb-driver-nedb
```

```javascript
const fs = require('fs');
const canhazdb = require('canhazdb-server');

async function main () {
  const tls = {
    key: fs.readFileSync('./certs/localhost.privkey.pem'),
    cert: fs.readFileSync('./certs/localhost.cert.pem'),
    ca: [ fs.readFileSync('./certs/ca.cert.pem') ],
    requestCert: true /* this denys any cert not signed with our ca above */
  };

  const node1 = await canhazdb({
    driver: require('canhazdb-driver-nedb'),
    host: 'localhost',
    port: 7061, queryPort: 8061,
    dataDirectory: './canhazdata/one',
    tls, single: true
  });
```

## License
This project is licensed under the terms of the AGPL-3.0 license.
