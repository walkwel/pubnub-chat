import React from "react";
import { Redirect } from "react-router-dom";
import PubNubReact from "pubnub-react";
import config from "../../config";

import Service from "../Service";
import FriendsList from "./FriendsList";
import Message from "./Message";
import ChatHeader from "./ChatHeader";
import MyProfile from "./MyProfile";
import { NotificationManager } from "react-notifications";

import "./index.css";

const USER_PRESENCE_CHANNEL = config.USER_PRESENCE_CHANNEL;
const PRIVATE_CHANNEL = config.PRIVATE_CHANNEL_PRIFIX;
// const PRIVATE_GROUP = "private-chat"

class ChatApp extends React.Component {
  constructor(props) {
    super(props);
    const profile = Service.getProfile();
    this.state = {
      textMsg: "",
      isLoggedIn: true,
      profile: profile,
      friends: [],
      selectedChannel: null
    };

    this.pubnub = new PubNubReact({
      publishKey: config.PUBNUB_PUBLISH_KEY,
      subscribeKey: config.PUBNUB_SUBSCRIBE_KEY,
      authKey: profile.oauth_token,
      uuid: profile._id,
      ssl: true,
      heartbeat: 40,
      heartbeat_interval: 60
    });
    this.pubnub.init(this);
  }

  componentWillMount() {
    if (!Service.isLoggedIn()) {
      this.setState({ isLoggedIn: false });
    } else {
      this.subscribedForOnlineStatus();
      this.fetchUsers();
      this.setPubNubState(true);
      this.pubnub.addListener({
        status: st => {
          if (st.category === "PNUnknownCategory") {
            NotificationManager.error("UnKnownError");
          }
        },
        message: message => {
          if (message.channel === this.state.selectedChannel) {
            this.scrollToBottom();
          } else {
            const friend = this.getFriendById(message.message.userId);
            if (friend) {
              NotificationManager.info(`New message from '${friend.name}`);
            }
          }
        }
      });
    }
  }
  subscribedForOnlineStatus = () => {
    this.pubnub.setUUID(this.state.profile._id);
    this.pubnub.subscribe({
      // channel_group : PRIVATE_GROUP,
      channels: [USER_PRESENCE_CHANNEL],
      withPresence: true,
      triggerEvents: true,
      authKey: this.state.profile.oauth_token,
      autoload: 100,
      uuid: this.state.profile._id
    });
  };
  setPubNubState = isActive => {
    this.pubnub.setState(
      {
        uuid: this.state.profile._id,
        channels: [USER_PRESENCE_CHANNEL],
        state: {
          active: isActive
        }
      },
      function(status, response) {
        // handle status, response
      }
    );
  };
  fetchUsers = () => {
    Service.getUserList()
      .then(users => {
        if (users.message === "Unauthorized") {
          this.handleLogout();
        }
        const currentUser = this.state.profile;
        const friends = (users || []).map(user => {
          const ids = [user._id, currentUser._id].sort((a, b) => a - b);
          user.channel = PRIVATE_CHANNEL + ids.join(":");
          return user;
        });
        this.setState({ friends });
        this.subscribedToAllChannels(friends);
        this.checkOnlineUser();
      })
      .catch(err => {
        console.log(err);
      });
  };

  subscribedToAllChannels = friends => {
    const channels = friends.map(f => f.channel);
    this.pubnub.subscribe(
      {
        // channel_group : PRIVATE_GROUP,
        channels: channels,
        withPresence: true,
        triggerEvents: true,
        autoload: 100,
        uuid: this.state.profile._id
      },
      status => {
        // console.log(status);
      }
    );
    this.updateChannel(channels[0]);
  };

  updateFriendStatus = (_id, isActive, timestamp) => {
    this.setState(state => ({
      friends: state.friends.map(f => {
        if (String(f._id) === String(_id)) {
          f.isActive = isActive;
          f.timestamp = timestamp;
        }
        return f;
      })
    }));
  };

  getFriendById = id => {
    return this.state.friends.find(f => String(f._id) === String(id));
  };
  getFriendByChannel = channel => {
    return this.state.friends.find(f => f.channel === channel);
  };
  showNotification = (frinedId, isActive) => {
    const friend = this.getFriendById(frinedId);
    if (friend) {
      if (isActive) {
        NotificationManager.success(`${friend.name} is online.`);
      } else {
        NotificationManager.info(`${friend.name} is offline.`);
      }
    }
  };

