import React from "react";

const MyProfile = ({ profile }) => {
  return (
    <div className="chat-header clearfix">
      <img src={profile.avatar_url} alt={profile.name} width="55" height="55" />
      <div className="chat-about">
        <div
          className="chat-with"
          style={{
            fontSize: "18px",
            paddingLeft: "68px",
            paddingTop: "7px"
          }}
        >
          {profile.name || "Test"}
        </div>
        <div className="chat-num-messages" />
      </div>
    </div>
  );
};

export default MyProfile;
