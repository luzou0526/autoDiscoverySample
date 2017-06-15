const PORT = process.argv[2] || '3000',
      NAME = process.argv[3],
      endpoints = { healthCheck: {
                      path: "/health/check",
                      otherConfig: "etc"
                    },
                    configCheck: {
                      path: "/health/config",
                      otherConfig: "etc"
                    }
                  };
      express = require('express'),
      http = require('http'),
      app = express(),
      redis = require('redis'),
      redisSub = redis.createClient("//localhost:6379"),
      redisPub = redis.createClient("//localhost:6379"),
      myConfig = {name: NAME, url: "http://localhost:" + PORT, endpoints: endpoints},
      nodeFetch = require('node-fetch')
      _ = require('underscore');

let configs = {};
configs[myConfig.name] = {url: myConfig.url, endpoints: myConfig.endpoints};

const configUpdate = (newConfigs) => {
    let updated = false;
    for (key in newConfigs) {
        if(configs[key] === undefined ||
           configs[key] === null ||
           !_.isEqual(configs[key], newConfigs[key])){
            configs[key] = newConfigs[key];
            updated = true;
        }
    }
    return updated;
}

let rounds = () => {
    console.log("New Round Start: ********");
    setTimeout(function(){
        for(each in configs) {
            if(each !== myConfig.name){
                try{
                    nodeFetch(configs[each].url + configs[each].endpoints.healthCheck.path)
                        .then(resp => resp.json())
                        .then(resp =>{
                            console.log(resp);
                        }).catch( err => {
                            console.log("Err Occured! " + err.message );
                        });
                } catch (e) {
                    console.log("err");
                }
            }
        }
        console.log("\n");
        rounds();
    },5000);
};

app.get('/health/configs', (req, res) => {
    res.send(JSON.stringify(configs));
});

app.get('/health/check', (req, res) => {
    res.send(JSON.stringify({from: NAME, status: "OK"}));
});

redisSub.on("message", function(channel, message) {
    if (channel === "update_config"){
        let newConfigs = JSON.parse(message);
        if(configUpdate(newConfigs)){
            for(each in configs) {
                console.log(configs[each]);
            }
            redisPub.publish("update_config", JSON.stringify(configs));
        }
    }
    if (channel === "i_am_new"){
        redisPub.publish("update_config", JSON.stringify(configs));
    }
});

redisSub.subscribe("update_config", (err) => {
    console.log("sub update_config");
    redisSub.subscribe("i_am_new", (err) => {
        console.log("sub i_am_new");
        redisPub.publish("update_config", JSON.stringify(configs), (err) => {
            if(err) {
                console.log(err.message);
            }
        });
        redisPub.publish("i_am_new", "", (err) => {
            if(err) {
                console.log(err.message);
            } else {
                app.listen(PORT, () => {
                    console.log('Service ' + NAME + " on " + PORT);
                    rounds();
                });
            }
        });
    });
});
