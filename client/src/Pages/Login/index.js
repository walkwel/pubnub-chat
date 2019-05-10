import React, { Component } from "react";
import { Redirect } from "react-router-dom";
import { NotificationManager } from 'react-notifications';

import GitHubLogin from "react-github-login";
import Service from "../Service";
import config from "../../config";
import "./index.css";

export default class extends Component {
  state = {
    isLoggedIn: false,
    loading: true
  };
  onSuccess = ({ code }) => {
    this.setState({ loading: true });
    Service.loginViaGitHub(code)
    .then(data => {
      this.setState({ isLoggedIn: true });
      NotificationManager.success("Successfully logged in.");
    })
    .catch(()=>{
      this.setState({ loading: false });
      NotificationManager.error("Error");
    })
  };
  onFailure = (error) => {
    this.setState({ loading: false });
    NotificationManager.error("Error");
  };
  componentWillMount() {
    this.setState({ loading: false });
    if (Service.isLoggedIn()) {
      this.setState({ isLoggedIn: true });
    }
  }

  render() {
    if (this.state.isLoggedIn) {
      return <Redirect to="/chat" />;
    }
    return (
      <div className="login">
        <div className="form">
          <img
            alt="logo"
            src="https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
            width="50"
          />
          {this.state.loading ? (
            <button>Loading...</button>
          ) : (
            <GitHubLogin
              clientId={config.GITHUB_CLIENT_ID}
              redirectUri={config.GITHUB_REDIRECT_URI}
              onRequest={console.log}
              onSuccess={this.onSuccess}
              onFailure={this.onFailure}
              scope={"read:user"}
            />
          )}
        </div>
      </div>
    );
  }
}
