// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

var aws=require('aws-sdk')
var cfnLambda=require('cfn-lambda')
var Promise=require('bluebird')
aws.config.region=process.env.REGION
aws.config.setPromisesDependency(Promise)
var lex=new aws.LexModelBuildingService()
var iam=new aws.IAM()

function makeid(prefix){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for( var i=0; i < 5; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text
}

function id(length){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

    for( var i=0; i < length; i++ )
    text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text
}

function clean(name){
    var map={
        '0':'zero',
        '1':'one',
        '2':'two',
        '3':'three',
        '4':'four',
        '5':'five',
        '6':'six',
        '7':'seven',
        '8':'eight',
        '9':'nine',
        '-':'_',
    }
    var out=name.replace(/([0-9])/g,x=>map[x])
    out=out.replace(/-/g,'_')
    return out
}

function run(fnc,params){
    console.log(fnc+':request:'+JSON.stringify(params,null,3))
    return new Promise(function(res,rej){
        var next=function(count){
            console.log("tries-left:"+count)
            var request=lex[fnc](params)
            request.promise()
            .tap(x=>console.log(fnc+':result:'+JSON.stringify(x,null,3)))
            .then(res)
            .catch(function(err){
                console.log(fnc+':'+err.code)
                var retry = err.retryDelay || 5
                console.log("retry in "+retry)

                if(err.code==="ConflictException"){
                    count===0 ? rej("Error") : setTimeout(()=>next(--count),retry*1000)
                }else if(err.code==="ResourceInUseException"){
                    count===0 ? rej("Error") : setTimeout(()=>next(--count),retry*1000)
                }else if(err.code==="LimitExceededException"){
                    setTimeout(()=>next(count),retry*1000)
                }else if(err.code==="AccessDeniedException"){
                    setTimeout(()=>next(count),retry*1000)
                }else{
                    rej(err.code+':'+err.message)
                }
            })
        }
        next(10)
    })
}


class Lex {
    constructor(type) {
        this.type = type
        this.create_method = 'put' + type
        this.update_method = 'put' + type
        this.delete_method = 'delete' + type
        this.get_method = "get" + type
    }
    checksum(id,version){
        return lex[this.get_method]({
            name:id,
            versionOrAlias:version,
        }).promise().get("checksum")
    }
    checksumIntentOrSlotType(id,version){
        return lex[this.get_method]({
            name:id,
            version:version,
        }).promise().get("checksum")
    }
    checksumBotAlias(botName, name){
        return lex[this.get_method]({
            botName:botName,
            name:name
        }).promise().get("checksum")
    }

    /**
     * Find all versions of a given slottype. Lex API returns an array of objects that describe
     * the available versions of a given slottype. This function returns a promise that resolves
     * to that array.
     * @param id
     * @returns {Promise<PromiseResult<LexModelBuildingService.GetSlotTypeVersionsResponse, AWSError>>}
     */
    slotTypeVersions(id){
        return lex["getSlotTypeVersions"]({
            name:id,
            maxResults: 50,
        }).promise();
    }

    /**
     * Find all versions of a given intent. Lex API returns an array of objects that describe
     * the available versions of a given intent. THis function returns a promise that
     * resolves to that array.
     * @param id
     * @returns {Promise<PromiseResult<LexModelBuildingService.GetIntentVersionsResponse, AWSError>>}
     */
    intentVersions(id){
        return lex["getIntentVersions"]({
            name:id,
            maxResults: 50,
        }).promise();
    }

    /**
     * For a given array of intents, resolve the Promise with a map containing the latest version each
     * Intent in the array
     * @param intents
     * @returns {Promise|Promise}
     */
    mapForIntentVersions(intents) {
        return new Promise ( (resolve, reject)=>{
            let p1=[];
            /**
             * For each Intent in this bot find the latest version number
             */
            intents.forEach(element=>{
                p1.push(this.intentVersions(element.intentName));
            });
            Promise.all(p1).then( values => {
                // store a map of the latest version found for each intent. By definition the
                // highest version of each intent will be the last element.
                const map = new Map();
                values.forEach(results => {
                    const element = results.intents[results.intents.length - 1];
                    map.set(element.name, element.version);
                });
                resolve(map);
            }).catch(error=>{reject(error)});
        });
    }

    /**
     * Find all versions of a given Bot. Lex API returns an array of versions available for a given
     * Bot. This functions resolves the promise and returns that array.
     * @param id
     * @returns {*}
     */
    botVersions(id){
        return lex["getBotVersions"]({
            name:id,
            maxResults: 50,
        }).promise().get("bots");
    }

    /**
     * For the given botName, resolve the Promise with the latest version of the Bot
     * @param botName
     * @returns {Promise|Promise}
     */
    latestBotVersion(botName) {
        return new Promise((resolve, reject) => {
            this.botVersions(botName).then(versions => {
                const botVersion = versions[versions.length - 1].version; // last version
                resolve(botVersion);
            }).catch(error => {
                console.log('Error obtaining bot version: ' + error);
                reject(error);
            });
        });
    }

    /**
     * For a given array of SlotTypes, resolve the Promise with a map containing the latest version each
     * SlotType in the array whose version is managed by QNABOT using QNABOT-AUTO-ASSIGNED.
     * @param array of SlotTypes
     * @returns {Promise|Promise}
     */
    mapForSlotTypeVersions(slots) {
        return new Promise((resolve, reject) => {
            let p1 = [];
            const slotTypeMap = new Map();
            if (slots) {
                slots.forEach(element => {
                    if (element.slotTypeVersion === "QNABOT-AUTO-ASSIGNED") {
                        p1.push(this.slotTypeVersions(element.slotType));
                    }
                });
            }
            if (p1.length > 0) {
                Promise.all(p1).then(values => {
                    values.forEach(results => {
                        const element = results.slotTypes[results.slotTypes.length - 1];
                        slotTypeMap.set(element.name, element.version);
                    });
                    resolve(slotTypeMap);
                }).catch(error=>{reject(error)});
            } else {
                resolve(slotTypeMap);
            }
        });
    }

    name(params){
        if (this.type === 'BotAlias' && params.name) {
            // use name defined in template if provided otherwise generate a name
            return params.name;
        } else {
            var name = params.name ? clean(params.name) : this.type + makeid()
            name = params.prefix ? [params.prefix, name].join('_') : name;
            return name.slice(0, 35) + id(5)
        }
    }

    /**
     * Create is called to construct Bot resources. Dependent resource versions are identified and
     * updated as available.
     * @param params
     * @param reply
     * @constructor
     */
    Create(params,reply){
        console.log('Create Lex. Params: ' + JSON.stringify(params,null,2))
        console.log('Type: ' + this.type)
        var self=this
        params.name=this.name(params)
        console.log('Create params.name: ' + params.name)
        delete params.prefix
        if(params.childDirected){
            params.childDirected={"false":false,"true":true}[params.childDirected]
        }
        if(params.detectSentiment){
            params.detectSentiment={"false":false,"true":true}[params.detectSentiment]
        }
        if(params.createVersion){
            params.createVersion={"false":false,"true":true}[params.createVersion]
        }
        var start=Promise.resolve();
        if (this.type==='BotAlias') {
            params.botVersion = '1'; // default version. Should be replaced by call to latestBotVersion.
            this.latestBotVersion(params.botName).then(version => {
                params.botVersion = version
                console.log("BotAlias parameters for Create are: " + JSON.stringify(params,null,2));
                start.then(()=>run(self.create_method,params))
                    .then(msg=>reply(null,msg.name,null))
                    .catch(error => { console.log('caught', error); reply(error); })
                    .error(reply).catch(reply)
            }).catch(error => { console.log('caught', error); reply(error);})
        }
        else if(this.type==='Intent') {
            if (params.slots && params.slots.length > 0) {
                this.mapForSlotTypeVersions(params.slots).then( slotTypeMap => {
                    params.slots.forEach(element => {
                        if (slotTypeMap.get(element.slotType)) {
                            element.slotTypeVersion = slotTypeMap.get(element.slotType);
                        }
                    });
                    console.log("Intent parameters for create are: " + JSON.stringify(params, null, 2));
                    start.then(()=>run(self.create_method, params)
                        .then(msg => reply(null, msg.name, null))
                        .catch(error => {
                            console.log('caught', error);
                            reply(error);
                        })
                        .error(reply).catch(reply)
                    );
                }).catch(error => {
                    console.log('caught', error);
                    reply(error);
                });
            } else {
                start.then(()=>run(self.create_method, params))
                    .then(msg => reply(null, msg.name, null))
                    .catch(error => {
                        console.log('caught', error);
                        reply(error);
                    })
                    .error(reply).catch(reply)
            }
        }
        else if (this.type==='Bot') {
            params.processBehavior = "BUILD";
            start = iam.createServiceLinkedRole({
                AWSServiceName: 'lex.amazonaws.com',
                Description: 'Service linked role for lex'
            }).promise()
                .tap(console.log)
                .catch(console.log)
            if (params.intents) {
                this.mapForIntentVersions(params.intents).then(map => {
                    params.intents.forEach(element=>{
                        element.intentVersion = map.get(element.intentName);
                    });
                    params.processBehavior = "BUILD";
                    console.log('Final params before call to create method: ' + JSON.stringify(params,null,2));
                    start.then(() => run(self.create_method, params)
                        .then(msg => reply(null, msg.name, null))
                        .catch(error => {
                            console.log('caught', error);
                            reply(error);
                        })
                        .error(reply).catch(reply)
                    );
                    }).catch(error => {
                        console.log('caught', error);
                        reply(error);
                    });
            } else {
                start.then(() => run(self.create_method, params)
                    .then(msg => reply(null, msg.name, null))
                    .catch(error => {
                        console.log('caught', error);
                        reply(error);
                    })
                    .error(reply).catch(reply)
                );
            }
        }
        else {
            console.log("Generic create called for: " + JSON.stringify(params,null,2));
            start.then(() => run(self.create_method, params)
                .then(msg => reply(null, msg.name, null))
                .catch(error => {
                    console.log('caught', error);
                    reply(error);
                })
                .error(reply).catch(reply)
            );
        }
    }

    /**
     * Update a resource for a Lex Bot, Intent, SlotType, Alias. Update for each resource is designed to
     * find the most recent version of a dependent resource and use the last version of that dependent resource.
     * So an Intent will find the most recent version number of referenced SlotTypes. A Bot will find the most
     * recent version of a referenced Intents. BotAlias will find the most recent version number of a Bot. The
     * correct checksums most also be identified to correctly call put operations against these resources. Promises
     * are used to find checksums and versions and when complete will drive the assignment of versions referenced
     * by parent resources.
     * @param ID
     * @param params
     * @param oldparams
     * @param reply
     * @constructor
     */
    Update(ID,params,oldparams,reply){
        console.log('Update Lex. ID: ' + ID)
        console.log('Params: ' + JSON.stringify(params,null,2))
        console.log('OldParams: ' + JSON.stringify(oldparams,null,2))
        console.log('Type: ' + this.type)
        delete params.prefix
        var self=this
        if(this.type!=='Alias'){ // The type of Alias should not be updated.
            if(params.childDirected){
                params.childDirected={"false":false,"true":true}[params.childDirected]
            }
            if(params.detectSentiment){
                params.detectSentiment={"false":false,"true":true}[params.detectSentiment]
            }
            if(params.createVersion){
                params.createVersion={"false":false,"true":true}[params.createVersion]
            }
            if (this.type==='Bot') {
                params.name = ID;
                try {
                    /**
                     * Updates are always made against the $LATEST version so find the checksum of this version.
                     */
                    this.checksum(ID,'$LATEST').then( cksum => {
                        params.checksum = cksum;
                        this.mapForIntentVersions(params.intents).then(map => {
                            params.intents.forEach(element=>{
                               element.intentVersion = map.get(element.intentName);
                            });
                            params.processBehavior = "BUILD";
                            console.log('Final params before call to update method: ' + JSON.stringify(params,null,2));
                            run(self.update_method, params)
                                .then(msg => reply(null, msg.name, null))
                                .catch(error => {
                                    console.log('caught', error);
                                    reply(error);
                                })
                                .error(reply).catch(reply)
                        }).catch(error => {
                            console.log('caught', error);
                            reply(error);
                        });
                    }).catch(error => { console.log('caught', error); reply(error); })
                } catch (err) {
                    console.log("Exception detected: " + err);
                    reply(null, ID);
                }
            } else if (this.type==='Intent') {
                /**
                 * Update an Intent
                 */
                params.name = ID;
                try {
                    // find the checksum for the $LATEST version to use for update
                    this.checksumIntentOrSlotType(ID,'$LATEST').then(cksum => {
                        params.checksum = cksum;
                        if (params.slots && params.slots.length > 0) {
                            this.mapForSlotTypeVersions(params.slots).then( slotTypeMap => {
                                params.slots.forEach(element => {
                                    if (slotTypeMap.get(element.slotType)) {
                                        element.slotTypeVersion = slotTypeMap.get(element.slotType);
                                    }
                                });
                                console.log("Intent parameters for update are: " + JSON.stringify(params, null, 2));
                                run(self.update_method, params)
                                    .then(msg => reply(null, msg.name, {}))
                                    .catch(error => {
                                        console.log('caught', error);
                                        reply(error);
                                    })
                                    .error(reply).catch(reply)
                            }).catch(error => {
                                console.log('caught', error);
                                reply(error);
                            });
                        } else {
                            console.log("Intent parameters for update are: " + JSON.stringify(params, null, 2));
                            run(self.update_method, params)
                                .then(msg => reply(null, msg.name, {}))
                                .catch(error => {
                                    console.log('caught', error);
                                    reply(error);
                                })
                                .error(reply).catch(reply)
                        }
                    }).catch(error => { console.log('caught', error); reply(error);})
                } catch (err) {
                    console.log("Exception detected: " + err);
                    reply(null, ID);
                }
            } else if (this.type==='SlotType') {
                /**
                 * Update SlotType. This requires finding the checksum of the more recent version
                 * of the SlotType.
                 */
                params.name = ID;
                try {
                    this.slotTypeVersions(ID).then(versions => {
                        this.checksumIntentOrSlotType(ID,'$LATEST').then(cksum => {
                            params.checksum = cksum;
                            console.log("Slot parameters for update are: " + JSON.stringify(params,null,2));
                            run(self.update_method, params)
                                .then(msg => reply(null, msg.name, null))
                                .catch(error => { console.log('caught', error); reply(error);})
                                .error(reply).catch(reply)
                        }).catch(error => { console.log('caught', error); reply(error);})
                    })
                } catch (err) {
                    console.log("Exception detected: " + err);
                    reply(null, ID);
                }
            } else if (this.type==='BotAlias') {
                /**
                 * Update a BotAlias. This requires obtaining:
                 * - the checksum of the BotAlias
                 * - the latest version of the Bot now existing on the system
                 * With these two pieces of information an update can occur using the "run" method.
                 */
                try {
                    this.checksumBotAlias(params.botName, ID).then(cksum => {
                        params.checksum = cksum;
                        this.latestBotVersion(params.botName).then(version => {
                            params.botVersion = version;
                            console.log("BotAlias parameters for update are: " + JSON.stringify(params,null,2));
                            run(self.update_method, params)
                                .then(msg => reply(null, msg.name, null))
                                .catch(error => { console.log('caught', error); reply(error);})
                                .error(reply).catch(reply)
                        }).catch(error => { console.log('caught', error); reply(error);})
                    }).catch(error => { console.log('caught', error); reply(error);})
                } catch (err) {
                    console.log("Exception detected: " + err);
                    reply(null, ID);
                }
            } else {
                console.log("Parameters for update: " + JSON.stringify(params,null,2));
                try {
                    run(self.update_method, params)
                        .then(msg => reply(null, msg.name, null))
                        .catch(error => { console.log('caught', error); reply(error);})
                        .error(reply).catch(reply)
                } catch (err) {
                    console.log("Exception detected: " + err);
                    reply(null, ID);
                }
            }
        }else{
            reply(null,ID)
        }
    }
    
    Delete(ID,params,reply){
        var arg={name:ID}

        if(this.type==="BotAlias") arg.botName=params.botName
        
        return run(this.delete_method,arg)
        .then(msg=>reply(null,msg.name,null))
        .catch(function(error){
            console.log(error)
            if(error.indexOf("NotFoundException")!==-1){
                reply(null,ID,null)
            }else{
                reply(error)
            }
        })
    }
 }

 module.exports=Lex
