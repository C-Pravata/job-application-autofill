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

// Sample profile data for demo
const DEMO_PROFILE = {
  personal: {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "555-123-4567",
    address: "123 Main St, Anytown, CA 12345",
    linkedin: "linkedin.com/in/johndoe",
    website: "johndoe.com"
  },
  education: [
    {
      school: "University of Technology",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      startDate: "2015-09-01",
      endDate: "2019-05-31",
      gpa: "3.8"
    }
  ],
  workExperience: [
    {
      company: "Tech Solutions Inc.",
      position: "Software Developer",
      startDate: "2019-06-15",
      endDate: "Present",
      description: "Developed web applications using JavaScript, HTML, and CSS. Collaborated with cross-functional teams to implement new features and fix bugs."
    },
    {
      company: "Digital Innovations",
      position: "Junior Developer",
      startDate: "2018-05-01",
      endDate: "2019-05-30",
      description: "Assisted in the development of mobile applications. Participated in code reviews and testing."
    }
  ],
  skills: ["JavaScript", "HTML", "CSS", "Python", "React", "Node.js", "Git", "Agile Development"],
  languages: ["English (Native)", "Spanish (Intermediate)"],
  projects: [
    {
      name: "E-commerce Platform",
      description: "Built a full-stack e-commerce platform with React, Node.js, and MongoDB.",
      url: "github.com/johndoe/ecommerce"
    }
  ]
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
      profile = DEMO_PROFILE;
      
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

// Function to update profile status with more accurate calculation
function updateProfileStatus() {
  // For demo purposes, we'll use the sample profile
  // In a real implementation, we would get this from the API
  // Get the profile from storage
  chrome.storage.local.get(['profile', 'isLoggedIn'], function(result) {
    if (result.isLoggedIn) {
      const profile = result.profile || DEMO_PROFILE;
      
      // Calculate completion percentage more accurately
      let completedSections = 0;
      let totalSections = 5; // personal, education, workExperience, skills, languages
      
      // Check personal info completion
      const personalFields = Object.keys(profile.personal || {}).length;
      if (personalFields > 0) completedSections++;
      
      // Check education completion
      if ((profile.education || []).length > 0) completedSections++;
      
      // Check work experience completion
      if ((profile.workExperience || []).length > 0) completedSections++;
      
      // Check skills completion
      if ((profile.skills || []).length > 0) completedSections++;
      
      // Check languages completion
      if ((profile.languages || []).length > 0) completedSections++;
      
      const completionPercentage = Math.round((completedSections / totalSections) * 100);
      
      // Update profile status in UI
      document.getElementById('profile-status').textContent = 
        `Profile ${completionPercentage}% complete`;
      
      // Show different UI for logged in state
      document.getElementById('login-form').style.display = 'none';
      document.getElementById('profile-info').style.display = 'block';
      document.getElementById('autofill-actions').style.display = 'block';
    } else {
      // Show login form
      document.getElementById('login-form').style.display = 'block';
      document.getElementById('profile-info').style.display = 'none';
      document.getElementById('autofill-actions').style.display = 'none';
    }
  });
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

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  // For demo, use hardcoded credentials
  if (username === 'user' && password === 'password') {
    // Store the profile data and login status
    chrome.storage.local.set({
      isLoggedIn: true,
      profile: DEMO_PROFILE
    }, function() {
      console.log('Demo login successful');
      document.getElementById('login-message').className = 'success';
      document.getElementById('login-message').textContent = 'Login successful!';
      
      // Update UI to reflect logged in state
      updateProfileStatus();
      
      // Clear the fields
      document.getElementById('username').value = '';
      document.getElementById('password').value = '';
    });
  } else {
    document.getElementById('login-message').className = 'error';
    document.getElementById('login-message').textContent = 'Invalid credentials!';
  }
});

// Function to get the active tab
function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      resolve(tabs[0]);
    });
  });
}

