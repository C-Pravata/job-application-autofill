// Configuration
const API_BASE_URL = 'http://127.0.0.1:8080'; // Updated to point to the correct website
let authToken = null;

// DOM Elements
const profileProgress = document.getElementById('profileProgress');
const profileStatus = document.getElementById('profileStatus');
const autofillBtn = document.getElementById('autofillBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const settingsBtn = document.getElementById('settingsBtn');
const statusMessage = document.getElementById('statusMessage');
const mappingContainer = document.getElementById('mappingContainer');

// Login Elements
const loginSection = document.createElement('div');
loginSection.className = 'login-section';
loginSection.innerHTML = `
  <h2>Login</h2>
  <div class="form-group">
    <input type="text" id="username" placeholder="Username" class="form-control">
  </div>
  <div class="form-group">
    <input type="password" id="password" placeholder="Password" class="form-control">
  </div>
  <button id="loginBtn" class="btn primary">Login</button>
`;

// State
let profile = null;
let currentTab = null;
let fieldMappings = {};
let isLoggedIn = false;

// Common field mappings (unchanged)
const COMMON_FIELD_MAPPINGS = {
  'name': ['name', 'full-name', 'fullName'],
  'email': ['email', 'emailAddress', 'email-address'],
  'phone': ['phone', 'phoneNumber', 'phone-number', 'tel'],
  'address': ['address', 'streetAddress', 'street-address'],
  'city': ['city', 'cityName'],
  'state': ['state', 'stateRegion', 'region'],
  'zipCode': ['zipCode', 'postalCode', 'zip', 'postal'],
  'country': ['country', 'countryName'],
};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await getCurrentTab();
  checkLoginStatus();
  setupEventListeners();
});

// Check if user is logged in
function checkLoginStatus() {
  chrome.storage.local.get(['authToken'], (result) => {
    if (result.authToken) {
      authToken = result.authToken;
      isLoggedIn = true;
      hideLoginForm();
      loadProfile();
    } else {
      showLoginForm();
    }
  });
}

// Show login form
function showLoginForm() {
  document.querySelector('.container').insertBefore(loginSection, document.querySelector('.status-section'));
  document.querySelector('.status-section').style.display = 'none';
  document.querySelector('.actions-section').style.display = 'none';
  document.querySelector('.field-mapping').style.display = 'none';
}

// Hide login form
function hideLoginForm() {
  if (document.contains(loginSection)) {
    document.querySelector('.container').removeChild(loginSection);
  }
  document.querySelector('.status-section').style.display = 'block';
  document.querySelector('.actions-section').style.display = 'flex';
  document.querySelector('.field-mapping').style.display = 'block';
}

// Get current tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
}

// Load profile from the web app
async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) throw new Error('Failed to load profile');
    
    profile = await response.json();
    updateProfileStatus();
  } catch (error) {
    showStatus('Error loading profile', true);
  }
}

// Handle login
async function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  if (!username || !password) {
    showStatus('Please enter username and password', true);
    return;
  }
  
  try {
    showStatus('Logging in...');
    
    // This is a simplified login. In a real application, you'd make a proper API call
    // to authenticate the user and get a token.
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ username, password })
    });
    
    if (!response.ok) throw new Error('Invalid credentials');
    
    const data = await response.json();
    authToken = data.token;
    
    // Store the token in chrome.storage
    chrome.storage.local.set({ authToken: authToken });
    
    isLoggedIn = true;
    hideLoginForm();
    loadProfile();
    showStatus('Logged in successfully!');
  } catch (error) {
    showStatus('Login failed: ' + error.message, true);
  }
}

// Update profile status display
function updateProfileStatus() {
  if (!profile) return;

  const completion = calculateProfileCompletion();
  profileProgress.style.width = `${completion}%`;
  profileStatus.textContent = `Profile ${completion}% complete`;
}

// Calculate profile completion percentage
function calculateProfileCompletion() {
  if (!profile) return 0;

  const requiredFields = [
    'name', 'email', 'phone', 'address',
    'education', 'experience', 'skills'
  ];

  const completed = requiredFields.filter(field => 
    profile[field] && profile[field].length > 0
  ).length;

  return Math.round((completed / requiredFields.length) * 100);
}

// Set up event listeners
function setupEventListeners() {
  autofillBtn.addEventListener('click', handleAutofill);
  editProfileBtn.addEventListener('click', handleEditProfile);
  
  // Add event listener for login button when it exists
  document.addEventListener('click', (e) => {
    if (e.target && e.target.id === 'loginBtn') {
      handleLogin();
    }
  });
}

// Handle autofill button click
async function handleAutofill() {
  if (!isLoggedIn) {
    showStatus('Please log in first', true);
    return;
  }
  
  if (!profile) {
    showStatus('Please complete your profile first', true);
    return;
  }

  try {
    showStatus('Analyzing form fields...');
    
    // Send message to content script to analyze form
    const fields = await chrome.tabs.sendMessage(currentTab.id, {
      action: 'ANALYZE_FORM'
    });

    if (!fields || fields.length === 0) {
      showStatus('No form fields found', true);
      return;
    }

    // Map fields to profile data
    const mappedFields = mapFieldsToProfile(fields);
    
    // Send mapped fields to content script
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'AUTOFILL_FORM',
      data: mappedFields
    });

    showStatus('Form filled successfully!');
  } catch (error) {
    showStatus('Error filling form: ' + error.message, true);
  }
}

// Map form fields to profile data
function mapFieldsToProfile(fields) {
  const mappedFields = {};

  fields.forEach(field => {
    const profileField = findMatchingProfileField(field);
    if (profileField && profile[profileField]) {
      mappedFields[field.id || field.name] = profile[profileField];
    }
  });

  return mappedFields;
}

// Find matching profile field based on field name/id
function findMatchingProfileField(field) {
  const fieldName = (field.id || field.name).toLowerCase();

  for (const [profileField, mappings] of Object.entries(COMMON_FIELD_MAPPINGS)) {
    if (mappings.some(mapping => fieldName.includes(mapping.toLowerCase()))) {
      return profileField;
    }
  }

  return null;
}

// Handle edit profile button click
function handleEditProfile() {
  chrome.tabs.create({ url: `${API_BASE_URL}/profile` });
}

// Logout function
function handleLogout() {
  chrome.storage.local.remove(['authToken'], () => {
    authToken = null;
    isLoggedIn = false;
    profile = null;
    showLoginForm();
    showStatus('Logged out successfully');
  });
}

// Show status message
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#dc3545' : '#6c757d';
} 