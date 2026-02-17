import MySQLdb

# Database connection parameters (update with your root credentials)
DB_HOST = '127.0.0.1'
DB_USER = 'root'
DB_PASSWORD = ''
DB_PORT = 3306
DB_NAME = 'cinema_db'

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
