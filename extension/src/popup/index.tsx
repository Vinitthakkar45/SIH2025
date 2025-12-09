import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { Droplet, ExternalLink, CheckCircle, AlertCircle, Settings, RefreshCw, Zap } from "lucide-react";
import "../styles/index.css";

const Popup: React.FC = () => {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [apiUrl, setApiUrl] = useState("http://localhost:3001");
  const [showSettings, setShowSettings] = useState(false);

  const checkConnection = async () => {
    setIsConnected(null);
    try {
      const response = await fetch(`${apiUrl}/api/health`);
      setIsConnected(response.ok);
    } catch {
      setIsConnected(false);
    }
  };

  useEffect(() => {
    // Load saved API URL
    chrome.storage.sync.get(["apiUrl"], (result) => {
      if (result.apiUrl) {
        setApiUrl(result.apiUrl);
      }
    });
    checkConnection();
  }, []);

  const saveApiUrl = () => {
    chrome.storage.sync.set({ apiUrl }, () => {
      checkConnection();
      setShowSettings(false);
    });
  };

  const openIngres = () => {
    chrome.tabs.create({ url: "https://ingres.iith.ac.in/home" });
  };

  return (
    <div className="ig-min-h-[400px] ig-bg-zinc-950">
      {/* Header */}
      <div className="ig-bg-zinc-900 ig-border-b ig-border-zinc-800 ig-p-4">
        <div className="ig-flex ig-items-center ig-gap-3">
          <div className="ig-w-10 ig-h-10 ig-rounded-lg ig-bg-blue-600 ig-flex ig-items-center ig-justify-center">
            <Droplet className="ig-w-5 ig-h-5 ig-text-white" />
          </div>
          <div>
            <h1 className="ig-font-bold ig-text-base ig-text-zinc-100">INGRES AI</h1>
            <p className="ig-text-xs ig-text-zinc-500">Groundwater Intelligence</p>
          </div>
        </div>
      </div>

      {/* Status Section */}
      <div className="ig-p-4">
        <div className="ig-bg-zinc-900 ig-rounded-xl ig-border ig-border-zinc-800 ig-p-4">
          <div className="ig-flex ig-items-center ig-justify-between ig-mb-3">
            <span className="ig-text-sm ig-font-medium ig-text-zinc-300">Backend Status</span>
            <button onClick={checkConnection} className="ig-p-1.5 ig-rounded-lg hover:ig-bg-zinc-800 ig-transition-colors" title="Refresh status">
              <RefreshCw className={`ig-w-4 ig-h-4 ig-text-zinc-500 ${isConnected === null ? "ig-animate-spin" : ""}`} />
            </button>
          </div>

          <div
            className={`ig-flex ig-items-center ig-gap-2 ig-p-3 ig-rounded-lg ${
              isConnected === null
                ? "ig-bg-zinc-800 ig-text-zinc-400"
                : isConnected
                ? "ig-bg-green-900/30 ig-text-green-400 ig-border ig-border-green-800/50"
                : "ig-bg-red-900/30 ig-text-red-400 ig-border ig-border-red-800/50"
            }`}>
            {isConnected === null ? (
              <>
                <div className="ig-w-4 ig-h-4 ig-rounded-full ig-bg-zinc-600 ig-animate-pulse" />
                <span className="ig-text-sm">Checking connection...</span>
              </>
            ) : isConnected ? (
              <>
                <CheckCircle className="ig-w-4 ig-h-4" />
                <span className="ig-text-sm ig-font-medium">Connected to API</span>
              </>
            ) : (
              <>
                <AlertCircle className="ig-w-4 ig-h-4" />
                <span className="ig-text-sm ig-font-medium">Unable to connect</span>
              </>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="ig-mt-4 ig-space-y-2">
          <button
            onClick={openIngres}
            className="ig-w-full ig-flex ig-items-center ig-justify-between ig-bg-zinc-900 ig-rounded-xl ig-border ig-border-zinc-800 ig-p-4 hover:ig-bg-zinc-800/70 ig-transition-colors">
            <div className="ig-flex ig-items-center ig-gap-3">
              <div className="ig-w-10 ig-h-10 ig-rounded-lg ig-bg-blue-600/20 ig-flex ig-items-center ig-justify-center">
                <Zap className="ig-w-5 ig-h-5 ig-text-blue-400" />
              </div>
              <div className="ig-text-left">
                <p className="ig-font-medium ig-text-zinc-100">Open INGRES Portal</p>
                <p className="ig-text-xs ig-text-zinc-500">Use the chatbot on the official site</p>
              </div>
            </div>
            <ExternalLink className="ig-w-4 ig-h-4 ig-text-zinc-500" />
          </button>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="ig-w-full ig-flex ig-items-center ig-justify-between ig-bg-zinc-900 ig-rounded-xl ig-border ig-border-zinc-800 ig-p-4 hover:ig-bg-zinc-800/70 ig-transition-colors">
            <div className="ig-flex ig-items-center ig-gap-3">
              <div className="ig-w-10 ig-h-10 ig-rounded-lg ig-bg-zinc-800 ig-flex ig-items-center ig-justify-center">
                <Settings className="ig-w-5 ig-h-5 ig-text-zinc-400" />
              </div>
              <div className="ig-text-left">
                <p className="ig-font-medium ig-text-zinc-100">Settings</p>
                <p className="ig-text-xs ig-text-zinc-500">Configure API endpoint</p>
              </div>
            </div>
            <svg
              className={`ig-w-4 ig-h-4 ig-text-zinc-500 ig-transition-transform ${showSettings ? "ig-rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Settings Panel */}
          {showSettings && (
            <div className="ig-bg-zinc-900 ig-rounded-xl ig-border ig-border-zinc-800 ig-p-4 ig-animate-fade-in">
              <label className="ig-block ig-text-sm ig-font-medium ig-text-zinc-300 ig-mb-2">API Base URL</label>
              <input
                type="text"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                className="ig-w-full ig-px-3 ig-py-2 ig-text-sm ig-bg-zinc-800 ig-border ig-border-zinc-700 ig-rounded-lg ig-text-zinc-100 ig-placeholder-zinc-500 focus:ig-ring-2 focus:ig-ring-blue-500 focus:ig-border-transparent ig-outline-none"
                placeholder="http://localhost:3001"
              />
              <button
                onClick={saveApiUrl}
                className="ig-w-full ig-mt-3 ig-py-2 ig-bg-blue-600 ig-text-white ig-text-sm ig-font-medium ig-rounded-lg hover:ig-bg-blue-700 ig-transition-colors">
                Save & Test Connection
              </button>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="ig-mt-4 ig-p-4 ig-bg-zinc-900/50 ig-rounded-xl ig-border ig-border-zinc-800">
          <p className="ig-text-xs ig-text-zinc-400 ig-leading-relaxed">
            <strong className="ig-text-zinc-300">How to use:</strong> Visit the INGRES portal (ingres.iith.ac.in) and look for the floating chat
            button in the bottom-right corner. Click it to start asking questions about India's groundwater resources.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="ig-p-4 ig-border-t ig-border-zinc-800">
        <p className="ig-text-xs ig-text-center ig-text-zinc-600">Developed for Ministry of Jal Shakti - CGWB</p>
      </div>
    </div>
  );
};

// Render popup
const root = document.getElementById("popup-root");
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  );
}
