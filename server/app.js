const express = require("express");
const path = require("path");
const logger = require("morgan");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const request = require("request");
const qs = require("querystring");
const Datastore = require("nedb");
const github = require("octonode");
const _ = require("lodash");
const dotenv = require("dotenv").config();
var pubnub = require("pubnub");

const app = express();
app.use(express.static(path.join(__dirname, "build")));

// view engine setup

app.use(logger("dev"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

app.use(cors());

// channels name
const USER_PRESENCE_CHANNELS = ["user_presence-pnpres"];
const PRIVATE_CHAT_PRIFIX = "private6.";

/*
 |--------------------------------------------------------------------------
 | Setting up the DB
 |--------------------------------------------------------------------------
*/

db = {};
db.users = new Datastore({ filename: "db/users.db", autoload: true });

/*
 |--------------------------------------------------------------------------
 | Setting up PubNub
 |--------------------------------------------------------------------------
*/

console.log("------------ Initing PubNub ----------------");
pubnub = pubnub.init({
  subscribe_key: process.env.PUBNUB_SUBSCRIBE_KEY,
  publish_key: process.env.PUBNUB_PUBLISH_KEY,
  secret_key: process.env.PUBNUB_SECRET_KEY,
  auth_key: process.env.SERVER_PUBNUB_AUTH_KEY,
  ssl: true,
  error: function(err) {
    console.log(err);
  }
});

// Grant to the SERVER_AUTH_KEY the manage permission in order to beeing able to add/remove channels to any channel group.
console.log(
  "------------ Granting channel group manage permission to the server ----------------"
);
pubnub.grant({
  channel_group: ":", // The wildcard ':' will grant access to any channel group
  auth_key: process.env.SERVER_PUBNUB_AUTH_KEY,
  manage: true,
  read: true,
  write: true,
  ttl: 0,
  callback: function(res) {
    console.log(res);
  },
  error: function(err) {
    console.log(err);
  }
});

/*
 |--------------------------------------------------------------------------
 | Authentication required middleware
 |--------------------------------------------------------------------------
 */

function ensureAuthenticated(req, res, next) {
  if (!req.header("Authorization")) {
    return res.status(401).send({
      message: "Please make sure your request has an Authorization header"
    });
  }
  const token = req.header("Authorization").split(" ")[1];
  // Check if the OAUTH2 token has been previously authorized

  db.users.find({ oauth_token: token }, function(err, users) {
    // Unauthorized
    if (_.isEmpty(users)) {
      return res.status(401).send({ message: "Unauthorized" });
    }
    // Authorized
    else {
      // Adding user information to the request
      req.user = users[0];
      next();
    }
  });
}

/*
 |--------------------------------------------------------------------------
 | Login with GitHub
 |--------------------------------------------------------------------------
*/

app.post("/auth/github", function(req, res) {
  const accessTokenUrl = process.env.GITHUB_ACCESS_TOKEN_REQUEST_URL;
  const params = {
    code: req.body.code,
    client_id: process.env.GITHUB_CLIENT_ID,
    client_secret: process.env.GITHUB_CLIENT_SECRET,
    redirect_uri: req.body.redirectUri
  };

  // Exchange authorization code for access token.
  request.post({ url: accessTokenUrl, qs: params }, function(
    err,
    response,
    token
  ) {
    const access_token = qs.parse(token).access_token;
    const github_client = github.client(access_token);

    // Retrieve profile information about the current user.
    github_client.me().info(function(err, profile) {
      if (err) {
        return res.status(400).send({ message: "User not found" });
      }
      const github_id = profile["id"];
      const user = {
        _id: github_id,
        oauth_token: access_token,
        name: profile.name || profile.login,
        email: profile.email,
        avatar_url: profile.avatar_url
      };
      db.users.find({ _id: github_id }, function(err, docs) {
        // The user doesn't have an account already
        if (_.isEmpty(docs)) {
          // Create the user
          db.users.insert(user);
        }
        // Update the oauth2 token
        else {
          db.users.update(
            { _id: github_id },
            {
              oauth_token: access_token,
              name: profile.name || profile.login,
              email: profile.email,
              avatar_url: profile.avatar_url
            }
          );
        }
      });
      grantAccess(user)
        .then(function() {
          res.send(user);
        })
        .catch(function() {
          res.status(500).send();
        });
    });
  });
});

/*
 |--------------------------------------------------------------------------
 | Grant access to an oauth token
 |--------------------------------------------------------------------------
*/

const grantAccess = function(currentUser) {
  return new Promise((resolve, reject) => {
    db.users.find({}, function(err, allUsers) {
      if (err) {
        return reject();
      }
      const list = allUsers.filter(user => user._id !== currentUser._id);
      if (list.length) {
        const channels1 = list.map(user => {
          const ids = [user._id, currentUser._id].sort((a, b) => a - b);
          return PRIVATE_CHAT_PRIFIX + ids.join(":") + "-pnpres";
        });
        const channels2 = list.map(user => {
          const ids = [user._id, currentUser._id].sort((a, b) => a - b);
          return PRIVATE_CHAT_PRIFIX + ids.join(":");
        });
        pubnub.grant(
          {
            // channel_group : [PRIVATE_GROUP],
            channels: [...USER_PRESENCE_CHANNELS, ...channels1, ...channels2],
            authKeys: [currentUser.oauth_token],
            read: true,
            write: true,
            ttl: 0
          },
          function(status) {
            if (status.error) {
              return reject();
            }
            resolve();
          }
        );
      } else {
        return resolve();
      }
    });
  });
};

/*
 |--------------------------------------------------------------------------
 | Revoke access to an oauth token
 |--------------------------------------------------------------------------
*/

const revokeAccess = function(currentUser) {
  return new Promise((resolve, reject) => {
    db.users.find({}, function(err, allUsers) {
      if (err) {
        return reject();
      }
      const list = allUsers.filter(user => user._id !== currentUser._id);
      if (list.length) {
        const channels1 = list.map(user => {
          const ids = [user._id, currentUser._id].sort((a, b) => a - b);
          return PRIVATE_CHAT_PRIFIX + ids.join(":") + "-pnpres";
        });
        const channels2 = list.map(user => {
          const ids = [user._id, currentUser._id].sort((a, b) => a - b);
          return PRIVATE_CHAT_PRIFIX + ids.join(":");
        });
        pubnub.grant(
          {
            // channel_group : [PRIVATE_GROUP],
            channels: [...USER_PRESENCE_CHANNELS, ...channels1, ...channels2],
            authKeys: [currentUser.oauth_token],
            read: false,
            write: false,
            ttl: 0
          },
          function(status) {
            if (status.error) {
               return reject();
            }
            resolve();
          }
        );
      } else {
        return resolve();
      }
    });
  });
};

/*
 |--------------------------------------------------------------------------
 | GET /api/friends
 |--------------------------------------------------------------------------
*/

app.get("/api/users", ensureAuthenticated, function(req, res) {
  db.users.find({}, function(err, allUsers) {
    if (err) {
      res.status(500).send();
    }
    const list = allUsers
      .map(user => ({
        _id: user._id,
        name: user.name,
        avatar_url: user.avatar_url
      }))
      .filter(user => user._id !== req.user._id);
    res.send(list);
  });
});

/*
 |--------------------------------------------------------------------------
 | Logout
 |--------------------------------------------------------------------------
*/

app.post("/logout", ensureAuthenticated, function(req, res) {
  // Revoke access to the Access token
  // https://developer.github.com/v3/oauth_authorizations/#reset-an-authorization
  // POST /applications/:client_id/tokens/:access_token
  const resetTokenUrl =
    "https://api.github.com/applications/" +
    process.env.GITHUB_CLIENT_ID +
    "/tokens/" +
    req.user.oauth_token;
  const authorization = new Buffer(
    process.env.GITHUB_CLIENT_ID + ":" + process.env.GITHUB_CLIENT_SECRET
  ).toString("base64");

  const headers = {
    Authorization: "Basic " + authorization,
    "User-Agent": "NodeJS"
  };

  // Revoke access to the token
  request.post({ url: resetTokenUrl, headers: headers }, function(
    err,
    response,
    payload
  ) {
    if (!err && response.statusCode == 200) {
      revokeAccess(req.user)
        .then(function() {
          db.users.update(
            { oauth_token: req.user.oauth_token },
            { oauth_token: null },
            ()=>{
              res.status(200).send();
            }
          );
        })
        .catch(function() {
          res.status(500).send();
        });
    } else {
      res.status(500).send();
    }
  });
});

/*
   |--------------------------------------------------------------------------
   | Serve React Build
   |--------------------------------------------------------------------------
  */

// app.get("*", (req, res) => {
//   res.sendFile(path.join(__dirname, "build", "index.html"));
// });

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  const err = new Error("Not Found");
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get("env") === "development") {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500).send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500).send({
    message: err.message,
    error: {}
  });
});

module.exports = app;
