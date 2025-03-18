// Configuration
const API_BASE_URL = 'http://localhost:5000'; // Update this with your web app's URL
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

// DOM Elements
const profileProgress = document.getElementById('profileProgress');
const profileStatus = document.getElementById('profileStatus');
const autofillBtn = document.getElementById('autofillBtn');
const editProfileBtn = document.getElementById('editProfileBtn');
const settingsBtn = document.getElementById('settingsBtn');
const statusMessage = document.getElementById('statusMessage');
const mappingContainer = document.getElementById('mappingContainer');

// State
let profile = null;
let currentTab = null;
let fieldMappings = {};

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await getCurrentTab();
  await loadProfile();
  setupEventListeners();
});

// Get current tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
}

// Load profile from the web app
async function loadProfile() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`);
    if (!response.ok) throw new Error('Failed to load profile');
    
    profile = await response.json();
    updateProfileStatus();
  } catch (error) {
    showStatus('Error loading profile', true);
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
  settingsBtn.addEventListener('click', handleSettings);
}

// Handle autofill button click
async function handleAutofill() {
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

// Handle settings button click
function handleSettings() {
  chrome.runtime.openOptionsPage();
}

// Show status message
function showStatus(message, isError = false) {
  statusMessage.textContent = message;
  statusMessage.style.color = isError ? '#dc3545' : '#6c757d';
} 