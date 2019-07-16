# Get Folder Matrix Bot

A very simple matrix bot that sends you a folder as a zip file. Simply start a chat with the bot and type `get`.

First, you have to add a `config.json` which should look similar to this:

``` json
{
    "token": "GxvY3UnI2LHAKMDAyZnNpZ25hdHVy...xlUVKc5C_nIJ9Z-jyq",
    "userId": "@send-my-folder:matrix.org",
    "baseUrl": "https://matrix.org",
    "whitelist": [
        "@user0:matrix.org",
        "@user1:matrix.org"
    ],
    "dataDir": "/path/to/the/folder/to/send"
}
```

The bot will only start a chat with users that are on the whitelist.

Run the following to install and run the bot

```sh
# install dependencies
yarn
# run the bot
yarn start
```
