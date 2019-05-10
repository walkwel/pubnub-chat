import React from "react";


const FriendsList = ({selectedFriend, friends, updateChannel}) => {
  return (
    <ul className="list">
      {friends.map(friend => {
        return (
          <li
            className={
              "clearfix" + (friend._id === selectedFriend._id ? " active" : "")
            }
            key={friend._id}
            onClick={() => updateChannel(friend.channel)}
          >
            <img
              src={friend.avatar_url}
              alt={friend.name}
              width="55"
              height="55"
            />
            <div className="about">
              <div className="name">{friend.name || "Test"}</div>
              <div className="status">
                <i
                  className={
                    "fa fa-circle " + (friend.isActive ? "online" : "offline")
                  }
                />
                {friend.isActive ? "online" : "offline"}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default FriendsList;
