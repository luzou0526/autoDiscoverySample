# autoDiscoverySample

In microservice world, enable new services without changing configs on the existing services.
No configuration, and auto discovery new services.

## Requirement:
- A Redis Server
- Node.js (express)

## How To:
AutoDiscovery_sample.js is a sample

0. npm install -save auto_discovery
1. In code: </br> `const AutoDiscovery = require('auto_discovery');`
2. Create an express server: </br>
      `express = require('express');` </br>
      `app = express();` </br>
      `PORT= 3000;`
3. Create an object contains the service info: </br>
  ```myConfig = {name: NAME, content: {url: "http://localhost:3000", endpoints: {a: "/endpoint_a", b: "/endpoint_b", ...}}};```
4. Create redis info: </br>
      `redisUrl = "localhost";`</br>
      `redisPort = "6379";`
5. Create autoDiscovery Instance: </br>
  `AutoConfigs = new AutoDiscovery(myConfig, {url: redisUrl, port: redisPort}, {server: app, port: PORT}, null);`

  Any services using the same Redis Server will be enable with auto-discovery feature.
  Save time for configuration management, extra deployments.
