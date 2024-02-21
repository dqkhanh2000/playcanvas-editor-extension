"use strict";
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  window.dispatchEvent(
      new CustomEvent(request.type, { detail: request.payload })
  );
  window.addEventListener(request.type + "_RESULT", function (e) {
    sendResponse(e.detail);
  });

  // Send an empty response
  // See https://github.com/mozilla/webextension-polyfill/issues/130#issuecomment-531531890
  return true;
});