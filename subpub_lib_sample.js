const PORT = process.argv[2] || '3000',
      NAME = process.argv[3],
      //redisUrl = "//lu-test-redis.geo-dev.moveaws.com:6379",
      redisUrl = "//localhost:6379",
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
      nodeFetch = require('node-fetch'),
      myConfig = {name: NAME, content: {url: "http://localhost:" + PORT, endpoints: endpoints}},
      pubsub = require('./subpub_lib');

app.get('/health/configs', (req, res) => {
    res.send(JSON.stringify(configs));
});

app.get('/health/check', (req, res) => {
    res.send(JSON.stringify({from: NAME, status: "OK"}));
});

let configs = new pubsub(myConfig, redisUrl, {server: app, port: PORT});
configs.setup();

let rounds = () => {
    let latestConfigs = configs.getConfigs();
    console.log("New Round Start: ********");
    setTimeout(function(){
        for(each in latestConfigs) {
            if(each !== myConfig.name){
                try{
                    nodeFetch(latestConfigs[each].url + latestConfigs[each].endpoints.healthCheck.path)
                        .then(resp => resp.json())
                        .then(resp =>{
                            console.log(resp);
                        }).catch( err => {
                            console.log("Err Occured! " + err.message );
                        });
                } catch (e) {
                    console.log(e.message);
                }
            }
        }
        console.log("\n");
        rounds();
    },5000);
};

rounds();
