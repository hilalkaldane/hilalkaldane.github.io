import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import ReactGA from 'react-ga4'


ReactGA.initialize('G-T6CZTM2KPY')
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <div className="app-safe">
        <App />
      </div>
    </HashRouter>
  </React.StrictMode>
);