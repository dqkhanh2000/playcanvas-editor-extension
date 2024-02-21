'use strict';

// With background scripts you can communicate with popup
// and contentScript files.
// For more information on background script,
// See https://developer.chrome.com/extensions/background_pages

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if(request.type === "FIND_ENTITIES") {
    console.log(`Received message to find entities with method: ${request.payload.findMethod} and query: ${request.payload.queryValue}`);
    sendResponse({ message: "Received message to find entities" });
  }
});
