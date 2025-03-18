// JobAutofill Safari Extension Content Script

// Main function to handle autofill
function autofillJobApplication(userData) {
    console.log("JobAutofill: Starting autofill process");
    
    try {
        // Extract user data
        const personal = userData.personal || {};
        const employment = userData.employment || [];
        const education = userData.education || [];
        
        // Autofill personal information
        autofillPersonalInfo(personal);
        
        // Autofill most recent employment (if available)
        if (employment.length > 0) {
            autofillEmployment(employment[0]);
        }
        
        // Autofill most recent education (if available)
        if (education.length > 0) {
            autofillEducation(education[0]);
        }
        
        // Show success message
        showAutofillNotification("JobAutofill: Form fields have been filled automatically.");
        
        console.log("JobAutofill: Autofill process completed");
    } catch (error) {
        console.error("JobAutofill Error:", error);
        showAutofillNotification("JobAutofill: An error occurred while filling the form.");
    }
}

// Function to autofill personal information
function autofillPersonalInfo(personal) {
    console.log("JobAutofill: Filling personal information");
    
    // Common field mappings for personal information
    const fieldMappings = {
        // Name fields
        firstName: ["first_name", "firstname", "first-name", "fname", "given-name", "givenname"],
        lastName: ["last_name", "lastname", "last-name", "lname", "family-name", "familyname", "surname"],
        fullName: ["full_name", "fullname", "full-name", "name"],
        
        // Contact fields
        email: ["email", "email_address", "emailaddress", "email-address"],
        phone: ["phone", "phone_number", "phonenumber", "phone-number", "mobile", "cell", "telephone"],
        
        // Address fields
        address: ["address", "street_address", "streetaddress", "street-address", "addr", "street"],
        city: ["city", "town"],
        state: ["state", "province", "region"],
        zipCode: ["zip", "zip_code", "zipcode", "zip-code", "postal_code", "postalcode", "postal-code"],
        
        // Online presence
        linkedInUrl: ["linkedin", "linkedin_url", "linkedinurl", "linkedin-url"],
        personalWebsite: ["website", "personal_website", "personalwebsite", "personal-website", "web_site", "web-site"]
    };
    
    // Fill form fields based on mappings
    for (const [dataKey, fieldNames] of Object.entries(fieldMappings)) {
        if (personal[dataKey]) {
            fillMatchingFields(fieldNames, personal[dataKey]);
        }
    }
    
    // Handle professional summary / cover letter fields
    if (personal.professionalSummary) {
        const summaryFields = ["summary", "professional_summary", "cover_letter", "coverletter", "cover-letter", "about", "about_me", "aboutme", "about-me", "bio", "biography"];
        fillMatchingFields(summaryFields, personal.professionalSummary);
    }
}

// Function to autofill employment information
function autofillEmployment(employment) {
    console.log("JobAutofill: Filling employment information");
    
    // Common field mappings for employment
    const fieldMappings = {
        jobTitle: ["job_title", "jobtitle", "job-title", "position", "title", "role"],
        company: ["company", "company_name", "companyname", "company-name", "employer", "organization"],
        startDate: ["start_date", "startdate", "start-date", "employment_start", "employment-start", "job_start", "job-start"],
        endDate: ["end_date", "enddate", "end-date", "employment_end", "employment-end", "job_end", "job-end"],
        location: ["job_location", "joblocation", "job-location", "employment_location", "employment-location", "work_location", "work-location"],
        responsibilities: ["responsibilities", "job_description", "jobdescription", "job-description", "duties", "achievements", "accomplishments"]
    };
    
    // Fill form fields based on mappings
    for (const [dataKey, fieldNames] of Object.entries(fieldMappings)) {
        if (employment[dataKey]) {
            fillMatchingFields(fieldNames, employment[dataKey]);
        }
    }
    
    // Handle current job checkbox
    if (employment.isCurrentJob) {
        const currentJobFields = ["current_job", "currentjob", "current-job", "present_job", "presentjob", "present-job", "current_position", "current-position", "current_employer", "current-employer"];
        fillMatchingCheckboxes(currentJobFields, true);
    }
}

// Function to autofill education information
function autofillEducation(education) {
    console.log("JobAutofill: Filling education information");
    
    // Common field mappings for education
    const fieldMappings = {
        degree: ["degree", "degree_type", "degreetype", "degree-type", "qualification"],
        fieldOfStudy: ["field_of_study", "fieldofstudy", "field-of-study", "major", "course", "program", "subject"],
        institution: ["institution", "school", "university", "college", "education_institution", "education-institution"],
        startDate: ["education_start_date", "educationstartdate", "education-start-date", "school_start", "school-start"],
        endDate: ["education_end_date", "educationenddate", "education-end-date", "school_end", "school-end", "graduation_date", "graduationdate", "graduation-date"],
        location: ["school_location", "schoollocation", "school-location", "education_location", "education-location"],
        gpa: ["gpa", "grade_point_average", "gradepointaverage", "grade-point-average", "grades"],
        achievements: ["education_achievements", "educationachievements", "education-achievements", "academic_achievements", "academic-achievements", "honors", "awards"]
    };
    
    // Fill form fields based on mappings
    for (const [dataKey, fieldNames] of Object.entries(fieldMappings)) {
        if (education[dataKey]) {
            fillMatchingFields(fieldNames, education[dataKey]);
        }
    }
    
    // Handle current education checkbox
    if (education.isCurrentEducation) {
        const currentEducationFields = ["current_education", "currenteducation", "current-education", "present_education", "present-education", "current_student", "current-student"];
        fillMatchingCheckboxes(currentEducationFields, true);
    }
}

