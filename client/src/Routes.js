import React from "react";
import { BrowserRouter as Router, Route, Redirect } from "react-router-dom";
import Login from "./Pages/Login/index";
import ChatApp from "./Pages/ChatApp/index";


function AppRouter() {
  return (
    <Router>
      <Route path="/login" component={Login}  />
      <Route path="/chat" component={ChatApp} />
      <Route path="/" exact render={()=><Redirect to="/login" />} />
    </Router>
  );
}

// function PrivateRoute({ showIfLoggedIn, component:Component, redirecURL }) {
//     const profile = localStorage.getItem("profile");
//     const data = profile ? JSON.parse(profile) : {};
//     const loggedIn = Boolean(data.oauth_token);
//     console.log(loggedIn, showIfLoggedIn);
//     if (loggedIn) {
//       if (showIfLoggedIn) {
//           console.log(Component);
//         return <Route render={()=><Component />}  />;
//       } else {
//         return <Redirect to={redirecURL} />;
//       }
//     } else {
//       if (showIfLoggedIn) {
//         return <Redirect to={redirecURL} />;
//       } else {
//           return <Route render={()=><Component />} />;
//       }
//     }
// }

export default AppRouter;
