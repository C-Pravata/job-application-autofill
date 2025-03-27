// Add CSS for highlighting fields when autofilling
const style = document.createElement('style');
style.textContent = `
  .job-autofill-highlight {
    background-color: #e3f2fd !important;
    border: 2px solid #2196F3 !important;
    transition: background-color 0.5s, border 0.5s;
    box-shadow: 0 0 8px rgba(33, 150, 243, 0.5) !important;
  }
  
  .job-autofill-success {
    background-color: #e8f5e9 !important;
    border: 2px solid #4CAF50 !important;
    transition: background-color 0.5s, border 0.5s;
    box-shadow: 0 0 8px rgba(76, 175, 80, 0.5) !important;
  }
  
  .job-autofill-debug {
    outline: 2px dashed red !important;
  }
`;
document.head.appendChild(style);

console.log('Job Application Autofill content script loaded');

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'ANALYZE_FORM') {
        try {
            console.log('Analyzing form with Workday mode:', request.isWorkday);
            const fields = analyzeFormFields(request.isWorkday);
            console.log('Analyzed fields:', fields);
            sendResponse({ fields: fields });
        } catch (error) {
            console.error('Error analyzing form:', error);
            sendResponse({ error: error.message });
        }
    } else if (request.action === 'AUTOFILL_FORM') {
        try {
            console.log('Autofilling form with profile:', request.profile);
            console.log('Workday mode:', request.isWorkday);
            const result = autofillForm(request.profile, request.isWorkday);
            console.log('Autofill result:', result);
            sendResponse(result);
        } catch (error) {
            console.error('Error autofilling form:', error);
            sendResponse({ success: false, error: error.message });
        }
    }
    return true; // Keep the message channel open for async response
});

// Keep track of filled fields to prevent duplicate filling
const filledFields = new Set();

// Add a state name to abbreviation mapping
const STATE_ABBREVIATIONS = {
    'alabama': 'AL',
    'alaska': 'AK',
    'arizona': 'AZ',
    'arkansas': 'AR',
    'california': 'CA',
    'colorado': 'CO',
    'connecticut': 'CT',
    'delaware': 'DE',
    'district of columbia': 'DC',
    'florida': 'FL',
    'georgia': 'GA',
    'hawaii': 'HI',
    'idaho': 'ID',
    'illinois': 'IL',
    'indiana': 'IN',
    'iowa': 'IA',
    'kansas': 'KS',
    'kentucky': 'KY',
    'louisiana': 'LA',
    'maine': 'ME',
    'maryland': 'MD',
    'massachusetts': 'MA',
    'michigan': 'MI',
    'minnesota': 'MN',
    'mississippi': 'MS',
    'missouri': 'MO',
    'montana': 'MT',
    'nebraska': 'NE',
    'nevada': 'NV',
    'new hampshire': 'NH',
    'new jersey': 'NJ',
    'new mexico': 'NM',
    'new york': 'NY',
    'north carolina': 'NC',
    'north dakota': 'ND',
    'ohio': 'OH',
    'oklahoma': 'OK',
    'oregon': 'OR',
    'pennsylvania': 'PA',
    'rhode island': 'RI',
    'south carolina': 'SC',
    'south dakota': 'SD',
    'tennessee': 'TN',
    'texas': 'TX',
    'utah': 'UT',
    'vermont': 'VT',
    'virginia': 'VA',
    'washington': 'WA',
    'west virginia': 'WV',
    'wisconsin': 'WI',
    'wyoming': 'WY'
};

// Reverse mapping for abbreviation to state name
const ABBREVIATION_TO_STATE = Object.entries(STATE_ABBREVIATIONS).reduce((acc, [state, abbr]) => {
    acc[abbr.toLowerCase()] = state.charAt(0).toUpperCase() + state.slice(1);
    return acc;
}, {});

function analyzeFormFields(isWorkday) {
    console.log('Analyzing form fields with Workday mode:', isWorkday);
    const fields = [];
    
    // Find all input elements
    const inputs = document.querySelectorAll('input, select, textarea');
    console.log(`Found ${inputs.length} total standard input elements on the page`);
    
    // Process each input element
    inputs.forEach((input, index) => {
        // Skip hidden fields and non-visible fields
        if (input.type === 'hidden' || !isVisible(input)) {
            return;
        }
        
        // Extract field information
        const fieldInfo = extractFieldInfo(input, isWorkday);
        if (fieldInfo && isInputRelevant(fieldInfo)) {
            console.log(`Field ${index}: Found relevant field:`, fieldInfo);
            fields.push(fieldInfo);
            
            // Add debug outline during analysis
            input.classList.add('job-autofill-debug');
            setTimeout(() => {
                input.classList.remove('job-autofill-debug');
            }, 500);
        }
    });
    
    // If Workday mode is enabled, also look for custom Workday dropdowns (button elements)
    if (isWorkday) {
        console.log('Looking for Workday custom dropdown elements...');
        
        // Find all button elements that could be Workday dropdowns
        const workdayDropdowns = document.querySelectorAll('button[aria-haspopup="listbox"], [role="combobox"], .css-3fboo9, div[aria-haspopup="listbox"]');
        console.log(`Found ${workdayDropdowns.length} potential Workday dropdown elements`);
        
        workdayDropdowns.forEach((dropdown, index) => {
            if (!isVisible(dropdown)) return;
            
            const fieldInfo = extractFieldInfo(dropdown, isWorkday);
            if (fieldInfo) {
                console.log(`Workday Dropdown ${index}: Found custom dropdown:`, fieldInfo);
                fields.push(fieldInfo);
                
                // Add debug outline during analysis
                dropdown.classList.add('job-autofill-debug');
                setTimeout(() => {
                    dropdown.classList.remove('job-autofill-debug');
                }, 500);
            }
        });
    }
    
    console.log(`Found ${fields.length} total relevant fields for potential autofill`);
    return fields;
}

