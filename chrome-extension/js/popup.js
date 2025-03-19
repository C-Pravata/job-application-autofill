// Configuration
const API_BASE_URL = 'http://127.0.0.1:8080'; // Base URL for the Flask app
let authToken = null;

// DOM Elements - with correct references
const profileStatus = document.getElementById('profile-status');
const editProfileBtn = document.getElementById('edit-profile-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginForm = document.getElementById('login-form');
const mappingStatus = document.getElementById('mapping-status');
const autofillStatus = document.getElementById('autofill-status');
const mappingList = document.getElementById('mapping-list');
const fieldMappingSection = document.getElementById('field-mapping-section');
const workdayModeToggle = document.getElementById('workday-mode-toggle');
const analyzeFormBtn = document.getElementById('analyze-form-btn'); // Fixed ID reference
const autofillBtn = document.getElementById('autofill-btn'); // Fixed ID reference
const loginFormContainer = document.getElementById('login-form-container');
const profileInfo = document.getElementById('profile-info');
const autofillActions = document.getElementById('autofill-actions');

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
    firstName: "Michael",  // Updated to user's requested name
    lastName: "Jordan",    // Updated to user's requested name
    email: "michael.jordan@example.com",
    phone: "555-123-4567",
    address: "123 Main St, Anytown, CA 12345",
    linkedin: "linkedin.com/in/michaeljordan",
    website: "michaeljordan.com"
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
      url: "github.com/michaeljordan/ecommerce"
    }
  ]
};

// Workday-specific field mapping patterns
const WORKDAY_PATTERNS = {
  firstName: ['firstName', 'first-name', 'first_name', 'given-name', 'givenName', 'legalName--firstName'],
  lastName: ['lastName', 'last-name', 'last_name', 'family-name', 'familyName', 'legalName--lastName'],
  email: ['email', 'emailAddress', 'email-address', 'emailId', 'contact--email'],
  phone: ['phone', 'phoneNumber', 'phone-number', 'mobile', 'cellPhone', 'workPhone', 'contact--phone'],
  address: ['address', 'streetAddress', 'street-address', 'addressLine1', 'address--line1'],
  city: ['city', 'cityName', 'locality', 'address--city'],
  state: ['state', 'province', 'region', 'administrative-area', 'address--state'],
  zipCode: ['zipCode', 'postalCode', 'zip', 'postal', 'postal-code', 'address--postalCode'],
  linkedin: ['linkedin', 'linkedinUrl', 'linkedin-url', 'socialMedia--linkedin'],
  education: ['education', 'school', 'university', 'college', 'institute', 'degree'],
  jobTitle: ['position', 'title', 'jobTitle', 'job-title', 'role'],
  company: ['company', 'employer', 'organization', 'workplace'],
  workExperience: ['experience', 'work-experience', 'employment', 'work-history'],
  skills: ['skills', 'qualifications', 'abilities', 'competencies', 'expertise'],
  languages: ['languages', 'language-proficiency', 'spoken-languages']
};

// Constants
const PROFILE_DATA_KEY = 'profileData';
const LOGGED_IN_KEY = 'loggedIn';
const WORKDAY_MODE_KEY = 'workdayMode';

// Default test credentials
const TEST_USERNAME = 'user';
const TEST_PASSWORD = 'password';

// Initialize the popup when the DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup initialized');
  checkLoginStatus();
  setupEventListeners();
});

// Check if user is logged in
function checkLoginStatus() {
  console.log('Checking login status...');
  chrome.storage.local.get([LOGGED_IN_KEY, PROFILE_DATA_KEY], function(result) {
    console.log('Login status:', result);
    if (result[LOGGED_IN_KEY] === true && result[PROFILE_DATA_KEY]) {
      // User is logged in and has profile data
      console.log('User is logged in with profile data');
      showProfileSection(result[PROFILE_DATA_KEY]);
    } else {
      // User is not logged in or missing profile data
      console.log('User is not logged in or missing profile data');
      showLoginSection();
      
      // For testing purposes, simulate a login with demo credentials
      if (loginForm) {
        document.getElementById('username').value = TEST_USERNAME;
        document.getElementById('password').value = TEST_PASSWORD;
      }
    }
  });
}

// Show profile section and hide login
function showProfileSection(profileData) {
  console.log('Showing profile section with data:', profileData);
  if (loginFormContainer) loginFormContainer.style.display = 'none';
  if (profileInfo) profileInfo.style.display = 'block';
  if (autofillActions) autofillActions.style.display = 'block';
  
  updateProfileStatus(profileData);
}

// Show login section and hide profile
function showLoginSection() {
  console.log('Showing login section');
  if (loginFormContainer) loginFormContainer.style.display = 'block';
  if (profileInfo) profileInfo.style.display = 'none';
  if (autofillActions) autofillActions.style.display = 'none';
}

