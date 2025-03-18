from flask import Flask, render_template, redirect, url_for, flash, request, session, send_from_directory, jsonify
from flask_bootstrap import Bootstrap
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
import os
from datetime import datetime
import json
from werkzeug.utils import secure_filename
import jinja2

# Create Flask application
app = Flask(__name__, instance_relative_config=True)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-key-for-testing')
app.config['UPLOAD_FOLDER'] = os.path.join(app.instance_path, 'uploads')
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload size

# Ensure the instance folder exists
try:
    os.makedirs(app.instance_path, exist_ok=True)
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
except OSError as e:
    print(f"Error creating directories: {e}")

# Initialize extensions
bootstrap = Bootstrap(app)
login_manager = LoginManager(app)
login_manager.login_view = 'login'

# Custom Jinja2 filters
@app.template_filter('nl2br')
def nl2br_filter(s):
    if s:
        return jinja2.utils.markupsafe.Markup(s.replace('\n', '<br>'))
    return s

# Mock user for demonstration purposes
class User(UserMixin):
    def __init__(self, id):
        self.id = id
        self.name = "User"
        self.password = "password"
        
    def get_id(self):
        return self.id
    
    def check_password(self, password):
        return self.password == password

@login_manager.user_loader
def load_user(user_id):
    return User(user_id)

# Helper functions for session data
def init_session_data():
    """Initialize session data if it doesn't exist"""
    if 'personal_info' not in session:
        session['personal_info'] = {}
    if 'employment_history' not in session:
        session['employment_history'] = []
    if 'education' not in session:
        session['education'] = []
    if 'documents' not in session:
        session['documents'] = {'resumes': [], 'cover_letters': []}
    if 'recent_applications' not in session:
        session['recent_applications'] = []

def get_profile_completion():
    """Calculate profile completion percentage and section status"""
    init_session_data()
    
    sections = {
        'personal_info': {'weight': 25, 'completed': 0, 'status': 'Not started'},
        'employment': {'weight': 25, 'completed': 0, 'status': 'Not started'},
        'education': {'weight': 25, 'completed': 0, 'status': 'Not started'},
        'documents': {'weight': 25, 'completed': 0, 'status': 'Not started'}
    }
    
    # Check personal info completion
    if session['personal_info']:
        required_fields = ['first_name', 'last_name', 'email', 'phone']
        filled_required = sum(1 for field in required_fields if field in session['personal_info'] and session['personal_info'][field])
        
        if filled_required == len(required_fields):
            sections['personal_info']['completed'] = 25
            sections['personal_info']['status'] = 'Complete'
        elif filled_required > 0:
            sections['personal_info']['completed'] = int((filled_required / len(required_fields)) * 25)
            sections['personal_info']['status'] = 'In progress'
    
    # Check employment history completion
    if session['employment_history']:
        employment_count = len(session['employment_history'])
        if employment_count >= 1:
            sections['employment']['completed'] = 25
            sections['employment']['status'] = 'Complete'
        else:
            sections['employment']['completed'] = 0
            sections['employment']['status'] = 'Not started'
    
    # Check education completion
    if session['education']:
        if len(session['education']) >= 1:
            sections['education']['completed'] = 25
            sections['education']['status'] = 'Complete'
        else:
            sections['education']['completed'] = 15
            sections['education']['status'] = 'In progress'
    
    # Check documents completion
    has_resume = len(session['documents']['resumes']) > 0
    has_cover_letter = len(session['documents']['cover_letters']) > 0
    
    if has_resume and has_cover_letter:
        sections['documents']['completed'] = 25
        sections['documents']['status'] = 'Complete'
    elif has_resume or has_cover_letter:
        sections['documents']['completed'] = 15
        sections['documents']['status'] = 'In progress'
    
    # Calculate total completion percentage
    total_completion = sum(section['completed'] for section in sections.values())
    
    return {
        'percentage': total_completion,
        'sections': sections
    }

# Routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        
        # Simple mock authentication
        if username == "user" and password == "password":
            user = User(username)
            login_user(user)
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password', 'danger')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out.', 'info')
    return redirect(url_for('index'))

