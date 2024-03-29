import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import { CssVarsProvider } from "@mui/joy/styles";
import "material-icons/iconfont/material-icons.css";
import "@fontsource/public-sans";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <CssVarsProvider defaultMode="dark">
      <App />
    </CssVarsProvider>
  </React.StrictMode>
);
