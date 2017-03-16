# discord-twitch-bot

Uses [discord.js](https://github.com/hydrabolt/discord.js/) and
the [Twitch API](https://github.com/justintv/Twitch-API) to send a message
whenever a streamer goes online.

#### Configuration
Use `/configure` when first adding the bot to configure it for your discord
server.

#### Installation
`cd discord-twitch-bot`<br />
`npm install`

#### Usage
`node discord-twitch-bot TOKEN CLIENTID INTERVAL`

```
TOKEN           Discord app bot user token
CLIENTID        Twitch Client-ID
INTERVAL        Interval in seconds in which to check for updates
```

###### Token
To get a token you will need to create an app
[here](https://discordapp.com/developers/applications/me).

###### Client-ID
To get a Twitch client-ID you will need to register a new application [here](https://www.twitch.tv/settings/connections).

After that you can add the bot to your server by replacing `YOUR_CLIENT_ID` in
this URL with the client-ID of your discord app (*not* the Twitch client-ID):
`https://discordapp.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=0`
