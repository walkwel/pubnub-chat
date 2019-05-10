import config from "../config";

function getUrl(path){
  return `${config.SERVER_URL}${path}`
}

function isLoggedIn() {
  return Boolean(getToken());
}

function getToken() {
  const profile = getProfile();
  return profile.oauth_token;
}

function getProfile() {
  const profile = localStorage.getItem("profile");
  return profile ? JSON.parse(profile) : {};
}

function setProfile(profile = {}) {
  localStorage.setItem("profile", JSON.stringify(profile));
}

function loginViaGitHub(code) {
  return fetch(getUrl("/auth/github"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ code })
  })
    .then(response => response.json())
    .then(data => {
      setProfile(data);
      return data;
    });
}

function getUserList() {
  return fetch(getUrl("/api/users"), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: "TOKEN " + getToken()
    }
  }).then(response => response.json());
}

function logout() {
  const token =  getToken();
  localStorage.clear();
  return fetch(getUrl("/logout"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "TOKEN " + token
    }
  })
}

export default {
  isLoggedIn,
  getToken,
  getProfile,
  setProfile,
  loginViaGitHub,
  getUserList,
  logout
};
