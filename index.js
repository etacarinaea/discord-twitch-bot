/* jshint esversion: 6 */
// args = string:token, int:interval, string:role strings:discordChannels
const https = require("https"),
      fs = require("fs"),
      Discord = require("discord.js"),
      bot = new Discord.Client(),
      args = process.argv.slice(2),
      path = __dirname + "/.channels",
      token = args[0],
      interval = args[1] * 1000,
      privileged = args[2],
      discordChannels = args.slice(3),
      apiUrl = "https://api.twitch.tv/kraken",
      prefix = "/";
var twitchChannels = [];



function indexOfObjectName(array, value){
    for(let i = 0; i < array.length; i++){
        if(array[i].name.toLowerCase().trim() === value.toLowerCase().trim()){
            return i;
        }
    }
    return -1;
}


function exitHandler(opt, err){
    if(err){
        console.log(err);
    }
    if(opt.save){
        console.log("Saving channels to " + path + " before exiting");
        fs.writeFileSync(path, JSON.stringify(twitchChannels));
        console.log("done");
    }
    if(opt.exit){
        process.exit();
    }
}

process.on("exit", exitHandler.bind(null, {save:true}));
process.on("SIGINT", exitHandler.bind(null, {exit:true}));
process.on("uncaughtException", exitHandler.bind(null, {exit:true}));


function sendMessageCallback(err, msg){
    if(err){
        console.log("An error occured while sending a message: " + err);
    }else{
        console.log("Sent message: " + msg);
    }
}

function callApi(twitchName, callback){
    var opt = {
        //url: apiUrl + "/streams/" + twitchChannelName,
        host: "api.twitch.tv",
        path: "/kraken/streams/" + twitchName.trim(),
        headers: {
            Accept: "application/vnd.twitchtv.v3+json"
        }
    };

    https.get(opt, (res)=>{
        var body = "";

        res.on("data", (chunk)=>{
            body += chunk;
        });

        res.on("end", ()=>{
            var json = JSON.parse(body);
            if(json.status == 404){
                callback(undefined);
            }else{
                callback(json);
            }
        });

    }).on("error", (err)=>{
        console.log(err);
    });
}


function tick(){
    for(let i = 0; i < twitchChannels.length; i++){
        for(let a = 0; a < discordChannels.length; a++){
            if(twitchChannels[i]){
                callApi(twitchChannels[i].name, (res)=>{
                    var index;
                    if(res && !twitchChannels[i].online && res.stream !== null){
                        try{
                            twitchChannels[i].online = true;
                            var msg = res.stream.channel.display_name +
                                      " has started streaming " +
                                      res.stream.game + "\n" +
                                      res.stream.channel.url;
                            bot.sendMessage(bot.channels.get("name",
                                                             discordChannels[a]),
                                                             msg,
                                                             sendMessageCallback);
                        }
                        catch(err){
                            console.log(err);
                        }
                    }else if(res.stream === null){
                        twitchChannels[i].online = false;
                    }
                });
            }
        }
    }
}


setInterval(tick, interval);


bot.on("message", (message)=>{
    if(message.content[0] == prefix){
        var streamer;
        try{
            var role = message.server.roles.get("name", privileged);
            var permission = message.author.hasRole(role);
        }
        catch(err){
            console.log(privileged + " is not a role on the server");
            console.log(err);
        }
        if(message.content.substring(1,7) == "remove"){
            if(permission){
                streamer = message.content.slice(7).trim();
                var index = indexOfObjectName(twitchChannels, streamer);
                if(index != -1){
                    twitchChannels.splice(index, 1);
                    index = indexOfObjectName(twitchChannels, streamer);
                    if(index == -1){
                        bot.reply(message, "Removed " + streamer + ".");
                    }else{
                        bot.reply(message, streamer + " isn't in the list.");
                    }
                }else{
                    bot.reply(message, streamer + " isn't in the list.");
                }
            }else{
                bot.reply(message, "you're lacking the role _" + privileged + "_.");
            }
        }else if(message.content.substring(1,4) == "add"){
            if(permission){
                streamer = message.content.slice(4).trim();
                var index = indexOfObjectName(twitchChannels, streamer);
                callApi(streamer, (res)=>{
                    if(index != -1){
                        bot.reply(message, streamer + " is already in the list.");
                    }else if(res){
                        twitchChannels.push({name:streamer, online:false});
                        bot.reply(message, "Added " + streamer + ".");
                        tick();
                    }else{
                        bot.reply(message, streamer + " doesn't seem to exist.");
                    }
                });
            }else{
                bot.reply(message, "you're lacking the role _" + privileged + "_.");
            }
        }else if(message.content.substring(1,5) == "list"){
            var msg = "";
            for(let i = 0; i < twitchChannels.length; i++){
                var streamStatus;
                if(twitchChannels[i].online){
                    streamStatus = "online";
                }else{
                    streamStatus = "offline";
                }
                msg += twitchChannels[i].name + " " + streamStatus + "\n";
            }
            if(!msg){
                bot.reply(message, "The list is empty.");
            }else{
                bot.reply(message, msg);
            }
        }else{
            bot.reply(message, "Usage:\n" + prefix +
                               "(list|(add|remove) (channel name))");
        }
    }
});


bot.loginWithToken(token, (err, token)=>{
    if(err){
        console.log("An error occured while loging in: " + err);
    }else{
        console.log("Logged in with token " + token);
        console.log("Reading file " + path);
        var file = fs.readFileSync(path, {encoding:"utf-8"});
        twitchChannels = JSON.parse(file);
    }
});

