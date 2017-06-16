const PORT = process.argv[2] || '3000',
      NAME = process.argv[3],
      redisUrl = "lu-test-redis.geo-dev.moveaws.com",
      redisPort = "6379",
      endpoints = { healthCheck: {
                      path: "/health/check",
                      otherConfig: "etc"
                    },
                    configCheck: {
                      path: "/health/config",
                      otherConfig: "etc"
                    }
                  },
      express = require('express'),
      app = express(),
      redis = require('redis'),
      redisSub = redis.createClient(redisPort, redisUrl),
      redisPub = redis.createClient(redisPort, redisUrl),
      nodeFetch = require('node-fetch'),
      myConfig = {name: NAME, content: {url: "http://localhost:" + PORT, endpoints: endpoints}},
      pubsub = require('./AutoDiscovery');

      redisSub.on("ready", function(){ console.log(123);});
      redisPub.on("ready", function(){ console.log(456);});
