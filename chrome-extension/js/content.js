// Listen for messages from the popup
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  console.log('Content script received message:', message);
  
  if (message.action === 'ANALYZE_FORM') {
    // Analyze the form fields on the page
    const fields = analyzeFormFields();
    console.log('Analyzed fields:', fields);
    sendResponse({ fields });
  } else if (message.action === 'AUTOFILL_FORM') {
    // Autofill the form using the provided profile data
    const result = autofillForm(message.profile);
    console.log('Autofill result:', result);
    sendResponse({ 
      success: result.success, 
      fieldsFilledCount: result.fieldsFilledCount 
    });
  }
  
  // Required to use sendResponse asynchronously
  return true;
});

// Function to analyze form fields on the page
function analyzeFormFields() {
  // Find all forms on the page
  const forms = document.querySelectorAll('form');
  console.log(`Found ${forms.length} forms on the page`);
  
  // If no forms found, look for input fields directly
  if (forms.length === 0) {
    return analyzeInputsDirectly();
  }
  
  // Process each form
  let allFields = [];
  forms.forEach(form => {
    const fields = extractFormFields(form);
    allFields = allFields.concat(fields);
  });
  
  return allFields;
}

// Function to analyze inputs directly (not in forms)
function analyzeInputsDirectly() {
  const inputs = document.querySelectorAll('input, select, textarea');
  let fields = [];
  
  inputs.forEach(input => {
    if (isRelevantField(input)) {
      fields.push(extractFieldInfo(input));
    }
  });
  
  return fields;
}

// Check if an input field is relevant for autofill
function isRelevantField(field) {
  // Skip hidden or disabled fields, submit buttons, etc.
  if (field.type === 'hidden' || 
      field.type === 'submit' || 
      field.type === 'button' || 
      field.type === 'image' || 
      field.type === 'reset' || 
      field.type === 'file' || 
      field.disabled || 
      field.readOnly) {
    return false;
  }
  
  // Skip fields that are not visible
  const style = window.getComputedStyle(field);
  if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') {
    return false;
  }
  
  return true;
}

// Extract information about a form
function extractFormFields(form) {
  const elements = form.elements;
  let fields = [];
  
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    
    if (isRelevantField(element)) {
      fields.push(extractFieldInfo(element));
    }
  }
  
  return fields;
}

// Extract information about a form field
function extractFieldInfo(field) {
  return {
    id: field.id,
    name: field.name,
    type: field.type,
    tag: field.tagName.toLowerCase(),
    value: field.value,
    placeholder: field.placeholder,
    label: getFieldLabel(field),
    element: field // Reference to the actual DOM element
  };
}

// Get the label text for a form field
function getFieldLabel(field) {
  // First, check for a label element associated with this field
  if (field.id) {
    const label = document.querySelector(`label[for="${field.id}"]`);
    if (label && label.textContent.trim()) {
      return label.textContent.trim();
    }
  }
  
  // Check for a parent label
  let parent = field.parentElement;
  while (parent) {
    if (parent.tagName === 'LABEL' && parent.textContent.trim()) {
      return parent.textContent.trim().replace(field.value, '').trim();
    }
    parent = parent.parentElement;
  }
  
  // If no label found, try using the field's name, id, placeholder, or aria-label
  return field.ariaLabel || field.placeholder || field.name || field.id || '';
}

