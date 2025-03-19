// Add CSS for highlighting fields
const style = document.createElement('style');
style.textContent = `
  .job-autofill-highlight {
    background-color: #e3f2fd !important;
    border: 2px solid #2196F3 !important;
    transition: background-color 0.5s, border 0.5s;
  }
  
  .job-autofill-success {
    background-color: #e8f5e9 !important;
    border: 2px solid #4CAF50 !important;
    transition: background-color 0.5s, border 0.5s;
  }
`;
document.head.appendChild(style);

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'ANALYZE_FORM') {
        const fields = analyzeFormFields(request.isWorkday);
        console.log('Analyzed fields:', fields);
        sendResponse({ fields });
    } else if (request.action === 'AUTOFILL_FORM') {
        const result = autofillForm(request.profile, request.isWorkday);
        console.log('Autofill result:', result);
        sendResponse(result);
    }
    return true;
});

function analyzeFormFields(isWorkday) {
    console.log('Analyzing form fields with workday mode:', isWorkday);
    const fields = [];
    
    // Find all input elements
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // Skip hidden fields
        if (input.type === 'hidden' || !isVisible(input)) {
            return;
        }
        
        const fieldInfo = extractFieldInfo(input, isWorkday);
        if (fieldInfo && isInputRelevant(fieldInfo)) {
            fields.push(fieldInfo);
        }
    });
    
    console.log(`Found ${fields.length} relevant fields`);
    return fields;
}

function isInputRelevant(fieldInfo) {
    // Skip buttons, submits, etc.
    if (['button', 'submit', 'reset', 'image', 'file'].includes(fieldInfo.type)) {
        return false;
    }
    
    // Skip fields with no identifiers
    if (!fieldInfo.id && !fieldInfo.name && !fieldInfo.label && !fieldInfo.automationId && !fieldInfo.fkitId) {
        return false;
    }
    
    return true;
}

function extractFieldInfo(element, isWorkday) {
    const fieldInfo = {
        element: element,
        type: element.type || 'text',
        id: element.id,
        name: element.name,
        automationId: element.getAttribute('data-automation-id'),
        fkitId: element.getAttribute('data-fkit-id'),
        label: findFieldLabel(element),
        value: element.value,
        placeholder: element.getAttribute('placeholder') || '',
        isWorkday: isWorkday
    };
    
    // For Workday forms, look for specific patterns
    if (isWorkday) {
        const container = findWorkdayContainer(element);
        if (container) {
            fieldInfo.container = container;
            fieldInfo.containerLabel = container.getAttribute('aria-label') || '';
            // Special handling for Workday patterns
            handleWorkdaySpecialCases(fieldInfo);
        }
    }
    
    return fieldInfo;
}

function handleWorkdaySpecialCases(fieldInfo) {
    // Handle Workday's complex field patterns
    if (fieldInfo.automationId) {
        // Extract sub-component info from automation ID
        const parts = fieldInfo.automationId.split('.');
        if (parts.length > 1) {
            fieldInfo.component = parts[0];
            fieldInfo.subComponent = parts[1];
        }
        
        // Look for specific field patterns
        if (fieldInfo.automationId.includes('--')) {
            const nameParts = fieldInfo.automationId.split('--');
            if (nameParts.length > 1) {
                fieldInfo.fieldGroup = nameParts[0];
                fieldInfo.fieldName = nameParts[1];
            }
        }
    }
}

function findWorkdayContainer(element) {
    let parent = element.parentElement;
    const maxDepth = 5; // Avoid going too deep
    let depth = 0;
    
    while (parent && depth < maxDepth) {
        if (parent.hasAttribute('data-automation-id') || 
            parent.hasAttribute('data-fkit-id') ||
            parent.classList.contains('css-1ku28cn') ||
            parent.classList.contains('css-1mjmy2z') ||
            parent.classList.contains('wcpc-form')) {
            return parent;
        }
        parent = parent.parentElement;
        depth++;
    }
    return null;
}

function findFieldLabel(element) {
    // Try explicit label
    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
            return label.textContent.trim();
        }
    }
    
    // Try aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
        return ariaLabel.trim();
    }
    
    // Try placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
        return placeholder.trim();
    }
    
    // Try parent container label or legend
    let parent = element.parentElement;
    const maxDepth = 4; // Don't go too far up
    let depth = 0;
    
    while (parent && depth < maxDepth) {
        // Check for label
        const label = parent.querySelector('label');
        if (label && label.textContent) {
            return label.textContent.trim();
        }
        
        // Check for legend (in fieldsets)
        const legend = parent.querySelector('legend');
        if (legend && legend.textContent) {
            return legend.textContent.trim();
        }
        
        // Check for div with label-like class
        const labelDiv = parent.querySelector('.field-label, .label, .inputLabel, .input-label');
        if (labelDiv && labelDiv.textContent) {
            return labelDiv.textContent.trim();
        }
        
        parent = parent.parentElement;
        depth++;
    }
    
    return '';
}

function isVisible(element) {
    if (!element) return false;
    
    // Check if element or parent is hidden via CSS
    let style = window.getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
        return false;
    }
    
    // Check if element has dimensions
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
        return false;
    }
    
    return true;
}

function autofillForm(profile, isWorkday) {
    console.log('Starting autofill with profile:', profile);
    let filledCount = 0;
    
    // Create status overlay
    const overlay = createStatusOverlay();
    
    // Analyze fields
    const fields = analyzeFormFields(isWorkday);
    
    // Process each field
    fields.forEach((field, index) => {
        setTimeout(() => {
            const value = findMatchingProfileValue(field, profile, isWorkday);
            if (value !== null && value !== '') {
                fillField(field.element, value);
                filledCount++;
                updateStatusOverlay(overlay, filledCount, fields.length);
            }
        }, index * 150); // Stagger the fills with a slightly longer delay
    });
    
    // Remove overlay after completion
    setTimeout(() => {
        overlay.remove();
    }, (fields.length * 150) + 1500);
    
    return { success: true, filledCount };
}

function createStatusOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        z-index: 10000;
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 14px;
        color: #333;
        border-left: 4px solid #2196F3;
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function updateStatusOverlay(overlay, current, total) {
    overlay.textContent = `Job Autofill: ${current}/${total} fields filled`;
}

function findMatchingProfileValue(field, profile, isWorkday) {
    // Skip fields that already have values
    if (field.element.value) {
        return null;
    }
    
    // Gather all identifiers
    const identifiers = [
        field.id,
        field.name,
        field.label,
        field.placeholder,
        field.automationId,
        field.fkitId,
        field.containerLabel,
        field.fieldName,
        field.fieldGroup
    ].filter(Boolean).map(id => id.toLowerCase());
    
    console.log('Field identifiers:', identifiers);
    
    // First name
    if (matchesPattern(identifiers, [
        'first name', 'firstname', 'first-name', 'given name', 'given-name', 'fname',
        'legalname--firstname', 'name--first', 'first_name'
    ])) {
        return profile.personal.firstName;
    }
    
    // Last name
    if (matchesPattern(identifiers, [
        'last name', 'lastname', 'last-name', 'family name', 'family-name', 'lname', 'surname',
        'legalname--lastname', 'name--last', 'last_name'
    ])) {
        return profile.personal.lastName;
    }
    
    // Email
    if (matchesPattern(identifiers, [
        'email', 'e-mail', 'emailaddress', 'email address', 'email-address',
        'contact--email', 'workday.email'
    ])) {
        return profile.personal.email;
    }
    
    // Phone
    if (matchesPattern(identifiers, [
        'phone', 'telephone', 'phone number', 'phonenumber', 'phone-number', 'mobile', 'cell',
        'contact--phone', 'workphone', 'mobile-phone', 'cell-phone'
    ])) {
        return profile.personal.phone;
    }
    
    // Address
    if (matchesPattern(identifiers, [
        'address', 'street', 'street address', 'address line 1', 'addressline1',
        'streetaddress', 'address1', 'address--line1', 'location--address'
    ]) && !matchesPattern(identifiers, ['email', 'mail'])) {
        return profile.personal.address;
    }
    
    // LinkedIn
    if (matchesPattern(identifiers, [
        'linkedin', 'linked-in', 'linkedinurl', 'linkedin url', 'linkedin-url',
        'socialmedia--linkedin', 'social-linkedin'
    ])) {
        return profile.personal.linkedin;
    }
    
    // Website
    if (matchesPattern(identifiers, [
        'website', 'web site', 'personal website', 'portfolio', 'web-site',
        'personalsite', 'personal-site'
    ])) {
        return profile.personal.website;
    }
    
    // Handle work experience if available (using most recent)
    if (profile.workExperience && profile.workExperience.length > 0) {
        const mostRecent = profile.workExperience[0];
        
        // Company/Employer
        if (matchesPattern(identifiers, [
            'company', 'employer', 'organization', 'company name', 'employer name',
            'workplace', 'business', 'firm'
        ])) {
            return mostRecent.company;
        }
        
        // Job Title
        if (matchesPattern(identifiers, [
            'job title', 'jobtitle', 'position', 'title', 'role', 'job-title',
            'occupation', 'job_title', 'job role', 'job position'
        ])) {
            return mostRecent.position;
        }
    }
    
    // Handle education if available (using most recent)
    if (profile.education && profile.education.length > 0) {
        const mostRecent = profile.education[0];
        
        // School/University
        if (matchesPattern(identifiers, [
            'school', 'university', 'college', 'institution', 'school name',
            'university name', 'educational institution', 'alma mater'
        ])) {
            return mostRecent.school;
        }
        
        // Degree
        if (matchesPattern(identifiers, [
            'degree', 'qualification', 'academic degree', 'diploma', 'certificate',
            'degree name', 'degree-earned', 'degree_name'
        ])) {
            return mostRecent.degree;
        }
        
        // Field of study
        if (matchesPattern(identifiers, [
            'field of study', 'field-of-study', 'major', 'concentration', 'study field',
            'specialization', 'subject', 'discipline', 'field_of_study'
        ])) {
            return mostRecent.fieldOfStudy;
        }
    }
    
    return null;
}

function matchesPattern(identifiers, patterns) {
    return identifiers.some(id => {
        // Check for exact matches
        if (patterns.includes(id)) {
            return true;
        }
        
        // Check for partial matches
        return patterns.some(pattern => id.includes(pattern));
    });
}

function fillField(element, value) {
    // Skip empty values
    if (!value) return;
    
    // Add highlight class
    element.classList.add('job-autofill-highlight');
    
    // Handle different input types
    if (element.tagName === 'SELECT') {
        // Try to find matching option
        for (let option of element.options) {
            if (option.text.toLowerCase().includes(value.toLowerCase()) || 
                option.value.toLowerCase().includes(value.toLowerCase())) {
                element.value = option.value;
                break;
            }
        }
    } else {
        // Set value for regular inputs
        element.value = value;
    }
    
    // Trigger events to properly update the field
    ['input', 'change', 'blur', 'keyup'].forEach(eventType => {
        element.dispatchEvent(new Event(eventType, { bubbles: true }));
    });
    
    // Remove highlight and show success after delay
    setTimeout(() => {
        element.classList.remove('job-autofill-highlight');
        element.classList.add('job-autofill-success');
        
        // Remove success class after animation
        setTimeout(() => {
            element.classList.remove('job-autofill-success');
        }, 1000);
    }, 500);
} 