CREATE DATABASE IF NOT EXISTS taskmanager_enterprise;
USE taskmanager_enterprise;

CREATE TABLE managers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('manager', 'superadmin') DEFAULT 'manager',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE tasks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    completed TINYINT(1) DEFAULT 0,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES managers(id) ON DELETE CASCADE
);

-- Default 'admin' and 'manager' accounts are seeded automatically by run.py (seed_admin())
-- with properly generated bcrypt hashes. Do not insert placeholder rows here — a row
-- inserted with an invalid hash would block seed_admin() from ever fixing it, since it
-- only seeds a username if it doesn't already exist.