@app.route('/dashboard')
@login_required
def dashboard():
    init_session_data()
    profile_data = get_profile_completion()
    
    # Get document status
    has_resume = len(session['documents']['resumes']) > 0
    has_cover_letter = len(session['documents']['cover_letters']) > 0
    
    # Get recent applications (limit to 3)
    recent_applications = session.get('recent_applications', [])
    if recent_applications:
        recent_applications = sorted(recent_applications, key=lambda x: x.get('date', ''), reverse=True)[:3]
    
    return render_template(
        'dashboard.html',
        completion_percentage=profile_data['percentage'],
        completion_sections=profile_data['sections'],
        has_resume=has_resume,
        has_cover_letter=has_cover_letter,
        recent_applications=recent_applications
    )

@app.route('/profile', methods=['GET', 'POST'])
@login_required
def profile():
    init_session_data()
    
    if request.method == 'POST':
        # Save personal info to session
        session['personal_info'] = {
            'first_name': request.form.get('first_name'),
            'last_name': request.form.get('last_name'),
            'email': request.form.get('email'),
            'phone': request.form.get('phone'),
            'address': request.form.get('address'),
            'city': request.form.get('city'),
            'state': request.form.get('state'),
            'zip': request.form.get('zip'),
            'linkedin': request.form.get('linkedin'),
            'website': request.form.get('website'),
            'summary': request.form.get('summary')
        }
        session.modified = True
        flash('Profile updated successfully!', 'success')
        
        # Check if the user clicked "Save and Continue"
        if 'continue' in request.form:
            return redirect(url_for('employment'))
        else:
            return redirect(url_for('dashboard'))
    
    return render_template('profile.html', personal_info=session.get('personal_info', {}))

@app.route('/employment', methods=['GET', 'POST'])
@login_required
def employment():
    init_session_data()
    
    if request.method == 'POST':
        # Add new employment entry
        new_job = {
            'job_title': request.form.get('job_title'),
            'company': request.form.get('company'),
            'start_date': request.form.get('start_date'),
            'end_date': request.form.get('end_date') if not request.form.get('current_job') else 'Present',
            'current_job': 'current_job' in request.form,
            'location': request.form.get('location'),
            'responsibilities': request.form.get('responsibilities'),
            'id': datetime.now().strftime('%Y%m%d%H%M%S')  # Simple ID for editing/deleting
        }
        
        session['employment_history'].append(new_job)
        session.modified = True
        flash('Employment history updated successfully!', 'success')
        return redirect(url_for('employment'))
    
    return render_template('employment.html', employment_history=session.get('employment_history', []))

@app.route('/delete_employment/<job_id>')
@login_required
def delete_employment(job_id):
    init_session_data()
    
    # Filter out the job with the given ID
    session['employment_history'] = [job for job in session['employment_history'] if job.get('id') != job_id]
    session.modified = True
    
    flash('Work experience deleted successfully!', 'success')
    return redirect(url_for('employment'))

@app.route('/edit_employment/<job_id>', methods=['GET', 'POST'])
@login_required
def edit_employment(job_id):
    init_session_data()
    
    # Find the job with the given ID
    job_to_edit = None
    for job in session['employment_history']:
        if job.get('id') == job_id:
            job_to_edit = job
            break
    
    if job_to_edit is None:
        flash('Job not found!', 'danger')
        return redirect(url_for('employment'))
    
    if request.method == 'POST':
        # Update job entry
        job_to_edit.update({
            'job_title': request.form.get('job_title'),
            'company': request.form.get('company'),
            'start_date': request.form.get('start_date'),
            'end_date': request.form.get('end_date') if not request.form.get('current_job') else 'Present',
            'current_job': 'current_job' in request.form,
            'location': request.form.get('location'),
            'responsibilities': request.form.get('responsibilities')
        })
        
        session.modified = True
        flash('Employment history updated successfully!', 'success')
        return redirect(url_for('employment'))
    
    return render_template('edit_employment.html', job=job_to_edit)

