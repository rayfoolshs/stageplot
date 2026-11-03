import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { PrintPage } from "./print/PrintPage";
import { AuthPage } from "./auth/AuthPage";
import { MyRidersPage } from "./riders/MyRidersPage";
import "./index.css";

const container = document.getElementById("root");
if (!container) throw new Error("Root element #root not found");

// A tiny path switch instead of a router: the editor is the app, /print is a
// standalone read-only view (also loaded headlessly by the PDF renderer), and
// /login and /register are the account screens.
const path = window.location.pathname.replace(/\/+$/, "");

let page = <App />;
if (path === "/print") page = <PrintPage />;
else if (path === "/login") page = <AuthPage mode="login" />;
else if (path === "/register") page = <AuthPage mode="register" />;
else if (path === "/riders") page = <MyRidersPage />;
else {
  const rider = /^\/r\/([\w-]+)$/.exec(path);
  if (rider) page = <App riderId={rider[1]} />;
}

createRoot(container).render(<React.StrictMode>{page}</React.StrictMode>);