// Set up all event listeners
function setupEventListeners() {
  console.log('Setting up event listeners');
  
  // Login form
  if (loginForm) {
    console.log('Adding event listener to login form');
    loginForm.addEventListener('submit', handleLogin);
  } else {
    console.error('Login form element not found');
  }
  
  // Edit profile button
  if (editProfileBtn) {
    console.log('Adding event listener to edit profile button');
    editProfileBtn.addEventListener('click', handleEditProfile);
  } else {
    console.error('Edit profile button not found');
  }
  
  // Logout button
  if (logoutBtn) {
    console.log('Adding event listener to logout button');
    logoutBtn.addEventListener('click', handleLogout);
  } else {
    console.error('Logout button not found');
  }
  
  // Analyze form button - CRITICAL FIX
  if (analyzeFormBtn) {
    console.log('Adding event listener to analyze form button');
    analyzeFormBtn.addEventListener('click', handleAnalyzeForm);
  } else {
    console.error('Analyze form button not found');
  }
  
  // Autofill button - CRITICAL FIX
  if (autofillBtn) {
    console.log('Adding event listener to autofill button');
    autofillBtn.addEventListener('click', handleAutofill);
  } else {
    console.error('Autofill button not found');
  }
  
  // Workday mode toggle
  if (workdayModeToggle) {
    console.log('Adding event listener to workday mode toggle');
    // Get stored preference or default to true
    chrome.storage.local.get([WORKDAY_MODE_KEY], function(result) {
      if (result[WORKDAY_MODE_KEY] !== undefined) {
        workdayModeToggle.checked = result[WORKDAY_MODE_KEY];
      }
    });
    
    // Save when toggle changes
    workdayModeToggle.addEventListener('change', function() {
      console.log('Workday mode changed to:', workdayModeToggle.checked);
      chrome.storage.local.set({ [WORKDAY_MODE_KEY]: workdayModeToggle.checked });
    });
  } else {
    console.error('Workday mode toggle not found');
  }
}

// Handle login form submission
function handleLogin(e) {
  console.log('Login form submitted');
  e.preventDefault();
  
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  
  console.log('Login attempted with username:', username);
  
  // Simple check for demo credentials
  if (username === TEST_USERNAME && password === TEST_PASSWORD) {
    console.log('Demo login successful');
    
    // Store profile and login status
    chrome.storage.local.set({
      [PROFILE_DATA_KEY]: DEMO_PROFILE,
      [LOGGED_IN_KEY]: true
    }, function() {
      console.log('Profile data and login status saved');
      showProfileSection(DEMO_PROFILE);
      showMessage(mappingStatus, 'Logged in successfully with demo account', 'success');
    });
  } else {
    console.log('Login failed: Invalid credentials');
    showMessage(mappingStatus, 'Invalid username or password. Use demo credentials: user/password', 'error');
  }
}

// Handle logout button click
function handleLogout() {
  console.log('Logout requested');
  chrome.storage.local.remove([LOGGED_IN_KEY, PROFILE_DATA_KEY], function() {
    console.log('Logged out (data removed from storage)');
    showLoginSection();
    showMessage(mappingStatus, 'Logged out successfully', 'success');
  });
}

// Function to update profile status with completion percentage
function updateProfileStatus(profileData) {
  console.log('Updating profile status with data:', profileData);
  
  if (!profileData) return;
  
  // Calculate completion percentage
  let completedSections = 0;
  let totalSections = 5; // personal, education, workExperience, skills, languages
  
  // Check personal info completion
  const personalFields = Object.keys(profileData.personal || {}).length;
  if (personalFields > 0) completedSections++;
  
  // Check education completion
  if ((profileData.education || []).length > 0) completedSections++;
  
  // Check work experience completion
  if ((profileData.workExperience || []).length > 0) completedSections++;
  
  // Check skills completion
  if ((profileData.skills || []).length > 0) completedSections++;
  
  // Check languages completion
  if ((profileData.languages || []).length > 0) completedSections++;
  
  const completionPercentage = Math.round((completedSections / totalSections) * 100);
  
  // Update profile status in UI
  if (profileStatus) {
    profileStatus.textContent = `Profile ${completionPercentage}% complete`;
  }
}

// Handle analyze form button click
function handleAnalyzeForm() {
  console.log('Analyze form button clicked');
  showMessage(mappingStatus, 'Analyzing form fields...', 'info');
  
  // Clear any previous mapping list
  if (mappingList) {
    mappingList.innerHTML = '';
  }
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    console.log('Current tab:', tabs[0].id);
    
    const isWorkday = workdayModeToggle ? workdayModeToggle.checked : true;
    console.log('Workday mode enabled:', isWorkday);
    
    chrome.tabs.sendMessage(
      tabs[0].id,
      { action: 'ANALYZE_FORM', isWorkday: isWorkday },
      function(response) {
        console.log('Response from content script:', response);
        
        // Check for errors
        if (chrome.runtime.lastError) {
          console.error('Error:', chrome.runtime.lastError);
          showMessage(mappingStatus, 
            'Error: Could not connect to page. Make sure you\'re on a form page and try refreshing.', 
            'error');
          return;
        }
        
        if (!response) {
          console.error('No response from content script');
          showMessage(mappingStatus, 
            'No response from content script. Please refresh the page and try again.', 
            'error');
          return;
        }
        
        const { fields } = response;
        console.log('Fields detected:', fields);
        
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
            console.log('Processing field:', field);
            const item = document.createElement('li');
            item.className = 'mapping-item';
            
            // Create field name element with bold styling
            const fieldName = document.createElement('strong');
            fieldName.textContent = field.label || field.name || field.id || field.type;
            
            // Create arrow element
            const arrow = document.createElement('span');
            arrow.textContent = ' → ';
            
            // Create mapped value element
            const mappedValue = document.createElement('span');
            
            // Get profile data for mapping
            chrome.storage.local.get([PROFILE_DATA_KEY], function(result) {
              const profile = result[PROFILE_DATA_KEY] || DEMO_PROFILE;
              const profileField = determineMappedProfileField(field, profile);
              mappedValue.textContent = profileField || 'Unknown';
              
              // Add color indicators based on mapping status
              if (profileField) {
                item.classList.add('mapped');
              } else {
                item.classList.add('not-mapped');
              }
            });
            
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
      }
    );
  });
}

