# TaskManager Enterprise

A professional, high-performance task management application designed for corporate managers to assign, track, and toggle task completion status for employees.

**Live Demo**: [https://task-manager-enterprise-alpha.vercel.app/](https://task-manager-enterprise-alpha.vercel.app/)

---

## Key Features

- **Dynamic Task Assignment**: Assign tasks with specific **Employee IDs** and **Employee Names**.
- **Interactive Controls**: Instant task toggling ("Completed" / "Not Completed") and deletion.
- **Premium User Interface**: Modern dark mode with custom status badges, alerts, and responsive grid layouts.
- **Dynamic Database Fallback**: Attempts MySQL connection using `.env` credentials, with a automatic local SQLite fallback (`taskmanager.db`) if MySQL is offline.
- **Vercel Deployable**: Pre-configured with serverless functions and dynamic database path redirection (`/tmp`) for stateless deployment.

---

## Authentication Credentials

To access the Manager Dashboard, use the following pre-seeded credentials:

| Role | Username | Password |
| :--- | :--- | :--- |
| **Superadmin** | `admin` | `admin123` |
| **Manager** | `manager` | `mgr123` |

---

## Local Setup

### 1. Prerequisites
Ensure you have **Python 3.8+** installed.

### 2. Installation
Clone the repository and install the dependencies:
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory (optional if using the SQLite fallback):
```ini
SECRET_KEY=task-mgr-enterprise-9f8a7b6c5d4e3f2a1b0c
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=
MYSQL_DB=taskmanager_enterprise
CORS_ORIGINS=http://localhost:5000
```

### 4. Running the App
Start the Flask development server:
```bash
python run.py
```
Open [http://localhost:5000](http://localhost:5000) in your web browser.

---

## Vercel Deployment

This project is configured for one-click deployment on [Vercel](https://vercel.com):
1. Connect this repository to your Vercel account.
2. Vercel will automatically detect `vercel.json` and build the serverless functions.
3. Once deployed, the SQLite database is automatically written to `/tmp/taskmanager.db` to prevent read-only filesystem errors.