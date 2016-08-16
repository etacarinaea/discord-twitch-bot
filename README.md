# discord-twitch-bot

Uses [discord.js](https://github.com/hydrabolt/discord.js/) and
the [Twitch API](https://github.com/justintv/Twitch-API) to send a message
whenever a streamer goes online.

#### Installation
`cd discord-twitch-bot`<br />
`npm install`

#### Usage
`node discord-twitch-bot {token} {interval} {role} {channels}`

Token is the Discord app bot user token.<br />
Interval is the interval in seconds in which to check
every streamers online status.<br />
Role is the role required to use add/remove.<br />
Channels is a space-separated list of *Discord* channels where<br />
the bot is supposed to send messages.

###### Token
To get a token you will need to create an app
[here](https://discordapp.com/developers/applications/me).

After that you can add the bot to your server by replacing `YOUR_CLIENT_ID` in
this URL with the client ID of your app:
```
https://discordapp.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=0
```
