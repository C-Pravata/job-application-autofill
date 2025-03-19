// Configuration
const API_BASE_URL = 'http://127.0.0.1:8080'; // Base URL for the Flask app
let authToken = null;

// DOM Elements - use querySelector to make sure we get the right elements
const profileProgress = document.getElementById('profileProgress');
const profileStatus = document.getElementById('profileStatus');
const editProfileBtn = document.getElementById('edit-profile-btn');
const settingsBtn = document.getElementById('settingsBtn');
const statusMessage = document.getElementById('statusMessage');
const mappingContainer = document.getElementById('mappingContainer');
const loginForm = document.getElementById('login-form');
const mappingStatus = document.getElementById('mapping-status');
const autofillStatus = document.getElementById('autofill-status');
const mappingList = document.getElementById('mapping-list');
const fieldMappingSection = document.getElementById('field-mapping-section');

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

// Workday-specific field mapping patterns
const WORKDAY_PATTERNS = {
  firstName: ['firstName', 'first-name', 'first_name', 'given-name', 'givenName'],
  lastName: ['lastName', 'last-name', 'last_name', 'family-name', 'familyName'],
  email: ['email', 'emailAddress', 'email-address', 'emailId'],
  phone: ['phone', 'phoneNumber', 'phone-number', 'mobile', 'cellPhone', 'workPhone'],
  address: ['address', 'streetAddress', 'street-address', 'addressLine1'],
  city: ['city', 'cityName', 'locality'],
  state: ['state', 'province', 'region', 'administrative-area'],
  zipCode: ['zipCode', 'postalCode', 'zip', 'postal', 'postal-code'],
  linkedin: ['linkedin', 'linkedinUrl', 'linkedin-url'],
  education: ['education', 'school', 'university', 'college', 'institute', 'degree'],
  jobTitle: ['position', 'title', 'jobTitle', 'job-title', 'role'],
  company: ['company', 'employer', 'organization', 'workplace'],
  workExperience: ['experience', 'work-experience', 'employment', 'work-history'],
  skills: ['skills', 'qualifications', 'abilities', 'competencies', 'expertise'],
  languages: ['languages', 'language-proficiency', 'spoken-languages']
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
async function handleLogin(e) {
  e.preventDefault();
  
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
  // Login form submission
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }
  
  // Edit profile button
  if (editProfileBtn) {
    editProfileBtn.addEventListener('click', handleEditProfile);
  }
  
  // Logout button
  if (logoutBtn) {
    logoutBtn.addEventListener('click', handleLogout);
  }
  
  // Analyze form button
  if (analyzeFormBtn) {
    analyzeFormBtn.addEventListener('click', handleAnalyzeForm);
  }
  
  // Autofill button
  if (autofillBtn) {
    autofillBtn.addEventListener('click', handleAutofill);
  }
}

// Handle analyze form button click
async function handleAnalyzeForm() {
  showMessage(mappingStatus, 'Analyzing form fields...', 'info');
  
  // Clear any previous mapping list
  if (mappingList) {
    mappingList.innerHTML = '';
  }
  
  try {
    const activeTab = await getActiveTab();
    
    // Check if the active tab is a Workday or job application site
    const url = activeTab.url || '';
    const isWorkday = url.includes('workday') || 
                      url.includes('apply') || 
                      url.includes('careers') || 
                      url.includes('jobs');
    
    // Send message to content script
    chrome.tabs.sendMessage(activeTab.id, { 
      action: 'ANALYZE_FORM',
      isWorkday: isWorkday 
    }, function(response) {
      // Handle error or no response
      if (chrome.runtime.lastError) {
        console.error('Error sending message:', chrome.runtime.lastError);
        showMessage(mappingStatus, 
          'Error: Could not connect to page. Please make sure you\'re on a form page and try reloading.', 
          'error');
        return;
      }
      
      if (!response) {
        showMessage(mappingStatus,
          'No response from content script. Please refresh the page and try again.', 
          'error');
        return;
      }
      
      const { fields } = response;
      
      if (!fields || fields.length === 0) {
        showMessage(mappingStatus, 'No form fields detected on this page.', 'warning');
        return;
      }
      
      // Update status
      showMessage(mappingStatus, 
        `${fields.length} form fields detected. Ready to autofill.`, 
        'success');
      
      // Display the fields in the mapping list
      if (mappingList) {
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
          mappedValue.textContent = determineMappedProfileField(field);
          
          // Append all elements to the item
          item.appendChild(fieldName);
          item.appendChild(arrow);
          item.appendChild(mappedValue);
          
          // Append item to the mapping list
          mappingList.appendChild(item);
        });
      }
      
      // Show the field mapping section
      if (fieldMappingSection) {
        fieldMappingSection.style.display = 'block';
      }
    });
  } catch (error) {
    console.error('Error in analyze-form:', error);
    showMessage(mappingStatus, 'An error occurred: ' + error.message, 'error');
  }
}

