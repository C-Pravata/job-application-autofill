document.addEventListener('DOMContentLoaded', async () => {
  const loggedInDiv = document.getElementById('logged-in');
  const notLoggedInDiv = document.getElementById('not-logged-in');
  const usernameSpan = document.getElementById('username');
  const logoutButton = document.getElementById('logout');
  const autofillButton = document.getElementById('autofill');
  const completionProgress = document.getElementById('completion-progress');
  const statusDiv = document.getElementById('status');

  // Check login status
  try {
    const response = await fetch('http://localhost:5000/api/user/status', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.logged_in) {
      loggedInDiv.style.display = 'block';
      notLoggedInDiv.style.display = 'none';
      usernameSpan.textContent = data.username;
      completionProgress.style.width = `${data.profile_completion}%`;
    } else {
      loggedInDiv.style.display = 'none';
      notLoggedInDiv.style.display = 'block';
    }
  } catch (error) {
    showStatus('Error connecting to server', 'danger');
  }

  // Handle logout
  logoutButton.addEventListener('click', async () => {
    try {
      await fetch('http://localhost:5000/api/user/logout', {
        method: 'POST',
        credentials: 'include'
      });
      loggedInDiv.style.display = 'none';
      notLoggedInDiv.style.display = 'block';
    } catch (error) {
      showStatus('Error logging out', 'danger');
    }
  });

  // Handle autofill
  autofillButton.addEventListener('click', async () => {
    try {
      // Get the current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Get user data from the server
      const response = await fetch('http://localhost:5000/api/user/data', {
        credentials: 'include'
      });
      const userData = await response.json();

      // Send message to content script with user data
      chrome.tabs.sendMessage(tab.id, {
        action: 'autofill',
        data: userData
      }, (response) => {
        if (response && response.success) {
          showStatus('Form filled successfully!', 'success');
        } else {
          showStatus('Error filling form: ' + (response ? response.error : 'Unknown error'), 'danger');
        }
      });
    } catch (error) {
      showStatus('Error getting user data', 'danger');
    }
  });

  function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `alert alert-${type}`;
    statusDiv.style.display = 'block';
    setTimeout(() => {
      statusDiv.style.display = 'none';
    }, 3000);
  }
}); 