@app.route('/education', methods=['GET', 'POST'])
@login_required
def education():
    init_session_data()
    
    if request.method == 'POST':
        # Add new education entry
        new_education = {
            'degree': request.form.get('degree'),
            'field_of_study': request.form.get('field_of_study'),
            'institution': request.form.get('institution'),
            'start_date': request.form.get('start_date'),
            'end_date': request.form.get('end_date') if not request.form.get('current_education') else 'Present',
            'current_education': 'current_education' in request.form,
            'location': request.form.get('location'),
            'gpa': request.form.get('gpa'),
            'achievements': request.form.get('achievements'),
            'id': datetime.now().strftime('%Y%m%d%H%M%S')  # Simple ID for editing/deleting
        }
        
        session['education'].append(new_education)
        session.modified = True
        flash('Education history updated successfully!', 'success')
        return redirect(url_for('education'))
    
    return render_template('education.html', education_history=session.get('education', []))

@app.route('/delete_education/<edu_id>')
@login_required
def delete_education(edu_id):
    init_session_data()
    
    # Filter out the education entry with the given ID
    session['education'] = [edu for edu in session['education'] if edu.get('id') != edu_id]
    session.modified = True
    
    flash('Education entry deleted successfully!', 'success')
    return redirect(url_for('education'))

@app.route('/edit_education/<edu_id>', methods=['GET', 'POST'])
@login_required
def edit_education(edu_id):
    init_session_data()
    
    # Find the education entry with the given ID
    edu_to_edit = None
    for edu in session['education']:
        if edu.get('id') == edu_id:
            edu_to_edit = edu
            break
    
    if edu_to_edit is None:
        flash('Education entry not found!', 'danger')
        return redirect(url_for('education'))
    
    if request.method == 'POST':
        # Update education entry
        edu_to_edit.update({
            'degree': request.form.get('degree'),
            'field_of_study': request.form.get('field_of_study'),
            'institution': request.form.get('institution'),
            'start_date': request.form.get('start_date'),
            'end_date': request.form.get('end_date') if not request.form.get('current_education') else 'Present',
            'current_education': 'current_education' in request.form,
            'location': request.form.get('location'),
            'gpa': request.form.get('gpa'),
            'achievements': request.form.get('achievements')
        })
        
        session.modified = True
        flash('Education entry updated successfully!', 'success')
        return redirect(url_for('education'))
    
    return render_template('edit_education.html', edu=edu_to_edit)

@app.route('/documents', methods=['GET', 'POST'])
@login_required
def documents():
    init_session_data()
    
    if request.method == 'POST':
        # Handle resume upload
        if 'resume' in request.files:
            file = request.files['resume']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                saved_filename = f"resume_{timestamp}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
                file.save(file_path)
                
                # Save document info to session
                resume_info = {
                    'name': request.form.get('resume_name') or filename,
                    'filename': saved_filename,
                    'original_filename': filename,
                    'upload_date': datetime.now().strftime('%B %d, %Y'),
                    'id': timestamp
                }
                
                session['documents']['resumes'].append(resume_info)
                session.modified = True
                flash('Resume uploaded successfully!', 'success')
                return redirect(url_for('documents'))
        
        # Handle cover letter upload
        if 'cover_letter' in request.files:
            file = request.files['cover_letter']
            if file and file.filename != '':
                filename = secure_filename(file.filename)
                timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
                saved_filename = f"cover_letter_{timestamp}_{filename}"
                file_path = os.path.join(app.config['UPLOAD_FOLDER'], saved_filename)
                file.save(file_path)
                
                # Save document info to session
                cover_letter_info = {
                    'name': request.form.get('cover_letter_name') or filename,
                    'filename': saved_filename,
                    'original_filename': filename,
                    'upload_date': datetime.now().strftime('%B %d, %Y'),
                    'id': timestamp
                }
                
                session['documents']['cover_letters'].append(cover_letter_info)
                session.modified = True
                flash('Cover letter uploaded successfully!', 'success')
                return redirect(url_for('documents'))
    
    return render_template(
        'documents.html',
        resumes=session['documents']['resumes'],
        cover_letters=session['documents']['cover_letters']
    )