// Function to determine which profile field maps to a form field
function determineMappedProfileField(field, profile) {
  const { id = '', name = '', label = '', placeholder = '', automationId = '', fkitId = '' } = field;
  
  // Lowercase identifiers for case-insensitive matching
  const identifiers = [
    id.toLowerCase(),
    name.toLowerCase(),
    label.toLowerCase(),
    placeholder.toLowerCase(),
    automationId ? automationId.toLowerCase() : '',
    fkitId ? fkitId.toLowerCase() : ''
  ].filter(Boolean); // Remove empty strings
  
  console.log('Field identifiers:', identifiers);
  
  // Name fields
  if (identifiers.some(id => id.includes('first'))) {
    return `First Name (${profile.personal?.firstName})`;
  }
  
  if (identifiers.some(id => id.includes('last'))) {
    return `Last Name (${profile.personal?.lastName})`;
  }
  
  if (identifiers.some(id => id === 'name' || id.includes('full name'))) {
    return `Full Name (${profile.personal?.firstName} ${profile.personal?.lastName})`;
  }
  
  // Contact info
  if (identifiers.some(id => id.includes('email'))) {
    return `Email (${profile.personal?.email})`;
  }
  
  if (identifiers.some(id => id.includes('phone') || id.includes('mobile') || id.includes('cell'))) {
    return `Phone (${profile.personal?.phone})`;
  }
  
  // Address
  if (identifiers.some(id => id.includes('address') && !id.includes('email'))) {
    return `Address (${profile.personal?.address})`;
  }
  
  // Professional profile
  if (identifiers.some(id => id.includes('linkedin'))) {
    return `LinkedIn (${profile.personal?.linkedin})`;
  }
  
  if (identifiers.some(id => id.includes('website') || id.includes('portfolio'))) {
    return `Website (${profile.personal?.website})`;
  }
  
  // Education
  if (identifiers.some(id => id.includes('school') || id.includes('university') || id.includes('college'))) {
    return `School (${profile.education?.[0]?.school})`;
  }
  
  if (identifiers.some(id => id.includes('degree'))) {
    return `Degree (${profile.education?.[0]?.degree})`;
  }
  
  // Work Experience
  if (identifiers.some(id => id.includes('company') || id.includes('employer'))) {
    return `Company (${profile.workExperience?.[0]?.company})`;
  }
  
  if (identifiers.some(id => id.includes('job') || id.includes('position') || id.includes('title'))) {
    return `Position (${profile.workExperience?.[0]?.position})`;
  }
  
  // Skills
  if (identifiers.some(id => id.includes('skill'))) {
    return `Skills (${profile.skills?.join(', ')})`;
  }
  
  return null;
}

// Handle autofill button click
function handleAutofill() {
  console.log('Autofill button clicked');
  showMessage(autofillStatus, 'Autofilling form...', 'info');
  
  chrome.storage.local.get([PROFILE_DATA_KEY], function(result) {
    const profile = result[PROFILE_DATA_KEY] || DEMO_PROFILE;
    console.log('Using profile for autofill:', profile);
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const isWorkday = workdayModeToggle ? workdayModeToggle.checked : true;
      console.log('Workday mode enabled for autofill:', isWorkday);
      
      chrome.tabs.sendMessage(
        tabs[0].id,
        { 
          action: 'AUTOFILL_FORM',
          profile: profile,
          isWorkday: isWorkday
        },
        function(response) {
          console.log('Autofill response:', response);
          
          // Check for errors
          if (chrome.runtime.lastError) {
            console.error('Error:', chrome.runtime.lastError);
            showMessage(autofillStatus, 
              'Error: Could not connect to page. Make sure you\'re on a form page and try refreshing.', 
              'error');
            return;
          }
          
          if (!response) {
            console.error('No response from content script');
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
    });
  });
}

// Handle edit profile button click
function handleEditProfile() {
  console.log('Edit profile button clicked');
  chrome.tabs.create({ url: `${API_BASE_URL}/profile` });
}

// Helper function to show a message with a specific style
function showMessage(element, message, type) {
  console.log(`${type}: ${message}`);
  if (!element) {
    console.error('Element not found to show message');
    return;
  }
  
  element.textContent = message;
  element.className = type || 'info';
} 