import React from "react";

const ChatHeader = ({ selectedFriend, handleLogout }) => {
  return (
    <div className="chat-header clearfix">
      <img
        src={selectedFriend.avatar_url}
        alt={selectedFriend.name}
        width="55"
        height="55"
      />
      <div className="chat-about">
        <div className="chat-with">{selectedFriend.name || "Test"}</div>
        <div className="chat-num-messages" />
      </div>
      <button  onClick={handleLogout} className="logout">
        <i className="fa fa-power-off" />
        {"  "}Logout
      </button>
    </div>
  );
};

export default ChatHeader;