@app.route('/delete_document/<doc_type>/<doc_id>')
@login_required
def delete_document(doc_type, doc_id):
    init_session_data()
    
    if doc_type == 'resume':
        # Find the document to delete
        for resume in session['documents']['resumes']:
            if resume.get('id') == doc_id:
                # Delete the file
                try:
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], resume['filename'])
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    print(f"Error deleting file: {e}")
                
                # Remove from session
                session['documents']['resumes'] = [r for r in session['documents']['resumes'] if r.get('id') != doc_id]
                session.modified = True
                break
        
        flash('Resume deleted successfully!', 'success')
    
    elif doc_type == 'cover_letter':
        # Find the document to delete
        for cover_letter in session['documents']['cover_letters']:
            if cover_letter.get('id') == doc_id:
                # Delete the file
                try:
                    file_path = os.path.join(app.config['UPLOAD_FOLDER'], cover_letter['filename'])
                    if os.path.exists(file_path):
                        os.remove(file_path)
                except Exception as e:
                    print(f"Error deleting file: {e}")
                
                # Remove from session
                session['documents']['cover_letters'] = [cl for cl in session['documents']['cover_letters'] if cl.get('id') != doc_id]
                session.modified = True
                break
        
        flash('Cover letter deleted successfully!', 'success')
    
    return redirect(url_for('documents'))

@app.route('/download_document/<filename>')
@login_required
def download_document(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename, as_attachment=True)

@app.route('/autofill', methods=['GET', 'POST'])
@login_required
def autofill():
    init_session_data()
    
    if request.args.get('job_url'):
        job_url = request.args.get('job_url')
        
        # Add to recent applications
        new_application = {
            'url': job_url,
            'date': datetime.now().strftime('%B %d, %Y'),
            'title': f"Job Application at {job_url.split('/')[2]}",
            'id': datetime.now().strftime('%Y%m%d%H%M%S')
        }
        
        session['recent_applications'].append(new_application)
        session.modified = True
        
        # Redirect to the perform_autofill route which will handle the actual autofill
        return redirect(url_for('perform_autofill', job_url=job_url))
    
    return render_template('autofill.html', recent_applications=session.get('recent_applications', []))

@app.route('/api/user_data')
@login_required
def user_data_api():
    """API endpoint to get user data for autofill purposes"""
    init_session_data()
    
    # Get user data
    data = {
        'personal': session.get('personal_info', {}),
        'employment': session.get('employment_history', []),
        'education': session.get('education', [])
    }
    
    return jsonify(data)

@app.route('/perform_autofill')
@login_required
def perform_autofill():
    init_session_data()
    job_url = request.args.get('job_url')
    
    if not job_url:
        flash('No job URL provided', 'danger')
        return redirect(url_for('autofill'))
    
    # Get user data for autofill
    personal_info = session.get('personal_info', {})
    employment_history = session.get('employment_history', [])
    education_history = session.get('education', [])
    
    # Add a flash message about the Safari extension simulation
    flash('To use the autofill feature, drag the "JobAutofill" button to your Safari bookmarks bar, then click it when you\'re on the job application page.', 'info')
    
    # Generate a unique session token for this autofill session
    autofill_token = datetime.now().strftime('%Y%m%d%H%M%S')
    session['autofill_token'] = autofill_token
    
    # Render the autofill page that will provide instructions for using the bookmarklet
    return render_template(
        'perform_autofill.html',
        job_url=job_url,
        personal_info=personal_info,
        employment_history=employment_history,
        education_history=education_history,
        autofill_token=autofill_token
    )

@app.route('/delete_application/<app_id>')
@login_required
def delete_application(app_id):
    init_session_data()
    
    # Filter out the application with the given ID
    session['recent_applications'] = [app for app in session['recent_applications'] if app.get('id') != app_id]
    session.modified = True
    
    flash('Application removed from history!', 'success')
    return redirect(url_for('autofill'))

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8080) 