  checkOnlineUser = () => {
    this.pubnub.getPresence(USER_PRESENCE_CHANNEL, presence => {
      switch (presence.action) {
        case "join": {
          this.updateFriendStatus(presence.uuid, true, presence.timestamp);
          this.showNotification(presence.uuid, true);
          break;
        }
        case "leave": {
          this.updateFriendStatus(presence.uuid, false, presence.timestamp);
          this.showNotification(presence.uuid, false);
          break;
        }
        default: {
        }
      }
    });
    this.pubnub.hereNow(
      {
        channels: [USER_PRESENCE_CHANNEL],
        includeUUIDs: true,
        includeState: true,
        state: true
      },
      (status, response) => {
        if (response && response.channels[USER_PRESENCE_CHANNEL]) {
          response.channels[USER_PRESENCE_CHANNEL].occupants.forEach(user => {
            // console.log(user);
            this.updateFriendStatus(user.uuid, true, Date.now());
          });
        }
      }
    );
  };
  handleMsgChange = e => {
    this.setState({ textMsg: e.target.value });
  };

  sendMessage = () => {
    const text = this.state.textMsg;
    if (!text) {
      return;
    }
    this.setState({ textMsg: "" });
    this.pubnub.publish({
      message: {
        text: text,
        timestamp: Date.now(),
        userId: this.state.profile._id
      },
      channel: this.state.selectedChannel,
      sendByPost: false, // true to send via POST
      storeInHistory: true //override default storage options
    });
  };

  updateChannel = channel => {
    this.setState({ selectedChannel: channel });
    setTimeout(() => {
      this.scrollToBottom();
    }, 500);
  };

  scrollToBottom = smoothScroll => {
    this.messagesEnd.scrollIntoView({
      behavior: smoothScroll ? "smooth" : "auto"
    });
  };
  handleLogout = () => {
    Service.logout();
    this.setState({ isLoggedIn: false });
  };
  componentWillUnmount() {
    const channels = this.state.friends.map(f => f.channel) || [];
    this.setPubNubState(false);
    this.pubnub.unsubscribe({
      channels: [USER_PRESENCE_CHANNEL, ...channels]
    });
    this.pubnub.removeListener(() => {});
  }
  render() {
    if (!this.state.isLoggedIn) {
      return <Redirect to="/login" />;
    }
    const messages = this.state.selectedChannel
      ? this.pubnub.getMessage(this.state.selectedChannel, 500)
      : [];
    const selectedFriend =
      this.getFriendByChannel(this.state.selectedChannel) || {};

    return (
      <div className="container clearfix">
        <div className="people-list" id="people-list">
          <div className="search">
            <MyProfile profile={this.state.profile} />
          </div>
          <FriendsList
            friends={this.state.friends}
            updateChannel={this.updateChannel}
            profile={this.state.profile}
            selectedFriend={selectedFriend}
          />
        </div>
        <div className="chat">
          <ChatHeader
            selectedFriend={selectedFriend}
            handleLogout={this.handleLogout}
          />
          <div className="chat-history">
            <ul>
              {messages.map(msg => (
                <Message
                  key={msg.timetoken}
                  friends={this.state.friends}
                  updateChannel={this.updateChannel}
                  profile={this.state.profile}
                  data={msg}
                />
              ))}
              <li
                style={{ visibility: "hideden", height: "0px" }}
                ref={el => {
                  this.messagesEnd = el;
                }}
              />
            </ul>
          </div>
          <div className="chat-message clearfix">
            <textarea
              name="message-to-send"
              id="message-to-send"
              placeholder="Type your message"
              rows={3}
              value={this.state.textMsg}
              onChange={this.handleMsgChange}
            />
            <i className="fa fa-file-o" /> &nbsp;&nbsp;&nbsp;
            <i className="fa fa-file-image-o" />
            <button onClick={this.sendMessage}>Send</button>
          </div>
        </div>
      </div>
    );
  }
}

export default ChatApp;
