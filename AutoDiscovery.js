'use strict';

const redis = require('redis'),
      _ = require('underscore');

function AutoDiscovery(myConfig, redisOptions, appOptions, callback) {
    this.server = appOptions.server;
    this.port = appOptions.port || 3000;
    this.myConfig = myConfig;
    this.name = myConfig.name;
    this.redisUrl = redisOptions.url;
    this.redisPort = redisOptions.port;
    this.redisSub = appOptions.redisSub || redis.createClient(this.redisPort, this.redisUrl);
    this.redisPub = appOptions.redisPub || redis.createClient(this.redisPort, this.redisUrl) ;
    this.configs = {};
    this.configs[myConfig.name] = myConfig.content || {};
    this.setup(callback);
};

AutoDiscovery.prototype.update_conf = function(newConfigs) {
    let updated = false;
    for (let key in newConfigs) {
        if(this.configs[key] === undefined ||
           this.configs[key] === null ||
           !_.isEqual(this.configs[key], newConfigs[key])){
            this.configs[key] = newConfigs[key];
            updated = true;
        }
    }
    return updated;
};

AutoDiscovery.prototype.setup = function(callback) {
    let me = this;
    if(me.redisUrl && me.redisPort && me.server){
        me.redisSub.on("message", function(channel, message) {
            if (channel === "update_config"){
                let newConfigs = JSON.parse(message);
                if(me.update_conf(newConfigs)){
                    for(let each in me.configs) {
                        console.log(me.configs[each]);
                    }
                    me.redisPub.publish("update_config", JSON.stringify(me.configs));
                }
            }
            if (channel === "i_am_new"){
                me.redisPub.publish("update_config", JSON.stringify(me.configs));
            }
        });

        me.redisSub.subscribe("update_config", (err) => {
            if(err) {
                console.log(err);
            }
            me.redisSub.subscribe("i_am_new", (err) => {
                if(err) {
                    console.log(err);
                } else {
                    me.redisPub.publish("update_config", JSON.stringify(me.configs), (err) => {
                        if(err) {
                            console.log(err);
                        }
                    });
                    me.redisPub.publish("i_am_new", "", (err) => {
                        if(err) {
                            console.log(err);
                        } else {
                            me.server.listen(me.port, () => {
                                console.log('Service ' + me.name + " on " + me.port);
                            });
                        }
                    });
                    if(callback){
                        callback();
                    }
                }
            });
        });
    } else {
        console.log("Need Redis or Server info");
    }
}

AutoDiscovery.prototype.getConfigs = function() {
    return this.configs;
};

module.exports = AutoDiscovery;
