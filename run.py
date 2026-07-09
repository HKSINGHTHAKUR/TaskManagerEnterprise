import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask, render_template, redirect, url_for, request, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_wtf import CSRFProtect

from backend.config import Config
from backend.models import db, Manager, Task

app = Flask(__name__)
app.config.from_object(Config)

db.init_app(app)
bcrypt = Bcrypt(app)
csrf = CSRFProtect(app)
CORS(app, supports_credentials=True, origins=Config.CORS_ORIGINS)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login_page'
login_manager.login_message = None

@login_manager.user_loader
def load_user(user_id):
    return Manager.query.get(int(user_id))

def seed_admin():
    with app.app_context():
        db.create_all()
        if not Manager.query.filter_by(username='admin').first():
            admin = Manager(
                username='admin',
                password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
                full_name='General Manager',
                role='superadmin'
            )
            db.session.add(admin)
            db.session.commit()
        if not Manager.query.filter_by(username='manager').first():
            mgr = Manager(
                username='manager',
                password_hash=bcrypt.generate_password_hash('mgr123').decode('utf-8'),
                full_name='Operations Manager',
                role='manager'
            )
            db.session.add(mgr)
            db.session.commit()

seed_admin()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/login', methods=['POST'])
def api_login():
    data = request.get_json()
    if not data:
        return jsonify({'success': False, 'message': 'Invalid request'}), 400

    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'success': False, 'message': 'Username and password required'}), 400

    manager = Manager.query.filter_by(username=username).first()
    if not manager or not bcrypt.check_password_hash(manager.password_hash, password):
        return jsonify({'success': False, 'message': 'Invalid credentials'}), 401

    login_user(manager, remember=True)
    return jsonify({
        'success': True,
        'message': f'Welcome, {manager.full_name}',
        'user': {
            'id': manager.id,
            'username': manager.username,
            'full_name': manager.full_name,
            'role': manager.role
        }
    })

@app.route('/api/logout', methods=['POST'])
@login_required
def api_logout():
    logout_user()
    return jsonify({'success': True, 'message': 'Logged out'})

@app.route('/api/session', methods=['GET'])
@login_required
def api_session():
    return jsonify({
        'success': True,
        'user': {
            'id': current_user.id,
            'username': current_user.username,
            'full_name': current_user.full_name,
            'role': current_user.role
        }
    })

@app.route('/api/tasks', methods=['GET'])
@login_required
def api_get_tasks():
    filter_status = request.args.get('filter', 'all')
    query = Task.query.order_by(Task.created_at.desc())

    if filter_status == 'completed':
        query = query.filter_by(completed=True)
    elif filter_status == 'pending':
        query = query.filter_by(completed=False)

    tasks = query.all()
    return jsonify({'success': True, 'tasks': [t.to_dict() for t in tasks]})

@app.route('/api/tasks', methods=['POST'])
@login_required
def api_create_task():
    data = request.get_json()
    if not data or not data.get('title', '').strip():
        return jsonify({'success': False, 'message': 'Task title is required'}), 400

    task = Task(
        title=data['title'].strip(),
        completed=bool(data.get('completed', False)),
        employee_id=data.get('employee_id', '').strip(),
        employee_name=data.get('employee_name', '').strip(),
        created_by=current_user.id
    )
    db.session.add(task)
    db.session.commit()
    return jsonify({'success': True, 'task': task.to_dict()}), 201

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def api_update_task(task_id):
    task = Task.query.get_or_404(task_id)
    data = request.get_json() or {}

    if 'title' in data and data['title'].strip():
        task.title = data['title'].strip()
    if 'completed' in data:
        task.completed = bool(data['completed'])
    if 'employee_id' in data:
        task.employee_id = data['employee_id'].strip()
    if 'employee_name' in data:
        task.employee_name = data['employee_name'].strip()

    db.session.commit()
    return jsonify({'success': True, 'task': task.to_dict()})

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def api_delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    db.session.delete(task)
    db.session.commit()
    return jsonify({'success': True, 'message': 'Task deleted'})

@app.route('/api/tasks/<int:task_id>/toggle', methods=['PUT'])
@login_required
def api_toggle_task(task_id):
    task = Task.query.get_or_404(task_id)
    task.completed = not task.completed
    db.session.commit()
    return jsonify({'success': True, 'task': task.to_dict()})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
