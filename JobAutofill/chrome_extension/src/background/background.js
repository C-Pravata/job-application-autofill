// Create context menu items
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'autofillForm',
    title: 'Autofill Job Application',
    contexts: ['page', 'selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'autofillForm') {
    // Get user data and send to content script
    fetch('http://localhost:5000/api/user/data', {
      credentials: 'include'
    })
    .then(response => response.json())
    .then(userData => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'autofill',
        data: userData
      });
    })
    .catch(error => {
      console.error('Error fetching user data:', error);
    });
  }
});

// Handle extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Open dashboard in new tab if not logged in
  fetch('http://localhost:5000/api/user/status', {
    credentials: 'include'
  })
  .then(response => response.json())
  .then(data => {
    if (!data.logged_in) {
      chrome.tabs.create({ url: 'http://localhost:5000/login' });
    } else {
      chrome.tabs.create({ url: 'http://localhost:5000/dashboard' });
    }
  })
  .catch(error => {
    console.error('Error checking login status:', error);
    chrome.tabs.create({ url: 'http://localhost:5000/login' });
  });
});

// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open onboarding page
    chrome.tabs.create({
      url: 'http://localhost:5000/onboarding'
    });
  }
}); 