const PORT = process.argv[2] || '3000',
      NAME = process.argv[3],
      redisUrl = "localhost",
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
      nodeFetch = require('node-fetch'),
      myConfig = {name: NAME, content: {url: "http://localhost:" + PORT, endpoints: endpoints}},
      pubsub = require('./AutoDiscovery');

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

let configs = new pubsub(myConfig, {url: redisUrl, port: redisPort}, {server: app, port: PORT}, rounds);

app.get('/health/configs', (req, res) => {
    res.send(JSON.stringify(configs));
});

app.get('/health/check', (req, res) => {
    res.send(JSON.stringify({from: NAME, status: "OK"}));
});
