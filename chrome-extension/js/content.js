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
    console.log('Analyzing form fields...');
    const fields = [];
    
    // Find all input elements
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        // Skip hidden fields
        if (input.type === 'hidden' || !isVisible(input)) {
            return;
        }
        
        const fieldInfo = extractFieldInfo(input, isWorkday);
        if (fieldInfo) {
            fields.push(fieldInfo);
        }
    });
    
    console.log(`Found ${fields.length} fields`);
    return fields;
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
        isWorkday: isWorkday
    };
    
    // For Workday forms, look for specific patterns
    if (isWorkday) {
        const container = findWorkdayContainer(element);
        if (container) {
            fieldInfo.container = container;
            fieldInfo.containerLabel = container.getAttribute('aria-label');
        }
    }
    
    return fieldInfo;
}

function findWorkdayContainer(element) {
    let parent = element.parentElement;
    while (parent && !parent.matches('form')) {
        if (parent.hasAttribute('data-automation-id')) {
            return parent;
        }
        parent = parent.parentElement;
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
    
    // Try parent container label
    let parent = element.parentElement;
    while (parent && !parent.matches('form')) {
        const label = parent.querySelector('label');
        if (label) {
            return label.textContent.trim();
        }
        parent = parent.parentElement;
    }
    
    return '';
}

function isVisible(element) {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
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
            if (value !== null) {
                fillField(field.element, value);
                filledCount++;
                updateStatusOverlay(overlay, filledCount, fields.length);
            }
        }, index * 100); // Stagger the fills
    });
    
    // Remove overlay after completion
    setTimeout(() => {
        overlay.remove();
    }, (fields.length * 100) + 1000);
    
    return { success: true, filledCount };
}

function createStatusOverlay() {
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #fff;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        z-index: 10000;
        font-family: -apple-system, system-ui, sans-serif;
    `;
    document.body.appendChild(overlay);
    return overlay;
}

function updateStatusOverlay(overlay, current, total) {
    overlay.textContent = `Filling fields: ${current}/${total}`;
}

function findMatchingProfileValue(field, profile, isWorkday) {
    const identifiers = [
        field.id,
        field.name,
        field.automationId,
        field.fkitId,
        field.label,
        field.containerLabel
    ].filter(Boolean).map(id => id.toLowerCase());
    
    // First name patterns
    if (identifiers.some(id => 
        id.includes('first') && id.includes('name') ||
        id.includes('firstname') ||
        id.includes('given') && id.includes('name') ||
        id === 'fname' ||
        (isWorkday && id.includes('legalname--firstname'))
    )) {
        return profile.personal.firstName;
    }
    
    // Last name patterns
    if (identifiers.some(id => 
        id.includes('last') && id.includes('name') ||
        id.includes('lastname') ||
        id.includes('family') && id.includes('name') ||
        id === 'lname' ||
        (isWorkday && id.includes('legalname--lastname'))
    )) {
        return profile.personal.lastName;
    }
    
    // Email patterns
    if (identifiers.some(id => 
        id.includes('email') ||
        id.includes('e-mail') ||
        (isWorkday && id.includes('contact--email'))
    )) {
        return profile.personal.email;
    }
    
    // Phone patterns
    if (identifiers.some(id => 
        id.includes('phone') ||
        id.includes('mobile') ||
        id.includes('cell') ||
        (isWorkday && id.includes('contact--phone'))
    )) {
        return profile.personal.phone;
    }
    
    // Address patterns
    if (identifiers.some(id => 
        id.includes('address') && !id.includes('email') ||
        id.includes('street') ||
        (isWorkday && id.includes('address--line1'))
    )) {
        return profile.personal.address;
    }
    
    // LinkedIn patterns
    if (identifiers.some(id => 
        id.includes('linkedin') ||
        id.includes('linked-in') ||
        (isWorkday && id.includes('socialmedia--linkedin'))
    )) {
        return profile.personal.linkedin;
    }
    
    return null;
}

function fillField(element, value) {
    // Highlight the field
    element.style.backgroundColor = '#e8f5e9';
    
    // Set the value
    element.value = value;
    
    // Trigger events
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    element.dispatchEvent(new Event('blur', { bubbles: true }));
    
    // Remove highlight after animation
    setTimeout(() => {
        element.style.backgroundColor = '';
    }, 1000);
} 