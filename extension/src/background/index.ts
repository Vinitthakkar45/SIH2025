// Background service worker for the extension
chrome.runtime.onInstalled.addListener(() => {
  console.log("INGRES AI ChatBot extension installed");
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.type === "GET_API_URL") {
    // Return the API URL - can be configured via storage
    chrome.storage.sync.get(["apiUrl"], (result) => {
      sendResponse({ apiUrl: result.apiUrl || "http://localhost:3001" });
    });
    return true; // Keep the message channel open for async response
  }
});

export {};
