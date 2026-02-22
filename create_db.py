import os

import MySQLdb


# Database connection parameters (can be overridden with env vars)
# Use the same variables as Django settings:
# DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
DB_HOST = os.environ.get('DB_HOST', '127.0.0.1')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_PORT = int(os.environ.get('DB_PORT', '3306'))
DB_NAME = os.environ.get('DB_NAME', 'cinema_db')

try:
    # Connect to MySQL server without specifying a database
    connection = MySQLdb.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        port=DB_PORT
    )
    cursor = connection.cursor()

    # Check if database exists
    cursor.execute("SHOW DATABASES LIKE %s", (DB_NAME,))
    result = cursor.fetchone()

    if result:
        print(f"Database '{DB_NAME}' already exists.")
    else:
        # Create the database
        cursor.execute(f"CREATE DATABASE {DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        print(f"Database '{DB_NAME}' created successfully.")

    cursor.close()
    connection.close()
except MySQLdb.Error as e:
    print(f"Error: {e}")
