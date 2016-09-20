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

/*
var log = fs.createWriteStream(__dirname + "/" + Date.now() + ".log", {flags: "a"});

process.stdout.pipe(log);
process.stderr.pipe(log);
*/


function leadingZero(d){
    if(d < 10){
        return "0" + d;
    }else{
        return d;
    }
}

// adds a timestamp before msg/err
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
process.on("SIGTERM", exitHandler.bind(null, {exit:true}));
process.on("uncaughtException", exitHandler.bind(null, {exit:true}));


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
                                defaultChannel = bot.channels.first();
                            }else if(a >= -1){
                                channel = bot.channels.find("name", discordChannels[a]);
                            }
                            var msg = res.stream.channel.display_name +
                                      " has started streaming " +
                                      res.stream.game + "\n" +
                                      res.stream.channel.url;
                            if(channel){
                                channel.sendMessage(msg).then(print("Sent message: " + msg.content));
                            }else if(defaultChannel){
                                defaultChannel.sendMessage(msg).then(print("Sent message: " + msg.content));

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
        var permission;
        try{
            permission = message.member.roles.exists("name", privileged);
        }
        catch(err){
            print(privileged + " is not a role on the server", err);
        }
        var index, streamer;
        if(message.content.substring(1,7) == "remove"){
            if(permission){
                streamer = message.content.slice(7).trim();
                index = indexOfObjectName(twitchChannels, streamer);
                if(index != -1){
                    twitchChannels.splice(index, 1);
                    index = indexOfObjectName(twitchChannels, streamer);
                    if(index == -1){
                        message.reply("Removed " + streamer + ".");
                    }else{
                        message.reply(streamer + " isn't in the list.");
                    }
                }else{
                    message.reply(streamer + " isn't in the list.");
                }
            }else{
                message.reply("you're lacking the role _" + privileged + "_.");
            }
        }else if(message.content.substring(1,4) == "add"){
            if(permission){
                streamer = message.content.slice(4).trim();
                index = indexOfObjectName(twitchChannels, streamer);
                callApi(streamer, (res)=>{
                    if(index != -1){
                        message.reply(streamer + " is already in the list.");
                    }else if(res){
                        twitchChannels.push({name:streamer, online:false});
                        message.reply("Added " + streamer + ".");
                        tick();
                    }else{
                        message.reply(streamer + " doesn't seem to exist.");
                    }
                });
            }else{
                message.reply("you're lacking the role _" + privileged + "_.");
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
                message.reply("The list is empty.");
            }else{
                message.reply(msg);
            }
        }else{
            message.reply("Usage:\n" + prefix +
                               "(list|(add|remove) (channel name))");
        }
    }
});


bot.login(token).then((token)=>{
    if(token){
        print("Logged in with token " + token);
        print("Reading file " + path);
        var file = fs.readFileSync(path, {encoding:"utf-8"});
        twitchChannels = JSON.parse(file);
    }else{
        print("An error occured while loging in:", err);
    }
});

