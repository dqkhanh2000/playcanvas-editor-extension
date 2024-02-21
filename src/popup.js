"use strict";

import "./popup.css";

(function () {

    document.addEventListener("DOMContentLoaded", function () {

        const findButton = document.getElementById("find-button");
        const exportJsonButton = document.getElementById("export-json-button");
        const exportClipboardButton = document.getElementById(
            "export-clipboard-button"
        );

        findButton.addEventListener("click", findEntities);
        exportJsonButton.addEventListener("click", exportEntitiesToJson);
        exportClipboardButton.addEventListener("click", writeToClipboard);

        // Attach event listener to handle changing the input field based on the selected method
        document
            .getElementById("find-method")
            .addEventListener("change", handleMethodChange);
        // Call it once to set the initial state
        handleMethodChange();
    });

    function handleMethodChange() {
        const findMethod = document.getElementById("find-method").value;
        const inputContainer = document.getElementById("input-container");
        inputContainer.style.display = "block";

        // Hide all input containers
        document.getElementById("tag-input").style.display = "none";
        document.getElementById("name-input").style.display = "none";
        document.getElementById("regex-input").style.display = "none";

        // Show the relevant input container based on the selected method
        switch (findMethod) {
            case "tag":
                document.getElementById("tag-input").style.display = "block";
                break;
            case "name":
                document.getElementById("name-input").style.display = "block";
                break;
            case "regex":
                document.getElementById("regex-input").style.display = "block";
                break;
            default:
                console.error("Invalid find method");
                return;
        }
    }

    function findEntities() {
      const method = document.getElementById('find-method').value;
      const value = document.getElementById('search-input').value;
    
      sendMessage('FIND_ENTITY', { method, value }, updateSelectedCount);
    }

    function exportEntitiesToJson() {
        let exportType = document.getElementById("export-type").value;
        sendMessage("EXPORT_ENTITIES", { downloadFile : true, exportType }, response => {
            console.log(response);
        });
    }

    function writeToClipboard() {
      let exportType = document.getElementById("export-type").value;
        sendMessage("EXPORT_ENTITIES", { downloadFile : false, exportType }, response => {
            console.log(response);
        });
    }

    function updateSelectedCount(count) {
      document.getElementById('count').innerText = count;
    }

    function sendMessage(type, payload, callback) {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        const tab = tabs[0];

        chrome.tabs.sendMessage(
          tab.id,
          {
            type,
            payload,
          },
          response => {
            callback(response);
          }
        );
      });
    }
})();
