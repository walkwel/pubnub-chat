## Pubnub Chat



### Obtaining OAuth Keys

- Visit [https://github.com/settings/profile](https://github.com/settings/profile)
- Select **OAuth applications** in the left panel
- Go to **Developer applications** tab, then click on the **Register new application** button
 - **Application name**: Your app name
 - **Homepage URL**: *http://localhost:3000* 
 - **Authorization callback URL**: *http://localhost:9000/login*
- Click on the **Register application** button
- Get your `Client ID` and `Client Secret`

### Obtaining PubNub Keys

- Visit [https://admin.pubnub.com/](https://admin.pubnub.com/) to login or create an account
- Click on the **New app** button and give it a name.
- Click on the **Create new keyset** button and give it a name
- Get your `Publish Key`, `Subscribe Key` and `Secret Key`


### Running the server

- Insert your PubNub keys, OAuth keys and server configuration in a `server/.env` file. <br />
There is an example in the `server/.sample.env` or below is how this file looks like:

```
PUBNUB_SUBSCRIBE_KEY=XXXXXXXXXXXXXXXXXXXXXXX
PUBNUB_PUBLISH_KEY=XXXXXXXXXXXXXXXXXXXXXXX
PUBNUB_SECRET_KEY=XXXXXXXXXXXXXXXXXXXXXXX
SERVER_PUBNUB_AUTH_KEY=my-secreat-key
GITHUB_CLIENT_ID=XXXXXXXXXXXXXXXXXXXXXXX
GITHUB_CLIENT_SECRET=XXXXXXXXXXXXXXXXXXXXXXX
```

- Execute the following commands in your terminal: 
```
  cd server
  npm install
  npm start
```


### Running the client

- Insert your PubNub keys, OAuth keys and server configuration in a `src/config.js` file. <br />
There is an example in the `client/sample.config.json` or below is how this file looks like:

```
{
	"PUBNUB_SUBSCRIBE_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
	"PUBNUB_PUBLISH_KEY": "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
	"GITHUB_CLIENT_ID": "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
	"GITHUB_REDIRECT_URI": "XXXXXXXXXXXXXXXXXXXXXXXXXXX",
	"SERVER_URL": "http://localhost:3000",

}
```
- Execute the following commands in your terminal: 
```
cd client
npm install
npm start
```

### Open the app in the browser
```
http://localhost:9000/login
```