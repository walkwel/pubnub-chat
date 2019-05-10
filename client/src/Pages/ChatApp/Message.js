import React from "react";
import moment from "moment";


const Message = ({ data , profile, friends}) => {
        if (data.message.userId === profile._id) {
          return (
            <li className="clearfix" key={data.timetoken}>
              <div className="message-data align-right">
                <span className="message-data-time">{moment(data.message.timestamp).fromNow()}</span>
                &nbsp; &nbsp;
                <span className="message-data-name">
                  {profile.name || "Test"}
                </span>
                <i className="fa fa-circle me" />
              </div>
              <div className="message other-message float-right">
                {data.message.text}
              </div>
            </li>
          );
        } else {
          const friend =
            friends.find(f => f._id === data.message.userId) || {};
          return (
            <li key={data.timetoken}>
              <div className="message-data">
                <span className="message-data-name">
                  <i
                    className={
                      "fa fa-circle " + (friend.isActive ? "online" : "offline")
                    }
                  />
                  {friend.name || "Test"}
                </span>
                <span className="message-data-time">{moment(data.message.timestamp).fromNow()}</span>
              </div>
              <div className="message my-message">{data.message.text}</div>
            </li>
          );
        }
};

export default Message;
