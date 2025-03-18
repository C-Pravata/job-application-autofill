// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'ANALYZE_FORM':
      sendResponse(analyzeForm());
      break;
    case 'AUTOFILL_FORM':
      autofillForm(request.data);
      sendResponse({ success: true });
      break;
    default:
      sendResponse({ error: 'Unknown action' });
  }
  return true; // Keep the message channel open for async responses
});

// Analyze the form fields on the page
function analyzeForm() {
  const forms = document.forms;
  const fields = [];

  // If no forms found, look for input fields directly in the document
  if (forms.length === 0) {
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      if (isRelevantField(input)) {
        fields.push(extractFieldInfo(input));
      }
    });
    return fields;
  }

  // Process all forms
  Array.from(forms).forEach(form => {
    const formFields = form.querySelectorAll('input, select, textarea');
    formFields.forEach(field => {
      if (isRelevantField(field)) {
        fields.push(extractFieldInfo(field));
      }
    });
  });

  return fields;
}

// Check if the field is relevant for job applications
function isRelevantField(field) {
  // Exclude submit, button, hidden, and password fields
  if (field.type === 'submit' || 
      field.type === 'button' || 
      field.type === 'hidden' || 
      field.type === 'password') {
    return false;
  }

  // Exclude fields with no name or id
  if (!field.name && !field.id) {
    return false;
  }

  return true;
}

// Extract relevant information from a form field
function extractFieldInfo(field) {
  return {
    type: field.type,
    name: field.name,
    id: field.id,
    label: findFieldLabel(field),
    required: field.required,
    value: field.value,
    options: field.tagName.toLowerCase() === 'select' ? getSelectOptions(field) : null
  };
}

// Find the label associated with a form field
function findFieldLabel(field) {
  // Try to find an explicit label
  const labelFor = document.querySelector(`label[for="${field.id}"]`);
  if (labelFor) {
    return labelFor.textContent.trim();
  }

  // Try to find a parent label
  const parentLabel = field.closest('label');
  if (parentLabel) {
    return parentLabel.textContent.trim();
  }

  // Try to find aria-label
  if (field.getAttribute('aria-label')) {
    return field.getAttribute('aria-label');
  }

  // Try to find placeholder
  if (field.placeholder) {
    return field.placeholder;
  }

  // Use name or id as fallback
  return field.name || field.id;
}

// Get options from a select element
function getSelectOptions(select) {
  return Array.from(select.options).map(option => ({
    value: option.value,
    text: option.text
  }));
}

// Autofill the form with provided data
function autofillForm(data) {
  Object.entries(data).forEach(([fieldIdentifier, value]) => {
    // Try to find the field by id first, then by name
    const field = document.getElementById(fieldIdentifier) || 
                 document.querySelector(`[name="${fieldIdentifier}"]`);
    
    if (!field) return;

    // Handle different field types
    switch (field.tagName.toLowerCase()) {
      case 'select':
        autofillSelect(field, value);
        break;
      case 'textarea':
        field.value = value;
        triggerChange(field);
        break;
      case 'input':
        autofillInput(field, value);
        break;
    }
  });
}

// Autofill a select element
function autofillSelect(select, value) {
  const option = Array.from(select.options).find(opt => 
    opt.value.toLowerCase() === value.toLowerCase() ||
    opt.text.toLowerCase() === value.toLowerCase()
  );

  if (option) {
    select.value = option.value;
    triggerChange(select);
  }
}

// Autofill an input element
function autofillInput(input, value) {
  switch (input.type) {
    case 'checkbox':
      input.checked = Boolean(value);
      break;
    case 'radio':
      const radio = document.querySelector(`input[type="radio"][name="${input.name}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
      }
      break;
    default:
      input.value = value;
  }
  triggerChange(input);
}

// Trigger change event to notify the page of the value change
function triggerChange(element) {
  element.dispatchEvent(new Event('change', { bubbles: true }));
  element.dispatchEvent(new Event('input', { bubbles: true }));
} 