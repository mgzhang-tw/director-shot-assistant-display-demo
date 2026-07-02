import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { GlassesApp } from "./GlassesApp";
import "./styles.css";
import "./sync.css";
import "./glasses-navigation.css";
import "./status-menu.css";

const isGlasses = window.location.pathname.startsWith("/glasses") || new URLSearchParams(window.location.search).get("mode") === "glasses";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isGlasses ? <GlassesApp /> : <App />}
  </StrictMode>,
);
