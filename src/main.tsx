import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./app/App";
import "./styles/globals.css";

// Apply the persisted theme before first paint so tokens, the device shell,
// and the shader all boot in the right mode (no light-mode flash).
document.documentElement.dataset.theme =
  localStorage.getItem("aidfinder:theme") === "dark" ? "dark" : "light";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
