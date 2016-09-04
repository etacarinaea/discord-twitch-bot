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


function leadingZero(d){
    if(d < 10){
        return "0" + d;
    }else{
        return d;
    }
}

function print(msg, err){
    var date = new Date();
    var h = leadingZero(date.getHours());
    var m = leadingZero(date.getMinutes());
    var s = leadingZero(date.getSeconds());

    console.log("[" + h + ":" + m + ":" + s + "]", msg);
    if(err){
        console.log(err);
    }
}

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
        print(err);
    }
    if(opt.save){
        print("Saving channels to " + path + " before exiting");
        fs.writeFileSync(path, JSON.stringify(twitchChannels));
        print("done");
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
        print("An error occured while sending a message:", err);
    }else{
        print("Sent message: " + msg);
    }
}

function callApi(twitchName, callback){
    var opt = {
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
            var json;
            try{
                json = JSON.parse(body);
            }
            catch(err){
                print(err);
                return;
            }
            if(json.status == 404){
                callback(undefined);
            }else{
                callback(json);
            }
        });

    }).on("error", (err)=>{
        print(err);
    });
}


function tick(){
    for(let i = 0; i < twitchChannels.length; i++){
        for(let a = -1; a < discordChannels.length; a++){
            if(twitchChannels[i]){
                callApi(twitchChannels[i].name, (res)=>{
                    var index;
                    if(res && !twitchChannels[i].online && res.stream){
                        try{
                            var channel, defaultChannel;
                            if(discordChannels.length === 0){
                                defaultChannel = bot.channels[0];
                            }else if(a >= -1){
                                channel = bot.channels.get("name", discordChannels[a]);
                            }
                            var msg = res.stream.channel.display_name +
                                      " has started streaming " +
                                      res.stream.game + "\n" +
                                      res.stream.channel.url;
                            if(channel){
                                bot.sendMessage(channel, msg, sendMessageCallback);
                            }else if(defaultChannel){
                                bot.sendMessage(defaultChannel, msg, sendMessageCallback);

                            }
                            twitchChannels[i].online = true;
                        }
                        catch(err){
                            print(err);
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
        var streamer, permission;
        try{
            var role = message.server.roles.get("name", privileged);
            permission = message.author.hasRole(role);
        }
        catch(err){
            print(privileged + " is not a role on the server", err);
        }
        var index;
        if(message.content.substring(1,7) == "remove"){
            if(permission){
                streamer = message.content.slice(7).trim();
                index = indexOfObjectName(twitchChannels, streamer);
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
                index = indexOfObjectName(twitchChannels, streamer);
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
        print("An error occured while loging in:", err);
    }else{
        print("Logged in with token " + token);
        print("Reading file " + path);
        var file = fs.readFileSync(path, {encoding:"utf-8"});
        twitchChannels = JSON.parse(file);
    }
});

