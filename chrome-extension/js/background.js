// Listen for installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.sync.set({
      enableAutoDetect: true,
      defaultMappings: true,
      notifyOnSuccess: true
    });
  }
});

// Listen for tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if the current page is a job application page
    const isJobSite = isJobApplicationSite(tab.url);
    
    if (isJobSite) {
      // Update the extension icon to indicate it's ready
      chrome.action.setIcon({
        path: {
          "16": "images/icon16-active.png",
          "48": "images/icon48-active.png",
          "128": "images/icon128-active.png"
        },
        tabId: tabId
      });
    }
  }
});

// Check if the URL is a known job application site
function isJobApplicationSite(url) {
  const jobSites = [
    'indeed.com',
    'linkedin.com/jobs',
    'glassdoor.com',
    'monster.com',
    'careers.',
    'jobs.',
    'workday.com',
    'lever.co',
    'greenhouse.io'
  ];

  return jobSites.some(site => url.includes(site));
}

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'CHECK_JOB_SITE':
      sendResponse({ isJobSite: isJobApplicationSite(sender.tab.url) });
      break;
    case 'LOG_SUCCESS':
      // Store successful autofill attempts for analytics
      logAutofillSuccess(sender.tab.url);
      break;
    case 'LOG_ERROR':
      // Store autofill errors for debugging
      logAutofillError(sender.tab.url, request.error);
      break;
  }
  return true;
});

// Log successful autofill attempts
function logAutofillSuccess(url) {
  const now = new Date();
  chrome.storage.local.get(['autofillHistory'], (result) => {
    const history = result.autofillHistory || [];
    history.push({
      timestamp: now.toISOString(),
      url: url,
      success: true
    });
    
    // Keep only last 100 entries
    if (history.length > 100) {
      history.shift();
    }
    
    chrome.storage.local.set({ autofillHistory: history });
  });
}

// Log autofill errors
function logAutofillError(url, error) {
  const now = new Date();
  chrome.storage.local.get(['autofillErrors'], (result) => {
    const errors = result.autofillErrors || [];
    errors.push({
      timestamp: now.toISOString(),
      url: url,
      error: error
    });
    
    // Keep only last 50 errors
    if (errors.length > 50) {
      errors.shift();
    }
    
    chrome.storage.local.set({ autofillErrors: errors });
  });
} 