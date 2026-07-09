(function () {
    'use strict';

    const DOM = {
        loginView: document.getElementById('loginView'),
        dashboardView: document.getElementById('dashboardView'),
        loginForm: document.getElementById('loginForm'),
        username: document.getElementById('username'),
        password: document.getElementById('password'),
        loginBtn: document.getElementById('loginBtn'),
        loginError: document.getElementById('loginError'),
        logoutBtn: document.getElementById('logoutBtn'),
        greeting: document.getElementById('greeting'),
        userBadge: document.getElementById('userBadge'),
        taskForm: document.getElementById('taskForm'),
        taskInput: document.getElementById('taskInput'),
        employeeId: document.getElementById('employeeId'),
        employeeName: document.getElementById('employeeName'),
        taskStatus: document.getElementById('taskStatus'),
        formFeedback: document.getElementById('formFeedback'),
        editTaskId: document.getElementById('editTaskId'),
        taskBtnLabel: document.getElementById('taskBtnLabel'),
        taskSubmitBtn: document.getElementById('taskSubmitBtn'),
        tasksList: document.getElementById('tasksList'),
        tasksEmpty: document.getElementById('tasksEmpty'),
        taskFilter: document.getElementById('taskFilter'),
        statTotal: document.getElementById('statTotal'),
        statCompleted: document.getElementById('statCompleted'),
        statPending: document.getElementById('statPending'),
        tasksContainer: document.getElementById('tasksContainer')
    };

    let currentUser = null;
    let tasks = [];
    const csrfToken = document.querySelector('meta[name="csrf-token"]').content;

    function showView(view) {
        DOM.loginView.classList.remove('active');
        DOM.dashboardView.classList.remove('active');
        view.classList.add('active');
    }

    function getGreeting() {
        var h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 18) return 'Good afternoon';
        return 'Good evening';
    }

    function setLoading(btn, loading) {
        if (loading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }

    function showError(msg) {
        DOM.loginError.textContent = msg;
    }

    async function apiRequest(url, options) {
        try {
            var res = await fetch(url, {
                credentials: 'same-origin',
                headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
                ...options
            });
            var data = await res.json();
            if (!res.ok && !data.success) {
                throw new Error(data.message || 'Request failed');
            }
            return data;
        } catch (e) {
            if (e.name === 'TypeError' && e.message.includes('fetch')) {
                throw new Error('Connection refused. Is the server running?');
            }
            throw e;
        }
    }

    async function loadTasks() {
        var filter = DOM.taskFilter.value;
        var data = await apiRequest('/api/tasks?filter=' + filter);
        tasks = data.tasks || [];
        renderTasks();
    }

    function renderTasks() {
        DOM.tasksList.innerHTML = '';

        if (tasks.length === 0) {
            DOM.tasksEmpty.style.display = 'flex';
            return;
        }

        DOM.tasksEmpty.style.display = 'none';

        var total = tasks.length;
        var completed = tasks.filter(function (t) { return t.completed; }).length;
        var pending = total - completed;

        DOM.statTotal.textContent = total;
        DOM.statCompleted.textContent = completed;
        DOM.statPending.textContent = pending;

        tasks.forEach(function (task) {
            var item = document.createElement('div');
            item.className = 'task-item';

            // TASK ID
            var taskIdSpan = document.createElement('span');
            taskIdSpan.className = 'col-task-id';
            taskIdSpan.textContent = task.id;

            // EMP ID
            var empIdSpan = document.createElement('span');
            empIdSpan.className = 'col-emp-id';
            empIdSpan.textContent = task.employee_id || '—';

            // EMPLOYEE NAME
            var empNameSpan = document.createElement('span');
            empNameSpan.className = 'col-emp-name';
            empNameSpan.textContent = task.employee_name || '—';

            // TASK TITLE
            var title = document.createElement('span');
            title.className = 'col-task-title' + (task.completed ? ' completed' : '');
            title.textContent = task.title;
            // Allow clicking the task title to edit it
            title.style.cursor = 'pointer';
            title.addEventListener('click', function () {
                startEdit(task);
            });

            // STATUS
            var status = document.createElement('span');
            status.className = 'col-status';
            var statusBadge = document.createElement('span');
            statusBadge.className = 'status-badge ' + (task.completed ? 'completed' : 'pending');
            statusBadge.textContent = task.completed ? 'Completed' : 'Not Completed';
            status.appendChild(statusBadge);

            // TOGGLE ACTION
            var toggleCell = document.createElement('span');
            toggleCell.className = 'col-toggle';
            var toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn-toggle-action';
            toggleBtn.textContent = task.completed ? 'Mark as Not Completed' : 'Mark as Completed';
            toggleBtn.addEventListener('click', function () {
                toggleTask(task.id);
            });
            toggleCell.appendChild(toggleBtn);

            // DELETE ACTION
            var actionCell = document.createElement('span');
            actionCell.className = 'col-action';
            var delBtn = document.createElement('button');
            delBtn.className = 'btn-delete-action';
            delBtn.textContent = 'Delete';
            delBtn.addEventListener('click', function () {
                deleteTask(task.id);
            });
            actionCell.appendChild(delBtn);

            item.appendChild(taskIdSpan);
            item.appendChild(empIdSpan);
            item.appendChild(empNameSpan);
            item.appendChild(title);
            item.appendChild(status);
            item.appendChild(toggleCell);
            item.appendChild(actionCell);
            
            DOM.tasksList.appendChild(item);
        });
    }

    async function toggleTask(id) {
        await apiRequest('/api/tasks/' + id + '/toggle', { method: 'PUT', body: '{}' });
        await loadTasks();
    }

    async function deleteTask(id) {
        await apiRequest('/api/tasks/' + id, { method: 'DELETE' });
        await loadTasks();
    }

    function startEdit(task) {
        DOM.employeeId.value = task.employee_id || '';
        DOM.employeeName.value = task.employee_name || '';
        DOM.taskInput.value = task.title || '';
        DOM.taskStatus.value = task.completed ? 'true' : 'false';
        DOM.editTaskId.value = task.id;
        DOM.taskBtnLabel.textContent = 'Submit';
        DOM.employeeId.focus();
    }

    function cancelEdit() {
        DOM.employeeId.value = '';
        DOM.employeeName.value = '';
        DOM.taskInput.value = '';
        DOM.taskStatus.value = '';
        DOM.editTaskId.value = '';
        DOM.taskBtnLabel.textContent = 'Submit';
        if (DOM.formFeedback) {
            DOM.formFeedback.textContent = '';
            DOM.formFeedback.className = 'form-feedback';
        }
    }

    async function checkSession() {
        try {
            var data = await apiRequest('/api/session');
            if (data.success && data.user) {
                currentUser = data.user;
                enterDashboard();
            }
        } catch (_) {}
    }

    DOM.loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        showError('');
        setLoading(DOM.loginBtn, true);

        try {
            var data = await apiRequest('/api/login', {
                method: 'POST',
                body: JSON.stringify({
                    username: DOM.username.value.trim(),
                    password: DOM.password.value
                })
            });

            if (data.success) {
                currentUser = data.user;
                enterDashboard();
            } else {
                showError(data.message || 'Authentication failed');
            }
        } catch (err) {
            showError(err.message || 'Connection error');
        } finally {
            setLoading(DOM.loginBtn, false);
        }
    });

    function enterDashboard() {
        DOM.greeting.textContent = getGreeting() + ', ' + currentUser.full_name + '.';
        DOM.userBadge.textContent = currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1);
        showView(DOM.dashboardView);
        DOM.username.value = '';
        DOM.password.value = '';
        showError('');
        cancelEdit();
        loadTasks();
    }

    DOM.logoutBtn.addEventListener('click', async function () {
        await apiRequest('/api/logout', { method: 'POST' });
        currentUser = null;
        tasks = [];
        DOM.tasksList.innerHTML = '';
        showView(DOM.loginView);
    });

    DOM.taskForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        var employee_id = DOM.employeeId.value.trim();
        var employee_name = DOM.employeeName.value.trim();
        var title = DOM.taskInput.value;
        var completed = DOM.taskStatus.value === 'true';

        if (!employee_id || !employee_name || !title) return;

        var editId = DOM.editTaskId.value;

        try {
            if (editId) {
                await apiRequest('/api/tasks/' + editId, {
                    method: 'PUT',
                    body: JSON.stringify({
                        employee_id: employee_id,
                        employee_name: employee_name,
                        title: title,
                        completed: completed
                    })
                });
                cancelEdit();
            } else {
                await apiRequest('/api/tasks', {
                    method: 'POST',
                    body: JSON.stringify({
                        employee_id: employee_id,
                        employee_name: employee_name,
                        title: title,
                        completed: completed
                    })
                });
                DOM.employeeId.value = '';
                DOM.employeeName.value = '';
                DOM.taskInput.value = '';
                DOM.taskStatus.value = '';
            }
            
            // Show success feedback
            DOM.formFeedback.className = 'form-feedback success';
            DOM.formFeedback.textContent = 'Task submitted successfully — status: ' + (completed ? 'Completed' : 'Not Completed');
            
            setTimeout(function() {
                DOM.formFeedback.textContent = '';
                DOM.formFeedback.className = 'form-feedback';
            }, 5000);

            await loadTasks();
        } catch (err) {
            DOM.formFeedback.className = 'form-feedback error';
            DOM.formFeedback.textContent = err.message;
        }
    });

    DOM.taskFilter.addEventListener('change', function () {
        loadTasks();
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            cancelEdit();
        }
    });

    checkSession();

})();