function isInputRelevant(fieldInfo) {
    // Skip buttons, submits, etc.
    if (['button', 'submit', 'reset', 'image', 'file'].includes(fieldInfo.type)) {
        return false;
    }
    
    // Skip fields with no identifiers
    if (!fieldInfo.id && !fieldInfo.name && !fieldInfo.label && 
        !fieldInfo.automationId && !fieldInfo.fkitId && !fieldInfo.placeholder) {
        return false;
    }
    
    return true;
}

function extractFieldInfo(element, isWorkday) {
    try {
        const fieldInfo = {
            element: element,
            type: element.type || (element.tagName.toLowerCase() === 'button' && element.getAttribute('aria-haspopup') === 'listbox' ? 'dropdown' : 'text'),
            id: element.id || '',
            name: element.name || '',
            className: element.className || '',
            automationId: element.getAttribute('data-automation-id') || '',
            fkitId: element.getAttribute('data-fkit-id') || '',
            ariaLabel: element.getAttribute('aria-label') || '',
            label: findFieldLabel(element) || '',
            value: element.value || element.textContent || '',
            placeholder: element.getAttribute('placeholder') || '',
            isWorkday: isWorkday,
            isCustomDropdown: element.tagName.toLowerCase() === 'button' && element.getAttribute('aria-haspopup') === 'listbox'
        };
        
        // Debug log for field detection
        console.log(`Field detected: type=${fieldInfo.type}, id=${fieldInfo.id}, name=${fieldInfo.name}, label=${fieldInfo.label}, isCustomDropdown=${fieldInfo.isCustomDropdown}`);
        
        // For Workday forms, look for specific patterns
        if (isWorkday) {
            const container = findWorkdayContainer(element);
            if (container) {
                fieldInfo.container = container;
                fieldInfo.containerLabel = container.getAttribute('aria-label') || '';
                fieldInfo.containerAutomationId = container.getAttribute('data-automation-id') || '';
                fieldInfo.containerFkitId = container.getAttribute('data-fkit-id') || '';
                
                // Special handling for Workday patterns
                handleWorkdaySpecialCases(fieldInfo);
            }
        }
        
        return fieldInfo;
    } catch (error) {
        console.error('Error extracting field info:', error);
        return null;
    }
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
                console.log(`Workday field pattern detected: group=${fieldInfo.fieldGroup}, name=${fieldInfo.fieldName}`);
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
    let labelText = '';
    
    // Try explicit label
    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label && label.textContent) {
            labelText = label.textContent.trim();
            console.log(`Found explicit label: "${labelText}" for element with id=${element.id}`);
            return labelText;
        }
    }
    
    // Try aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) {
        console.log(`Found aria-label: "${ariaLabel}" for element`);
        return ariaLabel.trim();
    }
    
    // Try placeholder
    const placeholder = element.getAttribute('placeholder');
    if (placeholder) {
        console.log(`Found placeholder: "${placeholder}" for element`);
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
            labelText = label.textContent.trim();
            console.log(`Found parent label: "${labelText}" at depth ${depth}`);
            return labelText;
        }
        
        // Check for legend (in fieldsets)
        const legend = parent.querySelector('legend');
        if (legend && legend.textContent) {
            labelText = legend.textContent.trim();
            console.log(`Found legend: "${labelText}" at depth ${depth}`);
            return labelText;
        }
        
        // Check for div with label-like class
        const labelDiv = parent.querySelector('.field-label, .label, .inputLabel, .input-label');
        if (labelDiv && labelDiv.textContent) {
            labelText = labelDiv.textContent.trim();
            console.log(`Found label div: "${labelText}" at depth ${depth}`);
            return labelText;
        }
        
        parent = parent.parentElement;
        depth++;
    }
    
    return '';
}

function isVisible(element) {
    if (!element) return false;
    
    try {
        // Check if element or parent is hidden via CSS
        const style = window.getComputedStyle(element);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
            console.log('Element not visible due to CSS properties');
            return false;
        }
        
        // Check element dimensions and visibility in viewport
        const rect = element.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            console.log('Element has zero dimensions');
            return false;
        }
        
        // Check if element is actually in the viewport
        const isInViewport = (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
            rect.right <= (window.innerWidth || document.documentElement.clientWidth)
        );
        
        // Element doesn't need to be in viewport to be valid, but useful for debugging
        if (!isInViewport) {
            console.log('Element is outside of viewport, but may still be valid');
        }
        
        return true;
    } catch (error) {
        console.error('Error checking visibility:', error);
        return false;
    }
}

