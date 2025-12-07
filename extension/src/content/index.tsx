import React from "react";
import ReactDOM from "react-dom/client";
import App from "../App";
import styles from "../styles/index.css?inline";

// Create container for the chatbot widget
function initChatbot() {
  // Check if already initialized
  if (document.getElementById("ingres-chatbot-root")) {
    return;
  }

  // Create shadow DOM container for style isolation
  const container = document.createElement("div");
  container.id = "ingres-chatbot-container";
  document.body.appendChild(container);

  // Create shadow root for style isolation
  const shadowRoot = container.attachShadow({ mode: "open" });

  // Create root element inside shadow DOM
  const root = document.createElement("div");
  root.id = "ingres-chatbot-root";
  shadowRoot.appendChild(root);

  // Inject styles into shadow DOM using inline styles
  const styleEl = document.createElement("style");
  styleEl.textContent = styles;
  shadowRoot.insertBefore(styleEl, root);

  // Render React app
  const reactRoot = ReactDOM.createRoot(root);
  reactRoot.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );

  console.log("🌊 INGRES AI ChatBot initialized");
}

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initChatbot);
} else {
  initChatbot();
}
