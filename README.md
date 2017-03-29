# discord-twitch-bot

Uses [discord.js](https://github.com/hydrabolt/discord.js/) and the
[Twitch API](https://github.com/justintv/Twitch-API) to send a message whenever
a streamer goes online.


## Configuration

Use `/configure` (see below) to configure the bot for your discord server.


## Installation

`cd discord-twitch-bot`<br />
`npm install`


## Usage

`node discord-twitch-bot TOKEN CLIENTID INTERVAL`

```
TOKEN           Discord app bot user token
CLIENTID        Twitch Client-ID
INTERVAL        Interval in seconds in which to check for updates
```


### Chat commands

* `/configure OPTION [SUBOPTION] VALUE` - Configuration; Only the server owner
  can use this command.
  * list - List current config
  * prefix - Character to use in front of commands
  * role - Role permitting usage of add and remove
  * channel - Channel(s) to post in, empty list will use the first channel
    * add - Add a discord channel to the list
    * remove - Remove a discord channel from the list
* `/add VALUE` - Adds a Twitch channel. Can be used by users with role specified
  by `/configure role`.
* `/remove VALUE` - Removes a Twitch channel. Can be used by users with role
  specified by `/configure role`.
* `/list` - Lists all tracked Twitch channels and their online status.  Can be
  used by anyone.

The `/` is the default prefix for commands. If a different prefix was specified
on the server by `/configure prefix` that one will have to be used instead of
`/`.


## Token

To get a token you will need to create an app
[here](https://discordapp.com/developers/applications/me).


## Client-ID

To get a Twitch client-ID you will need to register a new application [here](https://www.twitch.tv/settings/connections).


After that you can add the bot to your server by replacing `YOUR_CLIENT_ID` in
this URL with the client-ID of your discord app (*not* the Twitch client-ID):
`https://discordapp.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot&permissions=0`