// Function to determine which profile field maps to a form field
function determineMappedProfileField(field) {
  const { id = '', name = '', label = '', placeholder = '' } = field;
  
  // Lowercase identifiers for case-insensitive matching
  const identifiers = [
    id.toLowerCase(),
    name.toLowerCase(),
    label.toLowerCase(),
    placeholder.toLowerCase()
  ];
  
  // Check for Workday-specific patterns
  for (const [profileField, patterns] of Object.entries(WORKDAY_PATTERNS)) {
    for (const pattern of patterns) {
      if (identifiers.some(id => id.includes(pattern.toLowerCase()))) {
        return profileField;
      }
    }
  }
  
  // Common patterns
  if (identifiers.some(id => id.includes('name'))) {
    if (identifiers.some(id => id.includes('first'))) {
      return 'First Name';
    } else if (identifiers.some(id => id.includes('last'))) {
      return 'Last Name';
    } else {
      return 'Full Name';
    }
  }
  
  if (identifiers.some(id => id.includes('email'))) {
    return 'Email';
  }
  
  if (identifiers.some(id => id.includes('phone') || id.includes('tel'))) {
    return 'Phone';
  }
  
  if (identifiers.some(id => id.includes('address'))) {
    return 'Address';
  }
  
  if (identifiers.some(id => id.includes('school') || id.includes('edu'))) {
    return 'Education';
  }
  
  if (identifiers.some(id => id.includes('company') || id.includes('work') || id.includes('employ'))) {
    return 'Work Experience';
  }
  
  if (identifiers.some(id => id.includes('skill'))) {
    return 'Skills';
  }
  
  return 'Unknown';
}

// Handle autofill button click
async function handleAutofill() {
  showMessage(autofillStatus, 'Autofilling form...', 'info');
  
  // Get profile data from storage
  chrome.storage.local.get(['profile', 'isLoggedIn'], async function(result) {
    if (!result.isLoggedIn) {
      showMessage(autofillStatus, 'Please log in to use autofill.', 'error');
      return;
    }
    
    const profile = result.profile || DEMO_PROFILE;
    
    try {
      const activeTab = await getActiveTab();
      
      // Check if the active tab is a Workday or job application site
      const url = activeTab.url || '';
      const isWorkday = url.includes('workday') || 
                        url.includes('apply') || 
                        url.includes('careers') || 
                        url.includes('jobs');
      
      // Send message to content script with profile data
      chrome.tabs.sendMessage(
        activeTab.id, 
        { 
          action: 'AUTOFILL_FORM', 
          profile,
          isWorkday: isWorkday
        }, 
        function(response) {
          // Handle error or no response
          if (chrome.runtime.lastError) {
            console.error('Error sending message:', chrome.runtime.lastError);
            showMessage(autofillStatus, 
              'Error: Could not connect to page. Please make sure you\'re on a form page and try reloading.', 
              'error');
            return;
          }
          
          if (!response) {
            showMessage(autofillStatus, 
              'No response from content script. Please refresh the page and try again.', 
              'error');
            return;
          }
          
          const { success, fieldsFilledCount } = response;
          
          if (success && fieldsFilledCount > 0) {
            showMessage(autofillStatus, 
              `Success! ${fieldsFilledCount} fields were filled.`, 
              'success');
          } else if (success && fieldsFilledCount === 0) {
            showMessage(autofillStatus, 
              'No fields were filled. Try running "Analyze Form" first.', 
              'warning');
          } else {
            showMessage(autofillStatus, 
              'Autofill failed. Please try again.', 
              'error');
          }
        }
      );
    } catch (error) {
      console.error('Error in autofill:', error);
      showMessage(autofillStatus, 'An error occurred: ' + error.message, 'error');
    }
  });
}

// Handle edit profile button click
function handleEditProfile() {
  chrome.tabs.create({ url: `${API_BASE_URL}/profile` });
}

// Handle logout
function handleLogout() {
  chrome.storage.local.set({
    isLoggedIn: false,
    profile: null
  }, function() {
    console.log('Logged out');
    updateProfileStatus();
  });
}

// Show status message
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#dc3545' : '#6c757d';
}

// Function to get the active tab
function getActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      resolve(tabs[0]);
    });
  });
}

// Helper function to show a message with a specific style
function showMessage(element, message, type) {
  if (!element) return;
  
  element.textContent = message;
  element.className = type || 'info';
}

// Initialize the popup
document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in and update UI accordingly
  updateProfileStatus();
  
  // Set up event listeners
  setupEventListeners();
  
  // Hide the field mapping section initially
  if (fieldMappingSection) {
    fieldMappingSection.style.display = 'none';
  }
}); 