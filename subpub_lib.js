'use strict';

const redis = require('redis'),
      _ = require('underscore');

function AutoConfig(myConfig, redisUrl, appOptions) {
    this.server = appOptions.server;
    this.port = appOptions.port || 3000;
    this.myConfig = myConfig;
    this.name = myConfig.name;
    this.redisUrl = redisUrl;
    this.redisSub = redis.createClient(redisUrl);
    this.redisPub = redis.createClient(redisUrl);
    this.configs = {};
    this.configs[myConfig.name] = myConfig.content || {};
};

AutoConfig.prototype.update_conf = function(newConfigs) {
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

AutoConfig.prototype.setup = function() {
    let me = this;
    if(me.redisUrl && me.server){
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
                console.log(err.message);
            }
            console.log("sub update_config");
            me.redisSub.subscribe("i_am_new", (err) => {
                if(err) {
                    console.log(err.message);
                } else {
                    console.log("sub i_am_new");
                    me.redisPub.publish("update_config", JSON.stringify(me.configs), (err) => {
                        if(err) {
                            console.log(err.message);
                        }
                    });
                    me.redisPub.publish("i_am_new", "", (err) => {
                        if(err) {
                            console.log(err.message);
                        } else {
                            me.server.listen(me.port, () => {
                                console.log('Service ' + me.name + " on " + me.port);
                            });
                        }
                    });
                }
            });
        });
    }
}

AutoConfig.prototype.getConfigs = function() {
    return this.configs;
};

module.exports = AutoConfig;
