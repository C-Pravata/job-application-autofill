// Field mapping for common job application forms
const fieldMapping = {
  // Personal Information
  name: ['name', 'full[_-]?name', 'full[_-]?name[_-]?input'],
  firstName: ['first[_-]?name', 'given[_-]?name', 'first'],
  lastName: ['last[_-]?name', 'family[_-]?name', 'surname', 'last'],
  email: ['email', 'e[_-]?mail', 'email[_-]?address'],
  phone: ['phone', 'telephone', 'mobile', 'cell[_-]?phone', 'phone[_-]?number'],
  address: ['address', 'street[_-]?address', 'mailing[_-]?address'],
  city: ['city', 'town'],
  state: ['state', 'province', 'region'],
  zipCode: ['zip', 'postal[_-]?code', 'zip[_-]?code'],
  country: ['country', 'nation'],

  // Professional Information
  resume: ['resume', 'cv', 'curriculum[_-]?vitae'],
  coverLetter: ['cover[_-]?letter', 'motivation[_-]?letter'],
  linkedin: ['linkedin', 'linked[_-]?in', 'linkedin[_-]?url'],
  portfolio: ['portfolio', 'portfolio[_-]?url', 'personal[_-]?website'],
  
  // Education
  degree: ['degree', 'qualification'],
  major: ['major', 'field[_-]?of[_-]?study', 'course'],
  school: ['school', 'university', 'college', 'institution'],
  graduationYear: ['graduation[_-]?year', 'completion[_-]?year'],
  gpa: ['gpa', 'grade[_-]?point[_-]?average'],

  // Employment
  company: ['company', 'employer', 'organization'],
  jobTitle: ['job[_-]?title', 'position', 'role'],
  startDate: ['start[_-]?date', 'from[_-]?date'],
  endDate: ['end[_-]?date', 'to[_-]?date'],
  currentJob: ['current[_-]?job', 'present[_-]?job', 'current[_-]?position']
};

// Keywords that indicate a job application form
const jobApplicationKeywords = [
  'job application',
  'apply now',
  'submit application',
  'application form',
  'career',
  'employment application',
  'position applied for',
  'job opening'
];

// Helper function to find form fields
function findFormFields() {
  const fields = {};
  const inputs = document.querySelectorAll('input, textarea, select');
  
  inputs.forEach(input => {
    const inputId = input.id.toLowerCase();
    const inputName = input.name.toLowerCase();
    const inputPlaceholder = (input.placeholder || '').toLowerCase();
    const inputLabel = input.labels && input.labels[0] ? input.labels[0].textContent.toLowerCase() : '';
    
    // Check each field type against the input
    Object.entries(fieldMapping).forEach(([fieldType, patterns]) => {
      patterns.forEach(pattern => {
        const regex = new RegExp(pattern, 'i');
        if (
          regex.test(inputId) ||
          regex.test(inputName) ||
          regex.test(inputPlaceholder) ||
          regex.test(inputLabel)
        ) {
          fields[fieldType] = input;
        }
      });
    });
  });
  
  return fields;
}

// Function to check if the current page is a job application
function isJobApplicationPage() {
  const pageText = document.body.innerText.toLowerCase();
  const formCount = document.forms.length;
  
  // Check for job application keywords in the page
  const hasKeywords = jobApplicationKeywords.some(keyword => 
    pageText.includes(keyword.toLowerCase())
  );

  // Check for a minimum number of form fields that match our mapping
  const matchingFields = Object.keys(findFormFields()).length;
  
  return (hasKeywords && formCount > 0) || matchingFields >= 3;
}

// Function to create floating autofill button
function createAutofillButton() {
  const button = document.createElement('button');
  button.id = 'job-autofill-button';
  button.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 5L8 14L3 9" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    Autofill Application
  `;
  
  // Style the button
  button.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    background-color: #4CAF50;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 12px 20px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: all 0.2s ease;
  `;

  // Add hover effect
  button.onmouseenter = () => {
    button.style.transform = 'translateY(-2px)';
    button.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
  };
  
  button.onmouseleave = () => {
    button.style.transform = 'translateY(0)';
    button.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  };

  // Add click handler
  button.onclick = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/user/data', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Please log in to use autofill');
      }
      
      const userData = await response.json();
      const filledCount = fillFormFields(userData);
      
      if (filledCount > 0) {
        showNotification('success', `Successfully filled ${filledCount} fields!`);
      } else {
        showNotification('warning', 'No matching fields found');
      }
    } catch (error) {
      showNotification('error', error.message);
    }
  };

  document.body.appendChild(button);
}

// Function to show notification
function showNotification(type, message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    z-index: 10001;
    animation: slideIn 0.3s ease;
  `;

  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#4CAF50';
      notification.style.color = 'white';
      break;
    case 'warning':
      notification.style.backgroundColor = '#FFA726';
      notification.style.color = 'white';
      break;
    case 'error':
      notification.style.backgroundColor = '#EF5350';
      notification.style.color = 'white';
      break;
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Function to fill form fields
function fillFormFields(userData) {
  const fields = findFormFields();
  let filledCount = 0;
  
  Object.entries(fields).forEach(([fieldType, input]) => {
    if (userData[fieldType]) {
      input.value = userData[fieldType];
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      
      // Highlight the filled field
      const originalBackground = input.style.backgroundColor;
      input.style.backgroundColor = '#e8f5e9';
      setTimeout(() => {
        input.style.backgroundColor = originalBackground;
      }, 1000);
      
      filledCount++;
    }
  });
  
  return filledCount;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAutofill);
} else {
  initializeAutofill();
}

function initializeAutofill() {
  // Check if this is a job application page
  if (isJobApplicationPage()) {
    createAutofillButton();
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'autofill') {
    try {
      const filledCount = fillFormFields(request.data);
      if (filledCount > 0) {
        sendResponse({ success: true, message: `Filled ${filledCount} fields` });
      } else {
        sendResponse({ success: false, error: 'No matching fields found' });
      }
    } catch (error) {
      sendResponse({ success: false, error: error.message });
    }
  }
  return true; // Keep the message channel open for async response
}); 