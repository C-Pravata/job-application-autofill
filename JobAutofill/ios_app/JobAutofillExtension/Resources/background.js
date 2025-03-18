// JobAutofill Safari Extension Background Script

// Store user data
let userData = null;

// Listen for messages from the app
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("JobAutofill Background: Received message", message);
    
    if (message.action === "setUserData") {
        // Store user data for autofill
        userData = message.userData;
        console.log("JobAutofill Background: User data updated", userData);
        sendResponse({ success: true });
        return true;
    }
    
    if (message.action === "getUserData") {
        // Return stored user data
        console.log("JobAutofill Background: Returning user data", userData);
        sendResponse({ userData: userData });
        return true;
    }
});

// Add toolbar button action
browser.browserAction.onClicked.addListener(async (tab) => {
    console.log("JobAutofill Background: Toolbar button clicked");
    
    if (!userData) {
        // No user data available
        console.log("JobAutofill Background: No user data available");
        
        // Show notification in the tab
        await browser.tabs.executeScript(tab.id, {
            code: `
                alert("No profile data available. Please complete your profile in the JobAutofill app first.");
            `
        });
        return;
    }
    
    // Send autofill message to content script
    console.log("JobAutofill Background: Sending autofill message to content script");
    browser.tabs.sendMessage(tab.id, {
        action: "autofill",
        userData: userData
    }).catch(error => {
        console.error("JobAutofill Background: Error sending message to content script", error);
        
        // Content script might not be loaded, inject it
        browser.tabs.executeScript(tab.id, {
            file: "content.js"
        }).then(() => {
            // Try sending the message again after script is injected
            setTimeout(() => {
                browser.tabs.sendMessage(tab.id, {
                    action: "autofill",
                    userData: userData
                });
            }, 500);
        }).catch(error => {
            console.error("JobAutofill Background: Error injecting content script", error);
        });
    });
});

// Listen for installation
browser.runtime.onInstalled.addListener(() => {
    console.log("JobAutofill Background: Extension installed");
});

// Listen for startup
browser.runtime.onStartup.addListener(() => {
    console.log("JobAutofill Background: Extension started");
});

console.log("JobAutofill Background: Script loaded"); 