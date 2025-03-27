// Configuration
const API_BASE_URL = 'http://localhost:8080'; // Base URL for the Flask app
const API_PROFILE_ENDPOINT = '/api/profile-public'; // Use the public endpoint
let profileData = null;
let useWebsiteFormsOnly = true; // NEW FLAG - Always use website form data by default

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
    firstName: "Michael",
    lastName: "Jordan",
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
  console.log('DOM fully loaded - initializing popup');
  
  // Get correct references to DOM elements
  const connectionStatus = document.getElementById('connectionStatus');
  const workdayModeToggle = document.getElementById('workdayMode');
  const analyzeFormBtn = document.getElementById('analyzeForm'); // Matches HTML ID
  const autofillBtn = document.getElementById('autofill'); // Matches HTML ID
  const status = document.getElementById('status');
  
  // Debug element references
  console.log('DOM Elements found:', {
    connectionStatus: !!connectionStatus,
    workdayModeToggle: !!workdayModeToggle,
    analyzeFormBtn: !!analyzeFormBtn,
    autofillBtn: !!autofillBtn,
    status: !!status
  });
  
  if (!analyzeFormBtn || !autofillBtn) {
    console.error('Critical buttons not found in the DOM!');
    if (status) {
      status.textContent = 'Extension error: UI elements not found';
      status.className = 'status error';
    }
    return;
  }
  
  // Set initial state
  let appProfileData = null;
  
  // Initialize UI and fetch profile data
  initializeUI();
  
  // Add click event listeners with proper debug logging
  analyzeFormBtn.addEventListener('click', function() {
    console.log('Analyze Form button clicked - direct handler');
    handleAnalyzeForm();
  });
  
  autofillBtn.addEventListener('click', function() {
    console.log('Autofill button clicked - direct handler');
    handleAutofill();
  });
  
  // Add event listener for workday mode toggle
  if (workdayModeToggle) {
    workdayModeToggle.addEventListener('change', function() {
      const isChecked = workdayModeToggle.checked;
      console.log('Workday mode toggle changed:', isChecked);
      chrome.storage.local.set({ 'workdayMode': isChecked });
    });
  }
  
  // Load saved preferences
  chrome.storage.local.get(['workdayMode'], function(result) {
    console.log('Loaded saved preferences:', result);
    
    if (workdayModeToggle && result.workdayMode !== undefined) {
      workdayModeToggle.checked = result.workdayMode;
      console.log('Set workdayMode toggle to:', result.workdayMode);
    } else if (workdayModeToggle) {
      // Default to workday mode on
      workdayModeToggle.checked = true;
      console.log('Set workdayMode toggle to default true');
    }
  });
  
  // Function to initialize UI and fetch profile data
  async function initializeUI() {
    console.log('Initializing UI and fetching profile data');
    
    try {
      // Check for existing form data first
      chrome.storage.local.get(['analyzedFormData'], function(result) {
        if (result.analyzedFormData && Object.keys(result.analyzedFormData).length > 0) {
          console.log('Found existing form data:', result.analyzedFormData);
          
          if (status) {
            status.textContent = 'Using data from your website forms. Ready to analyze form fields.';
            status.className = 'status info';
          }
          
          if (connectionStatus) {
            connectionStatus.textContent = 'Using website form data';
            connectionStatus.className = 'status-indicator connected';
          }
        }
      });
      
      // Try to fetch profile data from Flask app only as fallback
      console.log('Fetching profile data from API as fallback...');
      const response = await fetch(`${API_BASE_URL}${API_PROFILE_ENDPOINT}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Received profile data from API (for fallback use only):', data);
        
        appProfileData = {
          personal: {
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            city: data.city || '',
            state: data.state || '',
            zip: data.zip || '',
            linkedin: data.linkedin || '',
            website: data.website || ''
          },
          workExperience: [],
          education: []
        };
        
        // Convert employment to workExperience format
        if (data.employment && data.employment.length > 0) {
          appProfileData.workExperience = data.employment.map(job => ({
            company: job.company || '',
            position: job.job_title || '',
            startDate: job.start_date || '',
            endDate: job.end_date || '',
            description: job.responsibilities || ''
          }));
        }
        
        // Convert education to the right format
        if (data.education && data.education.length > 0) {
          appProfileData.education = data.education.map(edu => ({
            school: edu.institution || '',
            degree: edu.degree || '',
            fieldOfStudy: edu.field_of_study || '',
            startDate: edu.start_date || '',
            endDate: edu.end_date || '',
            gpa: edu.gpa || ''
          }));
        }
        
        if (connectionStatus) {
          connectionStatus.textContent = 'Using website form data (API available as fallback)';
          connectionStatus.className = 'status-indicator connected';
        }
        
        // Store the app profile data
        chrome.storage.local.set({ 'appProfileData': appProfileData });
        console.log('Stored app profile data in local storage (for fallback use only)');
        console.log('Personal data includes:', appProfileData.personal);
        
        // Set the profile data
        profileData = appProfileData;
        
        if (status) {
          status.textContent = 'Ready to analyze form fields. Using your website forms data.';
          status.className = 'status info';
        }
      } else {
        throw new Error(`Failed to fetch profile data: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('Error fetching profile data:', error);
      
      chrome.storage.local.get(['analyzedFormData'], function(result) {
        if (result.analyzedFormData && Object.keys(result.analyzedFormData).length > 0) {
          // We have form data, so we're good
          if (connectionStatus) {
            connectionStatus.textContent = 'Using website form data only';
            connectionStatus.className = 'status-indicator connected';
          }
          
          if (status) {
            status.textContent = 'Ready to analyze form fields. Using your website forms data.';
            status.className = 'status info';
          }
        } else {
          // No form data and no API connection
          if (connectionStatus) {
            connectionStatus.textContent = 'Using website form data only (no API)';
            connectionStatus.className = 'status-indicator disconnected';
          }
          
          if (status) {
            status.textContent = 'Ready to analyze website forms. No previous form data found.';
            status.className = 'status warning';
          }
        }
      });
    }
  }
  
  // Handle analyze form button click
  function handleAnalyzeForm() {
    console.log('handleAnalyzeForm function called');
    
    if (!status) {
      console.error('Status element not found');
      return;
    }
    
    status.textContent = 'Analyzing form fields...';
    status.className = 'status info';
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        status.textContent = 'Error: Could not find active tab';
        status.className = 'status error';
        return;
      }
      
      const currentTab = tabs[0];
      console.log('Sending ANALYZE_FORM message to tab:', currentTab.id);
      
      const isWorkday = workdayModeToggle ? workdayModeToggle.checked : true;
      console.log('Workday mode enabled:', isWorkday);
      
      chrome.tabs.sendMessage(
        currentTab.id,
        { 
          action: 'ANALYZE_FORM',
          isWorkday: isWorkday 
        },
        function(response) {
          console.log('Got response from content script:', response);
          
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            status.textContent = 'Error: Could not connect to page. Make sure to reload the page.';
            status.className = 'status error';
            return;
          }
          
          if (!response) {
            console.error('No response from content script');
            status.textContent = 'No response from page. Try reloading the page.';
            status.className = 'status warning';
            return;
          }
          
          if (response.fields && response.fields.length > 0) {
            status.textContent = `Found ${response.fields.length} fields. Ready to autofill.`;
            status.className = 'status success';
            
            if (autofillBtn && autofillBtn.disabled) {
              autofillBtn.disabled = false;
            }
          } else {
            status.textContent = 'No form fields found. Make sure you are on a form page.';
            status.className = 'status warning';
          }
        }
      );
    });
  }
  
  // Handle autofill button click
  function handleAutofill() {
    console.log('handleAutofill function called');
    
    if (!status) {
      console.error('Status element not found');
      return;
    }
    
    status.textContent = 'Filling form fields...';
    status.className = 'status info';
    
    // Always use form data first - check if we have analyzed form data
    chrome.storage.local.get(['analyzedFormData'], function(result) {
      if (result.analyzedFormData) {
        console.log('Using form values from analyzed form:', result.analyzedFormData);
        // Continue with autofill using data from the form itself
        performAutofill(true);
        return;
      }
      
      // If we don't have form data, proceed with normal profile data
      // This is a fallback scenario
      if (!profileData || !profileData.personal) {
        status.textContent = 'No form data available. Analyzing form first...';
        status.className = 'status warning';
        
        // Try to analyze the form first
        handleAnalyzeForm();
        
        // Then try again with autofill after a short delay
        setTimeout(() => {
          chrome.storage.local.get(['analyzedFormData'], function(result) {
            if (result.analyzedFormData) {
              console.log('Now using newly analyzed form data');
              performAutofill(true);
            } else {
              // Last resort - use any profile data we might have
              console.log('No form data found even after analysis, using profile data as last resort');
              
              // Try to reload profile data
              fetch(`${API_BASE_URL}${API_PROFILE_ENDPOINT}`)
                .then(response => {
                  if (response.ok) return response.json();
                  throw new Error('Failed to fetch profile data');
                })
                .then(data => {
                  // Process the data and continue with autofill
                  processProfileDataAndAutofill(data);
                })
                .catch(error => {
                  console.error('Error refreshing profile data:', error);
                  // Use demo profile as last resort
                  console.log('Using DEMO_PROFILE as absolute last resort');
                  profileData = DEMO_PROFILE;
                  status.textContent = 'No form data found. Using demo data as last resort.';
                  status.className = 'status warning';
                  performAutofill(false);
                });
            }
          });
        }, 2000);
        return;
      }
      
      // If we have profile data but no form data, proceed with autofill
      // This is still a fallback scenario
      performAutofill(false);
    });
  }
  
  // Helper function to try loading profile data as a fallback
  function tryLoadProfileData(callback) {
    // Try to reload profile data
    fetch(`${API_BASE_URL}${API_PROFILE_ENDPOINT}`)
      .then(response => {
        if (response.ok) return response.json();
        throw new Error('Failed to fetch profile data');
      })
      .then(data => {
        // Process the data and continue with autofill
        processProfileDataAndAutofill(data);
        if (callback) callback();
      })
      .catch(error => {
        console.error('Error refreshing profile data:', error);
        // Use demo profile as a fallback when API fails
        console.log('Using DEMO_PROFILE as fallback since API failed');
        profileData = DEMO_PROFILE;
        status.textContent = 'Using form values with demo profile as fallback.';
        status.className = 'status warning';
        if (callback) callback();
      });
  }
  
  // Helper function to process profile data and then autofill
  function processProfileDataAndAutofill(data) {
    appProfileData = {
      personal: {
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        address: data.address || '',
        city: data.city || '',
        state: data.state || '',
        zip: data.zip || '',
        linkedin: data.linkedin || '',
        website: data.website || ''
      },
      workExperience: [],
      education: []
    };
    
    // Convert employment to workExperience format
    if (data.employment && data.employment.length > 0) {
      appProfileData.workExperience = data.employment.map(job => ({
        company: job.company || '',
        position: job.job_title || '',
        startDate: job.start_date || '',
        endDate: job.end_date || '',
        description: job.responsibilities || ''
      }));
    }
    
    // Convert education to the right format
    if (data.education && data.education.length > 0) {
      appProfileData.education = data.education.map(edu => ({
        school: edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.field_of_study || '',
        startDate: edu.start_date || '',
        endDate: edu.end_date || '',
        gpa: edu.gpa || ''
      }));
    }
    
    // Store the app profile data
    chrome.storage.local.set({ 'appProfileData': appProfileData });
    
    // Set the profile data
    profileData = appProfileData;
    
    // Proceed with autofill - always use form values first
    performAutofill(true);
  }
  
  function performAutofill(useFormValues = true) {
    console.log('Using profile data for autofill:', profileData);
    console.log('Using form values flag:', useFormValues);
    
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      if (!tabs || tabs.length === 0) {
        console.error('No active tab found');
        status.textContent = 'Error: Could not find active tab';
        status.className = 'status error';
        return;
      }
      
      const currentTab = tabs[0];
      const isWorkday = workdayModeToggle ? workdayModeToggle.checked : true;
      
      console.log('Sending AUTOFILL_FORM message to tab:', currentTab.id);
      console.log('With profile data:', profileData);
      console.log('Workday mode enabled:', isWorkday);
      console.log('Using form values flag:', useFormValues);
      
      chrome.tabs.sendMessage(
        currentTab.id,
        { 
          action: 'AUTOFILL_FORM',
          profile: profileData,
          isWorkday: isWorkday,
          useFormValues: useFormValues
        },
        function(response) {
          console.log('Got autofill response:', response);
          
          if (chrome.runtime.lastError) {
            console.error('Runtime error:', chrome.runtime.lastError);
            status.textContent = 'Error: Could not connect to page. Make sure to reload the page.';
            status.className = 'status error';
            return;
          }
          
          if (!response) {
            console.error('No response from content script');
            status.textContent = 'No response from page. Try reloading the page.';
            status.className = 'status warning';
            return;
          }
          
          if (response.success) {
            if (response.filledCount > 0) {
              status.textContent = `Successfully filled ${response.filledCount} fields using website form data`;
              status.className = 'status success';
            } else {
              status.textContent = 'No fields were filled. Try analyzing the form first.';
              status.className = 'status warning';
            }
          } else {
            status.textContent = response.error || 'Failed to fill form fields. Try reloading the page.';
            status.className = 'status error';
          }
        }
      );
    });
  }
});

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