// Autofill form with profile data
function autofillForm(profile) {
  // Create a container for the status indicator
  const statusContainer = document.createElement('div');
  statusContainer.id = 'job-autofill-status';
  statusContainer.style.position = 'fixed';
  statusContainer.style.top = '10px';
  statusContainer.style.right = '10px';
  statusContainer.style.background = '#333';
  statusContainer.style.color = '#fff';
  statusContainer.style.padding = '10px 15px';
  statusContainer.style.borderRadius = '5px';
  statusContainer.style.zIndex = '10000';
  statusContainer.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  statusContainer.style.transition = 'opacity 0.3s ease';
  statusContainer.textContent = 'Analyzing form fields...';
  document.body.appendChild(statusContainer);
  
  // Analyze the form fields
  const fields = analyzeFormFields();
  
  if (fields.length === 0) {
    statusContainer.textContent = 'No form fields detected.';
    setTimeout(() => {
      statusContainer.style.opacity = '0';
      setTimeout(() => document.body.removeChild(statusContainer), 300);
    }, 3000);
    return { success: false, fieldsFilledCount: 0 };
  }
  
  statusContainer.textContent = `Found ${fields.length} fields. Beginning autofill...`;
  
  // Initialize counter for filled fields
  let filledCount = 0;
  
  // Process fields with a small delay between each for visual effect
  let currentIndex = 0;
  
  function processNextField() {
    if (currentIndex >= fields.length) {
      // All fields processed
      statusContainer.textContent = `Autofill complete. Filled ${filledCount} fields.`;
      setTimeout(() => {
        statusContainer.style.opacity = '0';
        setTimeout(() => {
          try {
            document.body.removeChild(statusContainer);
          } catch (e) {
            console.log('Status container already removed');
          }
        }, 300);
      }, 3000);
      return;
    }
    
    const field = fields[currentIndex];
    statusContainer.textContent = `Filling field ${currentIndex + 1}/${fields.length}...`;
    
    // Try to fill the field
    const fieldElement = field.element;
    if (fieldElement) {
      // Highlight the field before filling
      fieldElement.classList.add('job-autofill-highlight');
      
      // Scroll the field into view with some margin
      const rect = fieldElement.getBoundingClientRect();
      const isInViewport = rect.top >= 0 && 
                          rect.left >= 0 && 
                          rect.bottom <= window.innerHeight && 
                          rect.right <= window.innerWidth;
      
      if (!isInViewport) {
        fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      // Fill field with appropriate value from profile
      setTimeout(() => {
        const filled = fillField(fieldElement, field, profile);
        
        if (filled) {
          fieldElement.classList.add('job-autofill-success');
          filledCount++;
        } else {
          fieldElement.classList.remove('job-autofill-highlight');
        }
        
        // Process next field after a delay
        currentIndex++;
        setTimeout(processNextField, 300);
      }, 500);
    } else {
      // If field element is not available, skip to next
      currentIndex++;
      setTimeout(processNextField, 100);
    }
  }
  
  // Start processing fields
  setTimeout(processNextField, 500);
  
  return { success: true, fieldsFilledCount: filledCount };
}

// Fill a specific field based on its characteristics and profile data
function fillField(fieldElement, fieldInfo, profile) {
  // Determine what value to use based on field characteristics
  const valueToUse = determineValueToUse(fieldInfo, profile);
  
  if (!valueToUse) {
    // No matching value found for this field
    return false;
  }
  
  try {
    // Handle different input types
    if (fieldInfo.tag === 'input') {
      switch (fieldInfo.type) {
        case 'text':
        case 'email':
        case 'tel':
        case 'url':
        case 'search':
          fieldElement.value = valueToUse;
          break;
          
        case 'checkbox':
          // Only check if the value matches
          if (typeof valueToUse === 'boolean') {
            fieldElement.checked = valueToUse;
          } else {
            // Try to determine if should be checked
            fieldElement.checked = valueToUse === fieldElement.value;
          }
          break;
          
        case 'radio':
          // Only select if the value matches
          if (fieldElement.value === valueToUse || 
              (Array.isArray(valueToUse) && valueToUse.includes(fieldElement.value))) {
            fieldElement.checked = true;
          }
          break;
          
        case 'date':
          // Handle date fields
          if (valueToUse instanceof Date) {
            const dateString = valueToUse.toISOString().split('T')[0];
            fieldElement.value = dateString;
          } else if (typeof valueToUse === 'string') {
            // Try to format the date string
            fieldElement.value = valueToUse;
          }
          break;
          
        default:
          fieldElement.value = valueToUse;
      }
    } else if (fieldInfo.tag === 'textarea') {
      fieldElement.value = valueToUse;
    } else if (fieldInfo.tag === 'select') {
      // Try to find a matching option
      const options = fieldElement.options;
      let matched = false;
      
      // If valueToUse is an array, try each value
      const valuesToTry = Array.isArray(valueToUse) ? valueToUse : [valueToUse];
      
      for (const value of valuesToTry) {
        // Try exact match
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          if (option.value === value || option.text === value) {
            fieldElement.selectedIndex = i;
            matched = true;
            break;
          }
        }
        
        if (matched) break;
        
        // Try case-insensitive match
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          if (option.value.toLowerCase() === value.toLowerCase() || 
              option.text.toLowerCase() === value.toLowerCase()) {
            fieldElement.selectedIndex = i;
            matched = true;
            break;
          }
        }
        
        if (matched) break;
        
        // Try partial match
        for (let i = 0; i < options.length; i++) {
          const option = options[i];
          if (option.value.toLowerCase().includes(value.toLowerCase()) || 
              option.text.toLowerCase().includes(value.toLowerCase())) {
            fieldElement.selectedIndex = i;
            matched = true;
            break;
          }
        }
        
        if (matched) break;
      }
      
      if (!matched) {
        return false;
      }
    }
    
    // Trigger change event to notify the form
    fieldElement.dispatchEvent(new Event('input', { bubbles: true }));
    fieldElement.dispatchEvent(new Event('change', { bubbles: true }));
    
    return true;
  } catch (error) {
    console.error('Error filling field:', error);
    return false;
  }
}

