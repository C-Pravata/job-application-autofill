// Main JavaScript file for Job Application Autofill App

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    initTooltips();
    
    // Initialize custom file inputs
    initCustomFileInputs();
    
    // Initialize form validation
    initFormValidation();
    
    // Add event listeners for current job/education checkboxes
    initCurrentStatusCheckboxes();
    
    // Add animation to dashboard cards
    initDashboardCards();
});

// Initialize Bootstrap tooltips
function initTooltips() {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function(tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl);
    });
}

// Initialize custom file inputs to show selected filename
function initCustomFileInputs() {
    document.querySelectorAll('.custom-file-input').forEach(function(input) {
        input.addEventListener('change', function() {
            if (this.files.length > 0) {
                const fileName = this.files[0].name;
                const label = this.nextElementSibling;
                label.textContent = fileName;
            }
        });
    });
}

// Initialize form validation
function initFormValidation() {
    // Add the 'was-validated' class to forms on submit
    document.querySelectorAll('form').forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        });
    });
}

// Initialize current job/education checkboxes
function initCurrentStatusCheckboxes() {
    // Handle current job checkbox
    const currentJobCheckbox = document.getElementById('current_job');
    if (currentJobCheckbox) {
        currentJobCheckbox.addEventListener('change', function() {
            const endDateField = document.getElementById('end_date');
            if (endDateField) {
                endDateField.disabled = this.checked;
                if (this.checked) {
                    endDateField.value = '';
                }
            }
        });
    }
    
    // Handle current education checkbox
    const currentEducationCheckbox = document.getElementById('current_education');
    if (currentEducationCheckbox) {
        currentEducationCheckbox.addEventListener('change', function() {
            const endDateField = document.getElementById('end_date');
            if (endDateField) {
                endDateField.disabled = this.checked;
                if (this.checked) {
                    endDateField.value = '';
                }
            }
        });
    }
}

// Add animation to dashboard cards
function initDashboardCards() {
    document.querySelectorAll('.card').forEach(function(card) {
        card.classList.add('dashboard-card');
    });
}

// Function to confirm deletion
function confirmDelete(message) {
    return confirm(message || 'Are you sure you want to delete this item?');
}

// Function to preview uploaded resume/document
function previewDocument(fileUrl, fileName) {
    // Create modal for document preview
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'documentPreviewModal';
    modal.setAttribute('tabindex', '-1');
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-labelledby', 'documentPreviewModalLabel');
    modal.setAttribute('aria-hidden', 'true');
    
    modal.innerHTML = `
        <div class="modal-dialog modal-lg" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="documentPreviewModalLabel">${fileName}</h5>
                    <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                        <span aria-hidden="true">&times;</span>
                    </button>
                </div>
                <div class="modal-body">
                    <iframe src="${fileUrl}" width="100%" height="500px" frameborder="0"></iframe>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
                    <a href="${fileUrl}" download="${fileName}" class="btn btn-primary">Download</a>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    $('#documentPreviewModal').modal('show');
    
    // Remove modal from DOM after it's hidden
    $('#documentPreviewModal').on('hidden.bs.modal', function() {
        document.body.removeChild(modal);
    });
} 