// Improved analyze form function with more detailed error handling
document.getElementById('analyze-form-btn').addEventListener('click', async function() {
  const activeTab = await getActiveTab();
  
  // Clear any previous mapping list
  const mappingList = document.getElementById('mapping-list');
  mappingList.innerHTML = '';
  
  // Show loading state
  document.getElementById('mapping-status').textContent = 'Analyzing form fields...';
  document.getElementById('mapping-status').className = 'info';
  
  try {
    // Send message to content script
    chrome.tabs.sendMessage(activeTab.id, { action: 'ANALYZE_FORM' }, function(response) {
      // Handle error or no response
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        document.getElementById('mapping-status').textContent = 
          'Error: Could not connect to page. Please make sure you\'re on a form page and try reloading.';
        document.getElementById('mapping-status').className = 'error';
        return;
      }
      
      if (!response) {
        document.getElementById('mapping-status').textContent = 
          'No response from content script. Please refresh the page and try again.';
        document.getElementById('mapping-status').className = 'error';
        return;
      }
      
      const { fields } = response;
      
      if (!fields || fields.length === 0) {
        document.getElementById('mapping-status').textContent = 'No form fields detected on this page.';
        document.getElementById('mapping-status').className = 'warning';
        return;
      }
      
      // Update status
      document.getElementById('mapping-status').textContent = 
        `${fields.length} form fields detected. Ready to autofill.`;
      document.getElementById('mapping-status').className = 'success';
      
      // Display the fields in the mapping list
      fields.forEach(field => {
        const item = document.createElement('li');
        item.className = 'mapping-item';
        
        // Create field name element with bold styling
        const fieldName = document.createElement('strong');
        fieldName.textContent = field.name || field.id || field.type;
        
        // Create arrow element
        const arrow = document.createElement('span');
        arrow.textContent = ' → ';
        
        // Create mapped value element
        const mappedValue = document.createElement('span');
        // Determine what profile field this might map to
        let mappedField = '';
        
        if (field.id && field.id.toLowerCase().includes('name')) {
          if (field.id.toLowerCase().includes('first')) {
            mappedField = 'First Name';
          } else if (field.id.toLowerCase().includes('last')) {
            mappedField = 'Last Name';
          } else {
            mappedField = 'Full Name';
          }
        } else if (field.id && field.id.toLowerCase().includes('email')) {
          mappedField = 'Email';
        } else if (field.id && (field.id.toLowerCase().includes('phone') || field.id.toLowerCase().includes('tel'))) {
          mappedField = 'Phone';
        } else if (field.id && field.id.toLowerCase().includes('address')) {
          mappedField = 'Address';
        } else if (field.id && field.id.toLowerCase().includes('education')) {
          mappedField = 'Education';
        } else if (field.id && field.id.toLowerCase().includes('experience')) {
          mappedField = 'Work Experience';
        } else if (field.id && field.id.toLowerCase().includes('skill')) {
          mappedField = 'Skills';
        } else {
          mappedField = 'Unknown';
        }
        
        mappedValue.textContent = mappedField;
        
        // Append all elements to the item
        item.appendChild(fieldName);
        item.appendChild(arrow);
        item.appendChild(mappedValue);
        
        // Append item to the mapping list
        mappingList.appendChild(item);
      });
      
      // Show the mapping list section
      document.getElementById('field-mapping-section').style.display = 'block';
    });
  } catch (error) {
    console.error('Error in analyze-form:', error);
    document.getElementById('mapping-status').textContent = 
      'An error occurred: ' + error.message;
    document.getElementById('mapping-status').className = 'error';
  }
});

// Improved autofill function with better error handling and feedback
document.getElementById('autofill-btn').addEventListener('click', async function() {
  const activeTab = await getActiveTab();
  
  // Show loading state
  document.getElementById('autofill-status').textContent = 'Autofilling form...';
  document.getElementById('autofill-status').className = 'info';
  
  // Get profile data from storage
  chrome.storage.local.get(['profile', 'isLoggedIn'], function(result) {
    if (!result.isLoggedIn) {
      document.getElementById('autofill-status').textContent = 
        'Please log in to use autofill.';
      document.getElementById('autofill-status').className = 'error';
      return;
    }
    
    const profile = result.profile || DEMO_PROFILE;
    
    try {
      // Send message to content script with profile data
      chrome.tabs.sendMessage(
        activeTab.id, 
        { action: 'AUTOFILL_FORM', profile }, 
        function(response) {
          // Handle error or no response
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            document.getElementById('autofill-status').textContent = 
              'Error: Could not connect to page. Please make sure you\'re on a form page and try reloading.';
            document.getElementById('autofill-status').className = 'error';
            return;
          }
          
          if (!response) {
            document.getElementById('autofill-status').textContent = 
              'No response from content script. Please refresh the page and try again.';
            document.getElementById('autofill-status').className = 'error';
            return;
          }
          
          const { success, fieldsFilledCount } = response;
          
          if (success && fieldsFilledCount > 0) {
            document.getElementById('autofill-status').textContent = 
              `Success! ${fieldsFilledCount} fields were filled.`;
            document.getElementById('autofill-status').className = 'success';
          } else if (success && fieldsFilledCount === 0) {
            document.getElementById('autofill-status').textContent = 
              'No fields were filled. Try running "Analyze Form" first.';
            document.getElementById('autofill-status').className = 'warning';
          } else {
            document.getElementById('autofill-status').textContent = 
              'Autofill failed. Please try again.';
            document.getElementById('autofill-status').className = 'error';
          }
        }
      );
    } catch (error) {
      console.error('Error in autofill:', error);
      document.getElementById('autofill-status').textContent = 
        'An error occurred: ' + error.message;
      document.getElementById('autofill-status').className = 'error';
    }
  });
});

// Function to log out
document.getElementById('logout-btn').addEventListener('click', function() {
  chrome.storage.local.set({
    isLoggedIn: false,
    profile: null
  }, function() {
    console.log('Logged out');
    updateProfileStatus();
  });
});

// Initialize the popup
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in and update UI accordingly
  updateProfileStatus();
  
  // Hide the field mapping section initially
  document.getElementById('field-mapping-section').style.display = 'none';
}); 