// Helper function to fill matching fields
function fillMatchingFields(fieldNames, value) {
    // Try exact matches first
    let filled = false;
    
    // Check for input fields
    for (const fieldName of fieldNames) {
        // Try by name attribute
        const inputsByName = document.querySelectorAll(`input[name*="${fieldName}"], textarea[name*="${fieldName}"]`);
        for (const input of inputsByName) {
            if (isVisibleElement(input) && !isReadOnly(input)) {
                input.value = value;
                triggerInputEvent(input);
                filled = true;
            }
        }
        
        // Try by id attribute
        const inputsById = document.querySelectorAll(`input[id*="${fieldName}"], textarea[id*="${fieldName}"]`);
        for (const input of inputsById) {
            if (isVisibleElement(input) && !isReadOnly(input)) {
                input.value = value;
                triggerInputEvent(input);
                filled = true;
            }
        }
        
        // Try by placeholder attribute
        const inputsByPlaceholder = document.querySelectorAll(`input[placeholder*="${fieldName}"], textarea[placeholder*="${fieldName}"]`);
        for (const input of inputsByPlaceholder) {
            if (isVisibleElement(input) && !isReadOnly(input)) {
                input.value = value;
                triggerInputEvent(input);
                filled = true;
            }
        }
    }
    
    // If no exact matches, try fuzzy matching with labels
    if (!filled) {
        const labels = document.querySelectorAll('label');
        for (const label of labels) {
            const labelText = label.textContent.toLowerCase();
            
            // Check if label text contains any of the field names
            if (fieldNames.some(fieldName => labelText.includes(fieldName.toLowerCase().replace('_', ' ').replace('-', ' ')))) {
                // Find the associated input
                let input = null;
                
                // Try using 'for' attribute
                if (label.htmlFor) {
                    input = document.getElementById(label.htmlFor);
                }
                
                // If no input found, try finding inputs inside the label
                if (!input) {
                    input = label.querySelector('input, textarea');
                }
                
                // If input found, fill it
                if (input && isVisibleElement(input) && !isReadOnly(input)) {
                    input.value = value;
                    triggerInputEvent(input);
                    filled = true;
                }
            }
        }
    }
    
    return filled;
}

// Helper function to fill matching checkboxes
function fillMatchingCheckboxes(fieldNames, checked) {
    for (const fieldName of fieldNames) {
        // Try by name attribute
        const checkboxesByName = document.querySelectorAll(`input[type="checkbox"][name*="${fieldName}"]`);
        for (const checkbox of checkboxesByName) {
            if (isVisibleElement(checkbox) && !isReadOnly(checkbox)) {
                checkbox.checked = checked;
                triggerInputEvent(checkbox);
            }
        }
        
        // Try by id attribute
        const checkboxesById = document.querySelectorAll(`input[type="checkbox"][id*="${fieldName}"]`);
        for (const checkbox of checkboxesById) {
            if (isVisibleElement(checkbox) && !isReadOnly(checkbox)) {
                checkbox.checked = checked;
                triggerInputEvent(checkbox);
            }
        }
    }
}

// Helper function to check if an element is visible
function isVisibleElement(element) {
    return !!(element.offsetWidth || element.offsetHeight || element.getClientRects().length);
}

// Helper function to check if an element is read-only
function isReadOnly(element) {
    return element.readOnly || element.disabled;
}

// Helper function to trigger input events
function triggerInputEvent(element) {
    // Trigger input event
    const inputEvent = new Event('input', { bubbles: true });
    element.dispatchEvent(inputEvent);
    
    // Trigger change event
    const changeEvent = new Event('change', { bubbles: true });
    element.dispatchEvent(changeEvent);
}

// Helper function to show notification
function showAutofillNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.position = 'fixed';
    notification.style.top = '20px';
    notification.style.left = '50%';
    notification.style.transform = 'translateX(-50%)';
    notification.style.backgroundColor = '#4CAF50';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '9999';
    notification.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 5000);
}

// Listen for messages from the Safari extension
browser.runtime.onMessage.addListener((message) => {
    if (message.action === 'autofill' && message.userData) {
        autofillJobApplication(message.userData);
        return true;
    }
});

// Notify that the content script has loaded
console.log("JobAutofill: Content script loaded"); 