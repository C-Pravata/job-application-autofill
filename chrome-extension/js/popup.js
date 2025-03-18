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
    <small>For demo, use: user</small>
  </div>
  <div class="form-group">
    <input type="password" id="password" placeholder="Password" class="form-control">
    <small>For demo, use: password</small>
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
  chrome.storage.local.get(['authToken', 'userData'], (result) => {
    if (result.authToken && result.userData) {
      authToken = result.authToken;
      profile = result.userData;
      isLoggedIn = true;
      hideLoginForm();
      updateProfileStatus();
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
    
    // Use the specific login route from the Flask app
    // For demo purposes, we'll hardcode authentication for the demo user/password
    if (username === 'user' && password === 'password') {
      // Simulate successful login
      authToken = 'demo-token-12345';
      
      // Get sample profile data - this would normally come from the API
      profile = {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '555-123-4567',
        address: '123 Main St, Apt 4B',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
        education: [
          {
            institution: 'University of Example',
            degree: 'Bachelor of Science',
            field: 'Computer Science',
            startDate: '2015-09-01',
            endDate: '2019-05-31'
          }
        ],
        experience: [
          {
            company: 'Tech Solutions Inc.',
            position: 'Software Developer',
            startDate: '2019-06-15',
            endDate: 'Present',
            description: 'Full-stack development with modern technologies.'
          }
        ],
        skills: ['JavaScript', 'Python', 'HTML/CSS', 'React', 'Node.js']
      };
      
      // Store the token and profile data in chrome.storage
      chrome.storage.local.set({ 
        authToken: authToken,
        userData: profile
      });
      
      isLoggedIn = true;
      hideLoginForm();
      updateProfileStatus();
      showStatus('Logged in successfully!');
    } else {
      throw new Error('Invalid credentials');
    }
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
    profile[field] && (Array.isArray(profile[field]) ? profile[field].length > 0 : profile[field].length > 0)
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
    
    // Add field mapping info to the popup
    displayFieldMapping(fields, mappedFields);
    
    // Send mapped fields to content script
    await chrome.tabs.sendMessage(currentTab.id, {
      action: 'AUTOFILL_FORM',
      data: mappedFields
    });

    showStatus(`Form filled successfully! (${Object.keys(mappedFields).length} fields)`);
  } catch (error) {
    showStatus('Error filling form: ' + error.message, true);
  }
}

// Display field mapping information
function displayFieldMapping(fields, mappedFields) {
  mappingContainer.innerHTML = '';
  
  if (Object.keys(mappedFields).length === 0) {
    mappingContainer.innerHTML = '<p>No matching fields found</p>';
    return;
  }
  
  const mappedCount = Object.keys(mappedFields).length;
  const totalCount = fields.length;
  
  mappingContainer.innerHTML = `
    <p>${mappedCount} of ${totalCount} fields were mapped:</p>
    <ul class="mapping-list">
      ${Object.entries(mappedFields).map(([fieldId, value]) => {
        const field = fields.find(f => (f.id || f.name) === fieldId);
        return `<li>
          <strong>${field.label || fieldId}:</strong> 
          <span>${typeof value === 'string' ? value : JSON.stringify(value)}</span>
        </li>`;
      }).join('')}
    </ul>
  `;
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
  const fieldName = (field.id || field.name || '').toLowerCase();
  const fieldLabel = (field.label || '').toLowerCase();
  
  for (const [profileField, mappings] of Object.entries(COMMON_FIELD_MAPPINGS)) {
    if (mappings.some(mapping => 
      fieldName.includes(mapping.toLowerCase()) || 
      fieldLabel.includes(mapping.toLowerCase())
    )) {
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
  chrome.storage.local.remove(['authToken', 'userData'], () => {
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