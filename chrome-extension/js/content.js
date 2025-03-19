// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('Content script received message:', request);
    
    if (request.action === 'ANALYZE_FORM') {
        const fields = analyzeFormFields();
        console.log('Analyzed fields:', fields);
        sendResponse({ fields });
    } else if (request.action === 'AUTOFILL_FORM') {
        const result = autofillForm(request.profileData);
        console.log('Autofill result:', result);
        sendResponse(result);
    }
    return true;
});

function analyzeFormFields() {
    console.log('Analyzing form fields...');
    const fields = [];
    
    // Find all input elements
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        const fieldInfo = extractFieldInfo(input);
        if (fieldInfo) {
            fields.push(fieldInfo);
        }
    });
    
    console.log(`Found ${fields.length} fields`);
    return fields;
}

function extractFieldInfo(element) {
    // Skip hidden or disabled fields
    if (element.type === 'hidden' || element.disabled || element.readOnly) {
        return null;
    }
    
    const fieldInfo = {
        type: element.type || 'text',
        id: element.id,
        name: element.name,
        automationId: element.getAttribute('data-automation-id'),
        label: findFieldLabel(element),
        element: element
    };
    
    // Only include fields we can identify
    if (fieldInfo.id || fieldInfo.name || fieldInfo.automationId || fieldInfo.label) {
        return fieldInfo;
    }
    
    return null;
}

function findFieldLabel(element) {
    // Try to find label by for attribute
    if (element.id) {
        const label = document.querySelector(`label[for="${element.id}"]`);
        if (label) {
            return label.textContent.trim();
        }
    }
    
    // Try to find label in parent elements
    let parent = element.parentElement;
    while (parent && parent.tagName !== 'FORM' && parent.tagName !== 'BODY') {
        const label = parent.querySelector('label');
        if (label) {
            return label.textContent.trim();
        }
        parent = parent.parentElement;
    }
    
    // Try aria-label
    return element.getAttribute('aria-label') || '';
}

function autofillForm(profileData) {
    console.log('Starting autofill with profile data:', profileData);
    let filledCount = 0;
    
    // Create status container
    const statusContainer = document.createElement('div');
    statusContainer.id = 'job-autofill-status';
    statusContainer.style.position = 'fixed';
    statusContainer.style.top = '20px';
    statusContainer.style.right = '20px';
    statusContainer.style.zIndex = '10000';
    statusContainer.style.padding = '10px';
    statusContainer.style.backgroundColor = '#fff';
    statusContainer.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
    statusContainer.style.borderRadius = '4px';
    document.body.appendChild(statusContainer);
    
    const fields = analyzeFormFields();
    
    fields.forEach((field, index) => {
        setTimeout(() => {
            const value = findMatchingProfileValue(field, profileData);
            if (value !== null) {
                fillField(field.element, value);
                filledCount++;
                statusContainer.textContent = `Filling fields... (${filledCount}/${fields.length})`;
            }
        }, index * 100);
    });
    
    // Remove status after completion
    setTimeout(() => {
        statusContainer.remove();
    }, (fields.length * 100) + 1000);
    
    return { success: true, filledCount };
}

function findMatchingProfileValue(field, profileData) {
    const patterns = {
        firstName: /first.*name|fname|given.*name/i,
        lastName: /last.*name|lname|surname|family.*name/i,
        email: /email|e-mail/i,
        phone: /phone|mobile|cell/i,
        address: /address|street/i,
        city: /city|town/i,
        state: /state|province/i,
        zip: /zip|postal|postcode/i,
        linkedin: /linkedin|social.*profile/i,
        website: /website|portfolio|personal.*site/i,
        summary: /summary|profile|about|objective/i
    };
    
    // Check field identifiers
    for (const [key, pattern] of Object.entries(patterns)) {
        if (
            (field.id && pattern.test(field.id)) ||
            (field.name && pattern.test(field.name)) ||
            (field.automationId && pattern.test(field.automationId)) ||
            (field.label && pattern.test(field.label))
        ) {
            // Return the corresponding value from profileData
            return profileData[key] || '';
        }
    }
    
    // Check for employment history fields
    if (profileData.employment && profileData.employment.length > 0) {
        const mostRecent = profileData.employment[0];
        
        if (/company|employer|organization/i.test(field.label || field.name || field.id || '')) {
            return mostRecent.company || '';
        }
        if (/title|position|role/i.test(field.label || field.name || field.id || '')) {
            return mostRecent.job_title || '';
        }
        if (/responsibilities|duties|description/i.test(field.label || field.name || field.id || '')) {
            return mostRecent.responsibilities || '';
        }
    }
    
    // Check for education fields
    if (profileData.education && profileData.education.length > 0) {
        const mostRecent = profileData.education[0];
        
        if (/school|university|college|institution/i.test(field.label || field.name || field.id || '')) {
            return mostRecent.school || '';
        }
        if (/degree|qualification/i.test(field.label || field.name || field.id || '')) {
            return mostRecent.degree || '';
        }
        if (/major|field.*study|concentration/i.test(field.label || field.name || field.id || '')) {
            return mostRecent.field_of_study || '';
        }
    }
    
    return null;
}

function fillField(element, value) {
    // Highlight the field being filled
    element.classList.add('job-autofill-highlight');
    
    // Set the value
    if (element.tagName === 'SELECT') {
        const option = Array.from(element.options).find(opt => 
            opt.text.toLowerCase().includes(value.toLowerCase())
        );
        if (option) {
            element.value = option.value;
        }
    } else {
        element.value = value;
    }
    
    // Trigger events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    
    // Show success state
    setTimeout(() => {
        element.classList.remove('job-autofill-highlight');
        element.classList.add('job-autofill-success');
        
        // Remove success state after animation
        setTimeout(() => {
            element.classList.remove('job-autofill-success');
        }, 1000);
    }, 500);
} 