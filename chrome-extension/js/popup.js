// Configuration
const API_BASE_URL = 'http://localhost:8080'; // Base URL for the Flask app
let profileData = null;

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
const connectionStatus = document.getElementById('connectionStatus');

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
  initializeUI();
  setupEventListeners();
});

// Initialize UI and fetch profile data
async function initializeUI() {
  const connectionStatus = document.getElementById('connectionStatus');
  const autofillBtn = document.getElementById('autofill-btn');
  
  try {
    // Try to fetch profile data from Flask app
    const response = await fetch(`${API_BASE_URL}/api/profile`);
    if (response.ok) {
      const data = await response.json();
      profileData = {
        personal: {
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          linkedin: data.linkedin || '',
          website: data.website || ''
        },
        employment: data.employment || [],
        education: data.education || []
      };
      
      connectionStatus.textContent = 'Connected to web app';
      connectionStatus.className = 'status-indicator connected';
      
      // Store the profile data
      chrome.storage.local.set({ 'profileData': profileData });
    } else {
      throw new Error('Failed to fetch profile data');
    }
  } catch (error) {
    console.log('Error fetching profile data:', error);
    connectionStatus.textContent = 'Using demo data (click to connect)';
    connectionStatus.className = 'status-indicator demo';
    
    // Use demo data as fallback
    profileData = DEMO_PROFILE;
  }
  
  // Enable autofill button
  if (autofillBtn) {
    autofillBtn.disabled = false;
  }
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
  const status = document.getElementById('status');
  status.textContent = 'Analyzing form fields...';
  status.className = 'info';
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { 
        action: 'ANALYZE_FORM',
        isWorkday: document.getElementById('workday-mode-toggle').checked
      },
      function(response) {
        if (chrome.runtime.lastError) {
          status.textContent = 'Error: Could not connect to page';
          status.className = 'error';
          return;
        }
        
        if (response && response.fields) {
          status.textContent = `Found ${response.fields.length} fields. Ready to autofill.`;
          status.className = 'success';
          document.getElementById('autofill-btn').disabled = false;
        } else {
          status.textContent = 'No form fields found';
          status.className = 'warning';
        }
      }
    );
  });
}

// Handle autofill button click
function handleAutofill() {
  const status = document.getElementById('status');
  status.textContent = 'Filling form fields...';
  status.className = 'info';
  
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(
      tabs[0].id,
      { 
        action: 'AUTOFILL_FORM',
        profile: profileData,
        isWorkday: document.getElementById('workday-mode-toggle').checked
      },
      function(response) {
        if (chrome.runtime.lastError) {
          status.textContent = 'Error: Could not connect to page';
          status.className = 'error';
          return;
        }
        
        if (response && response.success) {
          status.textContent = `Successfully filled ${response.filledCount} fields`;
          status.className = 'success';
        } else {
          status.textContent = 'Failed to fill form fields';
          status.className = 'error';
        }
      }
    );
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