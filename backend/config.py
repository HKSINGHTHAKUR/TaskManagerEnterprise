import os
from dotenv import load_dotenv
import pymysql

load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env'))

def get_database_uri():
    mysql_user = os.getenv('MYSQL_USER', 'root')
    mysql_password = os.getenv('MYSQL_PASSWORD', '')
    mysql_host = os.getenv('MYSQL_HOST', 'localhost')
    try:
        mysql_port = int(os.getenv('MYSQL_PORT', '3306'))
    except ValueError:
        mysql_port = 3306
    mysql_db = os.getenv('MYSQL_DB', 'taskmanager_enterprise')
    
    try:
        # Check connection
        conn = pymysql.connect(
            host=mysql_host,
            port=mysql_port,
            user=mysql_user,
            password=mysql_password,
            connect_timeout=2
        )
        conn.close()
        return f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}"
    except Exception as e:
        # Fallback to local sqlite database
        if os.getenv('VERCEL'):
            db_path = '/tmp/taskmanager.db'
        else:
            db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'taskmanager.db')
        return f"sqlite:///{db_path}"

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'fallback-secret-key')
    SQLALCHEMY_DATABASE_URI = get_database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv('CORS_ORIGINS', 'http://localhost:5000').split(',')
        if origin.strip()
    ]