// Determine what value to use for a field based on profile data
function determineValueToUse(fieldInfo, profile) {
  const { id = '', name = '', label = '', placeholder = '' } = fieldInfo;
  
  // Lowercase identifiers for case-insensitive matching
  const identifiers = [
    id.toLowerCase(),
    name.toLowerCase(),
    label.toLowerCase(),
    placeholder.toLowerCase()
  ];
  
  // Personal information
  if (identifiers.some(id => id.includes('first') && id.includes('name'))) {
    return profile.personal?.firstName || '';
  }
  
  if (identifiers.some(id => id.includes('last') && id.includes('name'))) {
    return profile.personal?.lastName || '';
  }
  
  if (identifiers.some(id => (id.includes('full') || id === 'name') && id.includes('name'))) {
    return `${profile.personal?.firstName || ''} ${profile.personal?.lastName || ''}`.trim();
  }
  
  if (identifiers.some(id => id.includes('email'))) {
    return profile.personal?.email || '';
  }
  
  if (identifiers.some(id => id.includes('phone') || id.includes('tel'))) {
    return profile.personal?.phone || '';
  }
  
  if (identifiers.some(id => id.includes('address') && !id.includes('email'))) {
    return profile.personal?.address || '';
  }
  
  if (identifiers.some(id => id.includes('linkedin'))) {
    return profile.personal?.linkedin || '';
  }
  
  if (identifiers.some(id => id.includes('website') || id.includes('site') || id.includes('portfolio'))) {
    return profile.personal?.website || '';
  }
  
  // Education
  if (identifiers.some(id => id.includes('school') || id.includes('university') || id.includes('college'))) {
    return profile.education?.[0]?.school || '';
  }
  
  if (identifiers.some(id => id.includes('degree'))) {
    return profile.education?.[0]?.degree || '';
  }
  
  if (identifiers.some(id => id.includes('field') || id.includes('major'))) {
    return profile.education?.[0]?.fieldOfStudy || '';
  }
  
  if (identifiers.some(id => id.includes('gpa'))) {
    return profile.education?.[0]?.gpa || '';
  }
  
  if (identifiers.some(id => id.includes('edu') && id.includes('start'))) {
    return profile.education?.[0]?.startDate || '';
  }
  
  if (identifiers.some(id => id.includes('edu') && id.includes('end'))) {
    return profile.education?.[0]?.endDate || '';
  }
  
  // Work Experience
  if (identifiers.some(id => id.includes('company') || id.includes('employer'))) {
    return profile.workExperience?.[0]?.company || '';
  }
  
  if (identifiers.some(id => id.includes('job') || id.includes('position') || id.includes('title'))) {
    return profile.workExperience?.[0]?.position || '';
  }
  
  if (identifiers.some(id => id.includes('work') && id.includes('start'))) {
    return profile.workExperience?.[0]?.startDate || '';
  }
  
  if (identifiers.some(id => id.includes('work') && id.includes('end'))) {
    return profile.workExperience?.[0]?.endDate || '';
  }
  
  if (identifiers.some(id => id.includes('description') || id.includes('resp') || id.includes('duties'))) {
    return profile.workExperience?.[0]?.description || '';
  }
  
  // Skills
  if (identifiers.some(id => id.includes('skill'))) {
    return profile.skills?.join(', ') || '';
  }
  
  // Languages
  if (identifiers.some(id => id.includes('language'))) {
    return profile.languages?.join(', ') || '';
  }
  
  // Generic fallbacks based on field type
  if (fieldInfo.type === 'email') {
    return profile.personal?.email || '';
  }
  
  if (fieldInfo.type === 'tel') {
    return profile.personal?.phone || '';
  }
  
  // No match found
  return null;
} 