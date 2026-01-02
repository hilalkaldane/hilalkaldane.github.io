import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ReactGA from 'react-ga4'
import { AnalyticsTracker } from "./AnalyticsTracker";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration.js";

serviceWorkerRegistration.register();


{ process.env.REACT_APP_ENABLE_GA === "true" && ReactGA.initialize(REACT_APP_GA_MEASUREMENT_ID,
{
  send_page_view: false,
})}
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
    <AnalyticsTracker/>
      <div className="app-safe">
        <App />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);