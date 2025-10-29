# db_connection_test.py
import mysql.connector

try:
    connection = mysql.connector.connect(
        host="localhost",
        user="root",           # or your MySQL username
        password="your_password",  # replace with your real password
        database="campus_eat"      # or whichever DB name you used
    )

    if connection.is_connected():
        print("✅ Database connection successful and ready for data insertion test.")
except Exception as e:
    print("❌ Database connection failed:", e)
finally:
    if 'connection' in locals() and connection.is_connected():
        connection.close()