function autofillForm(profile, isWorkday) {
    console.log('Starting autofill with profile data:', JSON.stringify(profile.personal, null, 2));
    console.log('Workday mode is enabled:', isWorkday);
    
    // Clear the filled fields set at the start of each autofill operation
    filledFields.clear();
    
    if (!profile || !profile.personal) {
        console.error('No profile data provided for autofill');
        return { success: false, error: 'No profile data provided', filledCount: 0 };
    }
    
    // Analyze form fields first
    const fields = analyzeFormFields(isWorkday);
    if (!fields || fields.length === 0) {
        console.warn('No form fields found to autofill');
        return { success: false, error: 'No form fields found to autofill', filledCount: 0 };
    }
    
    console.log(`Found ${fields.length} form fields for autofill`);
    
    // Create a status overlay
    const overlay = createStatusOverlay();
    let filledCount = 0;
    
    // Try to autofill each field
    fields.forEach((field, index) => {
        try {
            // Skip if this element has already been filled
            if (filledFields.has(field.element)) {
                console.log(`Skipping already filled field: ${field.id || field.name || 'unnamed'}`);
                return;
            }
            
            // Update the status overlay
            updateStatusOverlay(overlay, index + 1, fields.length);
            
            // Highlight the field being processed
            field.element.classList.add('job-autofill-highlight');
            
            // Find a matching value for this field from the profile
            const value = findMatchingProfileValue(field, profile, isWorkday);
            console.log(`Field ${index+1}/${fields.length} - ${field.id || field.name || 'unnamed'}: matched value = ${value}`);
            
            // If a value was found, fill the field
            if (value !== null && value !== undefined) {
                // Special handling for Workday dropdowns if needed
                let filled = false;
                
                // Check if this is a Workday dropdown field that needs special handling
                if (isWorkday && field.element.tagName.toLowerCase() === 'select' || 
                    (field.automationId && field.automationId.includes('phonetype'))) {
                    // For Workday dropdown fields, try the special handling first
                    filled = findAndHandleWorkdayDropdown(field, value);
                }
                
                // If special handling didn't work or wasn't applicable, use standard field filling
                if (!filled) {
                    fillField(field.element, value);
                }
                
                field.element.classList.add('job-autofill-success');
                field.element.classList.remove('job-autofill-highlight');
                filledCount++;
                // Add to the set of filled fields
                filledFields.add(field.element);
                console.log(`Successfully filled field ${field.id || field.name || 'unnamed'} with value: ${value}`);
            } else {
                field.element.classList.remove('job-autofill-highlight');
                console.log(`No matching profile value found for field ${field.id || field.name || 'unnamed'}`);
            }
        } catch (error) {
            console.error(`Error autofilling field ${field.id || field.name || 'unnamed'}:`, error);
            field.element.classList.remove('job-autofill-highlight');
        }
        
        // Add small delay to make the process visible to the user
        setTimeout(() => {}, 50);
    });
    
    // Remove the overlay after a short delay
    setTimeout(() => {
        document.body.removeChild(overlay);
    }, 1500);
    
    console.log(`Autofill complete: ${filledCount}/${fields.length} fields filled`);
    return { success: true, filledCount: filledCount };
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
        box-shadow: 0 3px 15px rgba(0,0,0,0.25);
        z-index: 10000;
        font-family: -apple-system, system-ui, sans-serif;
        font-size: 14px;
        color: #333;
        border-left: 4px solid #2196F3;
        transition: all 0.3s ease;
        max-width: 80%;
    `;
    document.body.appendChild(overlay);
    overlay.textContent = 'Job Autofill: Starting...';
    return overlay;
}

function updateStatusOverlay(overlay, current, total) {
    if (overlay && document.contains(overlay)) {
        overlay.textContent = `Job Autofill: ${current}/${total} fields filled`;
        
        // Change color based on progress
        const progress = current / total;
        if (progress >= 0.8) {
            overlay.style.borderLeftColor = '#4CAF50'; // Success color
        } else if (progress >= 0.5) {
            overlay.style.borderLeftColor = '#2196F3'; // Info color
        } else if (progress >= 0.2) {
            overlay.style.borderLeftColor = '#FF9800'; // Warning color
        }
    }
}

function findMatchingProfileValue(field, profile, isWorkday) {
    // Skip fields that already have values unless they're empty strings
    // For custom dropdowns, check the text content instead of value
    const fieldValue = field.isCustomDropdown ? field.element.textContent.trim() : field.element.value;
    if (fieldValue && fieldValue.trim() !== '' && !fieldValue.toLowerCase().includes('select')) {
        console.log('Field already has a value, skipping:', fieldValue);
        return null;
    }
    
    // Skip if this element has already been filled
    if (filledFields.has(field.element)) {
        console.log('Element has already been filled, skipping');
        return null;
    }

    // Get all identifiers for this field
    const identifiers = [
        field.id.toLowerCase(),
        field.name.toLowerCase(),
        field.label.toLowerCase(),
        field.placeholder.toLowerCase(),
        field.ariaLabel.toLowerCase(),
        field.automationId.toLowerCase(),
        field.className.toLowerCase()
    ].filter(id => id !== '');

    console.log('Checking field with identifiers:', identifiers);
    
    // Specific check for the phoneNumber--phoneType button in Workday
    if (field.id.includes('phoneNumber--phoneType') || 
        field.id.includes('phoneType') || 
        (field.ariaLabel && field.ariaLabel.toLowerCase().includes('phone') && 
         field.ariaLabel.toLowerCase().includes('type'))) {
        const phoneType = profile.personal.phoneType || 'Mobile';
        console.log(`Found exact phone type field match in Workday for "${phoneType}"`);
        return phoneType;
    }
    
    // More comprehensive check for phone device type fields
    if ((matchesPattern(identifiers, [
        'phonetype', 'phone type', 'phone-type', 'phone_type', 'phonedevicetype', 
        'device type', 'phone--type', 'phonenumber--phonetype'
    ]) || identifiers.some(id => 
        id.includes('phone') && (id.includes('type') || id.includes('device'))
    )) && !matchesPattern(identifiers, ['extension', 'ext'])) {
        const phoneType = profile.personal.phoneType || 'Mobile';
        console.log(`Found phone device type match for "${phoneType}"`);
        return phoneType;
    }
    
    // Check for phone extension fields - don't autofill these with the phone number
    if (matchesPattern(identifiers, [
        'phone ext', 'phone extension', 'phoneext', 'phoneextension', 'phone-ext', 
        'extension', 'ext', 'phone 2', 'secondary phone'
    ])) {
        console.log('Found phone extension field - skipping autofill');
        return null;
    }
    
    // Workday-specific address components
    // These are commonly used in Workday application forms
    if (isWorkday) {
        // Check for address line patterns specific to Workday
        if (identifiers.some(id => id.includes('address--addressline1') || id.includes('address--line1'))) {
            console.log(`Found Workday address line 1 match for "${profile.personal.address}"`);
            return profile.personal.address;
        }
        
        // Check for city patterns specific to Workday
        if (identifiers.some(id => id.includes('address--city'))) {
            console.log(`Found Workday city match for "${profile.personal.city}"`);
            return profile.personal.city;
        }
        
        // Check for state/region patterns specific to Workday
        if (identifiers.some(id => id.includes('address--state') || id.includes('address--region'))) {
            console.log(`Found Workday state match for "${profile.personal.state}"`);
            return profile.personal.state;
        }
        
        // Check for postal code patterns specific to Workday
        if (identifiers.some(id => id.includes('address--postalcode') || id.includes('address--zipcode'))) {
            console.log(`Found Workday postal code match for "${profile.personal.zip}"`);
            return profile.personal.zip;
        }
    }
    
    // First name - high priority match
    if (matchesPattern(identifiers, [
        'first name', 'firstname', 'first-name', 'given name', 'given-name', 'fname',
        'legalname--firstname', 'name--first', 'first_name', 'givenname', 'workday.firstname'
    ])) {
        console.log(`Found first name match for "${profile.personal.firstName}"`);
        return profile.personal.firstName;
    }
    
    // Middle name - medium priority match
    if (matchesPattern(identifiers, [
        'middle name', 'middlename', 'middle-name', 'middle initial', 'mi', 'mname', 
        'legalname--middlename', 'name--middle', 'middle_name', 'middleinitial'
    ])) {
        // Return middle name if available, otherwise empty string
        const middleName = profile.personal.middleName || '';
        console.log(`Found middle name match, returning: "${middleName}"`);
        return middleName;
    }
    
    // Last name - high priority match
    if (matchesPattern(identifiers, [
        'last name', 'lastname', 'last-name', 'family name', 'family-name', 'lname', 'surname',
        'legalname--lastname', 'name--last', 'last_name', 'familyname', 'workday.lastname'
    ])) {
        console.log(`Found last name match for "${profile.personal.lastName}"`);
        return profile.personal.lastName;
    }
    
    // Suffix fields - check for Mr, Mrs, Jr, Sr, etc.
    if (matchesPattern(identifiers, [
        'suffix', 'name suffix', 'name--suffix', 'legalname--suffix', 'title suffix', 
        'name title', 'honorific', 'generation', 'generational suffix'
    ])) {
        // If we have a suffix in profile, use it, otherwise leave empty
        const suffix = profile.personal.suffix || '';
        console.log(`Found suffix field, returning: "${suffix}"`);
        return suffix;
    }
    
    // Full name - check for whole name fields
    if (matchesPattern(identifiers, [
        'full name', 'fullname', 'full-name', 'name', 'complete name', 'full legal name'
    ]) && !matchesPattern(identifiers, ['first', 'last', 'user'])) {
        const fullName = `${profile.personal.firstName} ${profile.personal.lastName}`;
        console.log(`Found full name match for "${fullName}"`);
        return fullName;
    }
    
    // Email - high priority match
    if (matchesPattern(identifiers, [
        'email', 'e-mail', 'emailaddress', 'email address', 'email-address',
        'contact--email', 'workday.email', 'mail', 'e mail', 'primary email'
    ])) {
        console.log(`Found email match for "${profile.personal.email}"`);
        return profile.personal.email;
    }
    
    // Phone number - make sure we don't use for extension fields
    if (matchesPattern(identifiers, [
        'phone', 'telephone', 'phone number', 'phonenumber', 'phone-number', 'mobile', 'cell',
        'contact--phone', 'workphone', 'mobile-phone', 'cell-phone', 'mobile number',
        'primary phone', 'daytime phone', 'evening phone', 'home phone'
    ]) && !matchesPattern(identifiers, ['ext', 'extension', 'phone2', 'phone 2', 'secondary'])) {
        console.log(`Found phone match for "${profile.personal.phone}"`);
        return profile.personal.phone;
    }
    
    // Address - check for address fields but exclude email and specifically match address-related patterns
    if (matchesPattern(identifiers, [
        'address', 'street', 'street address', 'address line 1', 'addressline1',
        'streetaddress', 'address1', 'address--line1', 'location--address', 'mailing address',
        'street-address', 'address_line_1', 'addressstreet', 'residentialaddress'
    ]) && !matchesPattern(identifiers, ['email', 'mail', 'city', 'state', 'zip', 'postal', 'country']) && 
    !identifiers.some(id => id.includes('city') || id.includes('state') || id.includes('zip') || 
                           id.includes('postal') || id.includes('country'))) {
        console.log(`Found address match for "${profile.personal.address}"`);
        return profile.personal.address;
    }
    
    // City - ensure it only matches city-specific fields
    if ((matchesPattern(identifiers, [
        'city', 'town', 'municipality', 'city name', 'cityname', 'address--city'
    ]) || identifiers.some(id => id === 'city' || id.endsWith('city') || id.includes('city'))) && 
    !matchesPattern(identifiers, ['address line', 'addressline', 'street'])) {
        console.log(`Found city match for "${profile.personal.city}"`);
        return profile.personal.city;
    }
    
    // State/Province - ensure it only matches state-specific fields
    if ((matchesPattern(identifiers, [
        'state', 'province', 'region', 'state/province', 'state name', 'administrative area',
        'address--state', 'address--region'
    ]) || identifiers.some(id => id === 'state' || id.endsWith('state') || id.includes('state') || id.includes('region'))) && 
    !matchesPattern(identifiers, ['address line', 'addressline', 'street'])) {
        console.log(`Found state match for "${profile.personal.state}"`);
        return profile.personal.state;
    }
    
    // Zip/Postal Code - ensure it only matches postal code specific fields
    if ((matchesPattern(identifiers, [
        'zip', 'zipcode', 'zip code', 'zip-code', 'postal', 'postalcode', 'postal code',
        'postal-code', 'address--postalcode', 'address--zipcode'
    ]) || identifiers.some(id => id === 'zip' || id.endsWith('zip') || id.includes('zip') || 
                                 id.includes('postal'))) && 
    !matchesPattern(identifiers, ['address line', 'addressline', 'street'])) {
        console.log(`Found postal/zip code match for "${profile.personal.zip}"`);
        return profile.personal.zip;
    }
    
    // Country
    if (matchesPattern(identifiers, [
        'country', 'nation', 'country name', 'countryname', 'address--country'
    ])) {
        return "United States";
    }
    
    // LinkedIn URL
    if (matchesPattern(identifiers, [
        'linkedin', 'linked-in', 'linkedinurl', 'linkedin url', 'linkedin-url',
        'socialmedia--linkedin', 'social-linkedin', 'linkedin profile'
    ])) {
        console.log(`Found LinkedIn match for "${profile.personal.linkedin}"`);
        return profile.personal.linkedin;
    }
    
    // Website or portfolio URL
    if (matchesPattern(identifiers, [
        'website', 'web site', 'personal website', 'portfolio', 'web-site',
        'personalsite', 'personal-site', 'portfoliourl', 'portfolio url'
    ])) {
        console.log(`Found website match for "${profile.personal.website}"`);
        return profile.personal.website;
    }
    
    // Handle work experience if available (using most recent)
    if (profile.workExperience && profile.workExperience.length > 0) {
        const mostRecent = profile.workExperience[0];
        
        // Company/Employer name
        if (matchesPattern(identifiers, [
            'company', 'employer', 'organization', 'company name', 'employer name',
            'workplace', 'business', 'firm', 'employer information', 'current employer'
        ])) {
            console.log(`Found company match for "${mostRecent.company}"`);
            return mostRecent.company;
        }
        
        // Job Title/Position
        if (matchesPattern(identifiers, [
            'job title', 'jobtitle', 'position', 'title', 'role', 'job-title',
            'occupation', 'job_title', 'job role', 'job position', 'current position',
            'current role', 'current title', 'profession'
        ])) {
            console.log(`Found position match for "${mostRecent.position}"`);
            return mostRecent.position;
        }
        
        // Job description/responsibilities
        if (matchesPattern(identifiers, [
            'description', 'responsibilities', 'job description', 'duties',
            'work description', 'role description', 'job details'
        ])) {
            console.log(`Found description match for job description`);
            return mostRecent.description;
        }
    }
    
    // Handle education if available (using most recent)
    if (profile.education && profile.education.length > 0) {
        const mostRecent = profile.education[0];
        
        // School/University name
        if (matchesPattern(identifiers, [
            'school', 'university', 'college', 'institution', 'school name',
            'university name', 'educational institution', 'alma mater',
            'education institution', 'academic institution'
        ])) {
            console.log(`Found school match for "${mostRecent.school}"`);
            return mostRecent.school;
        }
        
        // Degree
        if (matchesPattern(identifiers, [
            'degree', 'qualification', 'academic degree', 'diploma', 'certificate',
            'degree name', 'degree-earned', 'degree_name', 'degree earned',
            'education level', 'level of education'
        ])) {
            console.log(`Found degree match for "${mostRecent.degree}"`);
            return mostRecent.degree;
        }
        
        // Major/Field of study
        if (matchesPattern(identifiers, [
            'field of study', 'field-of-study', 'major', 'concentration', 'study field',
            'specialization', 'subject', 'discipline', 'field_of_study', 'area of study',
            'program', 'course', 'academic focus'
        ])) {
            console.log(`Found field of study match for "${mostRecent.fieldOfStudy}"`);
            return mostRecent.fieldOfStudy;
        }
        
        // GPA
        if (matchesPattern(identifiers, [
            'gpa', 'grade point average', 'grade-point-average', 'grade_point_average',
            'academic average', 'grade average'
        ])) {
            console.log(`Found GPA match for "${mostRecent.gpa}"`);
            return mostRecent.gpa;
        }
    }
    
    // Specific check for state fields in Workday
    if (field.id.includes('address--state') || 
        field.id.includes('state') ||
        field.name.includes('state') ||
        (field.ariaLabel && field.ariaLabel.toLowerCase().includes('state'))) {
        
        const state = profile.personal.state || '';
        console.log(`Found state field match for "${state}"`);
        
        // Return abbreviation if field has a class or attribute suggesting it wants abbreviations
        if (field.element.classList.contains('state-abbr') || 
            field.element.getAttribute('data-format') === 'abbr' ||
            field.element.getAttribute('maxlength') === '2') {
            
            const stateAbbr = STATE_ABBREVIATIONS[state.toLowerCase()];
            if (stateAbbr) {
                console.log(`Converting state "${state}" to abbreviation "${stateAbbr}"`);
                return stateAbbr;
            }
        }
        
        return state;
    }
    
    // No match found
    console.log('No matching profile value found for this field');
    return null;
}

function matchesPattern(identifiers, patterns) {
    if (!identifiers || !patterns) return false;
    
    return identifiers.some(id => {
        if (!id) return false;
        
        // Case-insensitive matching
        id = id.toLowerCase();
        
        // Check for exact matches
        if (patterns.includes(id)) {
            console.log(`Exact match found: "${id}" in patterns`);
            return true;
        }
        
        // Check for partial matches (field identifier contains pattern)
        for (const pattern of patterns) {
            // More strict partial matching to avoid false positives
            // Check if there are word boundaries around the pattern or it's part of a compound word
            if (id.includes(pattern) && (
                // Pattern at beginning of identifier
                id.startsWith(pattern) ||
                // Pattern at end of identifier
                id.endsWith(pattern) ||
                // Pattern with word boundary before it (spaces, hyphens, underscores)
                id.match(new RegExp(`[\\s\\-_]${pattern}`)) ||
                // Pattern with word boundary after it
                id.match(new RegExp(`${pattern}[\\s\\-_]`)) ||
                // Pattern with beginning and end boundaries (only for longer patterns)
                (pattern.length > 5 && new RegExp(`\\b${pattern}\\b`).test(id))
            )) {
                console.log(`Partial match found: pattern "${pattern}" in identifier "${id}" with word boundaries`);
                return true;
            }
        }
        
        // Check for pattern in identifier (word boundary match)
        for (const pattern of patterns) {
            const words = id.split(/\W+/); // Split by non-word characters
            if (words.includes(pattern)) {
                console.log(`Word boundary match: "${pattern}" found in "${id}"`);
                return true;
            }
        }
        
        return false;
    });
}

function fillField(element, value) {
    // Skip empty values
    if (!value) {
        console.log('Skipping null or empty value');
        return false;
    }
    
    try {
        console.log(`Filling field with value: "${value}"`);
        
        // Add highlight class to show which field is being filled
        element.classList.add('job-autofill-highlight');
        
        // Handle different input types
        if (element.tagName.toLowerCase() === 'select') {
            fillSelectField(element, value);
        } else if (element.tagName.toLowerCase() === 'textarea') {
            fillTextareaField(element, value);
        } else if (element.tagName.toLowerCase() === 'button' && element.getAttribute('aria-haspopup') === 'listbox') {
            fillWorkdayCustomDropdown(element, value);
        } else {
            fillInputField(element, value);
        }
        
        // Remove highlight and show success after delay
        setTimeout(() => {
            element.classList.remove('job-autofill-highlight');
            element.classList.add('job-autofill-success');
            
            // Remove success class after animation
            setTimeout(() => {
                element.classList.remove('job-autofill-success');
            }, 1500);
        }, 800);
        
        return true;
    } catch (error) {
        console.error('Error filling field:', error, element);
        element.classList.remove('job-autofill-highlight');
        return false;
    }
}

function fillSelectField(element, value) {
    console.log('Filling SELECT field with value:', value);
    
    // Try to find matching option
    let matched = false;
    const lowercaseValue = value.toLowerCase();
    
    // Special handling for phone type fields to ensure proper matching
    const isPhoneTypeField = element.id.toLowerCase().includes('phonetype') || 
                             element.id.toLowerCase().includes('phone-type') || 
                             element.name.toLowerCase().includes('phonetype') || 
                             element.name.toLowerCase().includes('phone-type') || 
                             element.getAttribute('data-automation-id')?.toLowerCase().includes('phonetype') ||
                             element.getAttribute('data-automation-id')?.toLowerCase().includes('phone-type') ||
                             element.getAttribute('aria-label')?.toLowerCase().includes('phone type');
    
    if (isPhoneTypeField) {
        console.log('This is a phone type field. Looking for specific match:', value);
        
        // Map our phone types to common Workday phone type values
        const phoneTypeMap = {
            'mobile': ['cell', 'mobile', 'cellphone', 'mobile phone', 'cell phone'],
            'telephone': ['home', 'telephone', 'landline', 'home phone'],
            'work': ['work', 'business', 'company', 'office', 'work phone'],
            'fax': ['fax', 'facsimile'],
            'pager': ['pager']
        };
        
        // Get the appropriate match list based on our phone type
        const matchOptions = phoneTypeMap[lowercaseValue] || [lowercaseValue];
        console.log('Looking for phone type matches:', matchOptions);
        
        // First, ensure that the dropdown is actually clicked/opened
        // This is important for Workday forms where dropdowns may need to be clicked first
        simulateClick(element);
        
        // Some Workday forms have a specific dropdown structure (may be a custom control)
        // Check if this is a Workday-style dropdown (div with select-like behavior)
        const isWorkdayCustomDropdown = element.tagName.toLowerCase() !== 'select' && 
                                       (element.classList.contains('css-1ku28cn') || 
                                        element.getAttribute('role') === 'combobox');
        
        if (isWorkdayCustomDropdown) {
            console.log('This appears to be a custom Workday dropdown');
            
            // For Workday custom dropdowns, we need to:
            // 1. Click on the dropdown to open it
            simulateClick(element);
            
            // 2. Wait for the dropdown options to appear
            setTimeout(() => {
                // Look for dropdown items in the DOM (Workday patterns)
                const dropdownItems = document.querySelectorAll('.css-1mkjh7o, .dropdown-option, [role="option"], .dropdown-list-item');
                console.log(`Found ${dropdownItems.length} dropdown items`);
                
                // Try to find the matching option
                for (const item of dropdownItems) {
                    const itemText = item.textContent.toLowerCase();
                    
                    for (const matchOption of matchOptions) {
                        if (itemText.includes(matchOption)) {
                            console.log(`Found matching custom dropdown item: "${item.textContent}"`);
                            simulateClick(item);
                            matched = true;
                            break;
                        }
                    }
                    
                    if (matched) break;
                }
                
                // If no match found, log available options
                if (!matched && dropdownItems.length > 0) {
                    console.log('No match found in custom dropdown. Available options:');
                    dropdownItems.forEach((item, i) => {
                        console.log(`- Option ${i}: ${item.textContent}`);
                    });
                }
            }, 500); // Add a small delay to allow the dropdown to open
            
        } else if (element.tagName.toLowerCase() === 'select') {
            // Standard select dropdown
            // Look for matches in dropdown options
            for (let i = 0; i < element.options.length; i++) {
                const option = element.options[i];
                const optionText = option.text.toLowerCase();
                const optionValue = option.value.toLowerCase();
                
                for (const matchOption of matchOptions) {
                    if (optionText.includes(matchOption) || optionValue.includes(matchOption)) {
                        console.log(`Found matching phone type option: "${option.text}" (${option.value})`);
                        element.selectedIndex = i;
                        matched = true;
                        break;
                    }
                }
                
                if (matched) break;
            }
            
            // If still no match found, just log all available options for debugging
            if (!matched) {
                console.log('No phone type match found. Available options:');
                for (let i = 0; i < element.options.length; i++) {
                    console.log(`- Option ${i}: ${element.options[i].text} (${element.options[i].value})`);
                }
            }
        }
    } else {
        // Regular option matching for non-phone type fields
        for (let i = 0; i < element.options.length; i++) {
            const option = element.options[i];
            const optionText = option.text.toLowerCase();
            const optionValue = option.value.toLowerCase();
            
            if (optionText.includes(lowercaseValue) || 
                optionValue.includes(lowercaseValue) ||
                lowercaseValue.includes(optionText) ||
                lowercaseValue.includes(optionValue)) {
                console.log(`Found matching option: "${option.text}" (${option.value})`);
                element.selectedIndex = i;
                matched = true;
                break;
            }
        }
    }
    
    // If no direct match, try to set value directly (might work in some cases)
    if (!matched) {
        console.log('No direct option match found, trying to set value directly');
        element.value = value;
    }
    
    // Trigger change event to update the select with the new value
    triggerEvents(element, ['change']);
}

function fillTextareaField(element, value) {
    console.log('Filling TEXTAREA field');
    
    // Set the value
    element.value = value;
    
    // Trigger events to force the field to update
    triggerEvents(element, ['input', 'change', 'blur']);
}

function fillInputField(element, value) {
    console.log('Filling INPUT field');
    
    // Handle different input types
    switch (element.type.toLowerCase()) {
        case 'checkbox':
            element.checked = value === true || value === 'true' || value === '1' || value === 'yes';
            break;
        case 'radio':
            element.checked = element.value.toLowerCase() === value.toLowerCase();
            break;
        default:
            // For text, email, password, etc.
            element.value = value;
            break;
    }
    
    // Trigger events to force the field to update
    triggerEvents(element, ['input', 'change', 'blur', 'keyup']);
}

function triggerEvents(element, eventTypes) {
    eventTypes.forEach(eventType => {
        try {
            console.log(`Triggering ${eventType} event`);
            const event = new Event(eventType, { bubbles: true });
            element.dispatchEvent(event);
        } catch (e) {
            console.error(`Error dispatching ${eventType} event:`, e);
            
            // Try older method as fallback
            try {
                const event = document.createEvent('HTMLEvents');
                event.initEvent(eventType, true, false);
                element.dispatchEvent(event);
            } catch (e2) {
                console.error(`Fallback error for ${eventType} event:`, e2);
            }
        }
    });
}

// Helper function to safely simulate a click on an element
function simulateClick(element) {
    if (!element) return;
    
    console.log('Simulating click on element:', element);
    
    try {
        // Try the modern way first
        element.click();
    } catch (e) {
        console.error('Error with element.click():', e);
        
        try {
            // Fallback to creating a MouseEvent
            const event = new MouseEvent('click', {
                view: window,
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(event);
        } catch (e2) {
            console.error('Error dispatching MouseEvent:', e2);
            
            // Last resort - try older event creation method
            try {
                const event = document.createEvent('MouseEvents');
                event.initEvent('click', true, true);
                element.dispatchEvent(event);
            } catch (e3) {
                console.error('All click simulation methods failed:', e3);
            }
        }
    }
}

// Add a function to handle Workday-specific dropdown interactions
function findAndHandleWorkdayDropdown(field, value) {
    // Look for Workday dropdown containers
    const container = field.container || findWorkdayContainer(field.element);
    if (!container) return false;
    
    // Look for possible dropdown triggers
    const triggers = container.querySelectorAll('.css-1ku28cn, [role="combobox"], .dropdown-trigger, .select-input');
    if (triggers.length === 0) return false;
    
    console.log(`Found ${triggers.length} possible Workday dropdown triggers`);
    
    // Click the trigger to open the dropdown
    simulateClick(triggers[0]);
    
    // Wait for dropdown to open and select the matching option
    setTimeout(() => {
        // Look for dropdown options
        const options = document.querySelectorAll('.css-1mkjh7o, .dropdown-option, [role="option"], .dropdown-list-item');
        console.log(`Found ${options.length} dropdown options after clicking trigger`);
        
        const lowercaseValue = value.toLowerCase();
        let matched = false;
        
        // Try to find a matching option
        for (const option of options) {
            if (option.textContent.toLowerCase().includes(lowercaseValue)) {
                console.log(`Found matching option: "${option.textContent}"`);
                simulateClick(option);
                matched = true;
                break;
            }
        }
        
        if (!matched && options.length > 0) {
            console.log('No match found. Available options:');
            options.forEach((opt, i) => console.log(`- Option ${i}: ${opt.textContent}`));
        }
    }, 500);
    
    return true;
}

// New function to handle Workday custom dropdown buttons
function fillWorkdayCustomDropdown(element, value) {
    console.log('Filling Workday custom dropdown button with value:', value);
    
    // First, click the dropdown button to open it
    simulateClick(element);
    console.log('Clicked dropdown button, waiting for options to appear...');
    
    // Special handling for state selections
    const isStateField = element.id.includes('state') || 
                         element.getAttribute('aria-label')?.toLowerCase().includes('state') ||
                         element.name?.includes('state');
                         
    const stateName = value;
    const stateAbbr = STATE_ABBREVIATIONS[value.toLowerCase()];
    
    // Wait for the dropdown options to appear
    setTimeout(() => {
        // Try to find the dropdown options container
        // In Workday, it's often a listbox or popup div that appears after clicking
        const optionsContainers = document.querySelectorAll('[role="listbox"], .css-dropdown-options, .popup-dropdown');
        
        // If no containers found, try finding individual option elements that might be available
        if (optionsContainers.length === 0) {
            console.log('No option containers found, looking for individual options...');
            const options = document.querySelectorAll('[role="option"], .dropdown-option, .css-option');
            
            if (options.length > 0) {
                if (isStateField) {
                    findAndClickMatchingStateOption(options, stateName, stateAbbr);
                } else {
                    findAndClickMatchingOption(options, value);
                }
            } else {
                console.log('No dropdown options found after clicking. Trying to find options by common Workday classes...');
                
                // Try alternative selectors for Workday dropdown options
                const alternativeOptions = document.querySelectorAll('.css-1mkjh7o, .css-1ka88v, .css-bxur4l');
                if (alternativeOptions.length > 0) {
                    if (isStateField) {
                        findAndClickMatchingStateOption(alternativeOptions, stateName, stateAbbr);
                    } else {
                        findAndClickMatchingOption(alternativeOptions, value);
                    }
                } else {
                    console.error('Could not find any dropdown options');
                }
            }
        } else {
            console.log(`Found ${optionsContainers.length} option containers`);
            
            // For each container, try to find the matching option
            optionsContainers.forEach(container => {
                const options = container.querySelectorAll('[role="option"], li, div');
                if (options.length > 0) {
                    if (isStateField) {
                        findAndClickMatchingStateOption(options, stateName, stateAbbr);
                    } else {
                        findAndClickMatchingOption(options, value);
                    }
                }
            });
        }
    }, 500);
}

// Helper function to find and click the matching state option
function findAndClickMatchingStateOption(options, stateName, stateAbbr) {
    console.log(`Looking for state match: full name="${stateName}", abbreviation="${stateAbbr}"`);
    const stateNameLower = stateName.toLowerCase();
    let foundMatch = false;
    
    // Log all available options for debugging
    console.log('Available state options:');
    options.forEach((option, index) => {
        console.log(`Option ${index}: ${option.textContent}`);
    });
    
    // First try: exact match on state name
    for (const option of options) {
        const optionText = option.textContent.toLowerCase();
        
        if (optionText === stateNameLower) {
            console.log(`Found exact state name match: "${option.textContent}"`);
            simulateClick(option);
            foundMatch = true;
            break;
        }
    }
    
    // Second try: match on state abbreviation
    if (!foundMatch && stateAbbr) {
        for (const option of options) {
            const optionText = option.textContent.toLowerCase();
            
            if (optionText === stateAbbr.toLowerCase()) {
                console.log(`Found state abbreviation match: "${option.textContent}"`);
                simulateClick(option);
                foundMatch = true;
                break;
            }
        }
    }
    
    // Third try: partial matches
    if (!foundMatch) {
        for (const option of options) {
            const optionText = option.textContent.toLowerCase();
            
            // Check if option contains state name
            if (optionText.includes(stateNameLower)) {
                console.log(`Found partial state name match: "${option.textContent}"`);
                simulateClick(option);
                foundMatch = true;
                break;
            }
            
            // Check for combined formats like "NY - New York"
            if (stateAbbr && (
                optionText.includes(stateAbbr.toLowerCase()) || 
                optionText.includes(`${stateAbbr.toLowerCase()} -`) || 
                optionText.includes(`- ${stateNameLower}`)
            )) {
                console.log(`Found combined state format match: "${option.textContent}"`);
                simulateClick(option);
                foundMatch = true;
                break;
            }
            
            // Check for abbreviation matches in options that look like abbreviations (2 chars)
            if (stateAbbr && optionText.length === 2 && optionText === stateAbbr.toLowerCase()) {
                console.log(`Found abbreviated state match: "${option.textContent}"`);
                simulateClick(option);
                foundMatch = true;
                break;
            }
        }
    }
    
    // Fourth try: check for options that have both abbreviation and name
    if (!foundMatch) {
        // Look for entries that might contain both the abbreviation and state name
        for (const option of options) {
            const optionText = option.textContent.toLowerCase();
            
            // Common format: "AL - Alabama" or "Alabama (AL)"
            if (stateAbbr && (
                optionText.includes(`${stateAbbr.toLowerCase()} - ${stateNameLower}`) ||
                optionText.includes(`${stateNameLower} (${stateAbbr.toLowerCase()})`)
            )) {
                console.log(`Found state with format match: "${option.textContent}"`);
                simulateClick(option);
                foundMatch = true;
                break;
            }
        }
    }
    
    // If still no match, try to find any close matches
    if (!foundMatch && options.length > 0) {
        console.log('No exact state match found, looking for close matches...');
        
        // Try to find something reasonably close
        let bestMatch = null;
        let bestScore = 0;
        
        for (const option of options) {
            const optionText = option.textContent.toLowerCase();
            
            // Calculate a rough similarity score
            let score = 0;
            
            // Exact matches get high scores
            if (optionText === stateNameLower) score += 100;
            if (stateAbbr && optionText === stateAbbr.toLowerCase()) score += 100;
            
            // Partial matches get lower scores
            if (optionText.includes(stateNameLower)) score += 50;
            if (stateAbbr && optionText.includes(stateAbbr.toLowerCase())) score += 40;
            
            // Combined formats get medium scores
            if (stateAbbr && optionText.includes(`${stateAbbr.toLowerCase()} -`)) score += 70;
            if (stateAbbr && optionText.includes(`(${stateAbbr.toLowerCase()})`)) score += 70;
            
            if (score > bestScore) {
                bestScore = score;
                bestMatch = option;
            }
        }
        
        if (bestMatch && bestScore > 30) {
            console.log(`Selecting best state match: "${bestMatch.textContent}" with score ${bestScore}`);
            simulateClick(bestMatch);
            foundMatch = true;
        }
    }
    
    // Last resort - if still no match and not a "Select" placeholder, pick the first option
    if (!foundMatch && options.length > 0 && !options[0].textContent.toLowerCase().includes('select')) {
        console.log('No state match found, clicking first option as fallback');
        simulateClick(options[0]);
    }
}

// Helper function to find and click matching options in dropdowns
function findAndClickMatchingOption(options, value) {
    console.log(`Looking for option matching value: "${value}"`);
    const valueLower = value.toLowerCase();
    let foundMatch = false;
    
    // Log all available options for debugging
    console.log('Available options:');
    options.forEach((option, index) => {
        console.log(`Option ${index}: ${option.textContent}`);
    });
    
    // First try: exact match
    for (const option of options) {
        const optionText = option.textContent.toLowerCase();
        
        if (optionText === valueLower) {
            console.log(`Found exact match: "${option.textContent}"`);
            simulateClick(option);
            foundMatch = true;
            break;
        }
    }
    
    // Second try: contains match
    if (!foundMatch) {
        for (const option of options) {
            const optionText = option.textContent.toLowerCase();
            
            if (optionText.includes(valueLower) || valueLower.includes(optionText)) {
                console.log(`Found partial match: "${option.textContent}"`);
                simulateClick(option);
                foundMatch = true;
                break;
            }
        }
    }
    
    // Last resort - if still no match and not a "Select" placeholder, pick the first option
    if (!foundMatch && options.length > 0 && !options[0].textContent.toLowerCase().includes('select')) {
        console.log('No match found, clicking first option as fallback');
        simulateClick(options[0]);
    }
} 