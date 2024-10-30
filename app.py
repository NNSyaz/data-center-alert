from flask import Flask, jsonify, render_template, request, redirect, url_for, session
import sqlite3
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'your_secret_key'  # Set a secret key for session management

# Dummy credentials for demo purposes
USERNAME = 'admin'
PASSWORD = 'password'

# Define thresholds
CO2_THRESHOLD = 1000  # example threshold for CO2 in ppm
HUMIDITY_THRESHOLD = 70  # example threshold for humidity in %
TEMPERATURE_THRESHOLD = 27  # example threshold for temperature in °C

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/data/latest')
def get_latest_data():
    try:
        conn = sqlite3.connect('SQLite/sensor.db')
        cursor = conn.cursor()
        cursor.execute("SELECT co2, humidity, temperature, timestamp FROM sensor_data ORDER BY timestamp DESC LIMIT 1")
        data = cursor.fetchone()

        if data:
            # Check for threshold violations
            alerts = []
            if data[0] > CO2_THRESHOLD:
                alerts.append("CO2 levels are too high!")
            if data[1] > HUMIDITY_THRESHOLD:
                alerts.append("Humidity is above safe limits!")
            if data[2] > TEMPERATURE_THRESHOLD:
                alerts.append("Temperature is too high!")

            response = {
                'co2': data[0],
                'humidity': data[1],
                'temperature': data[2],
                'timestamp': data[3],
                'alerts': alerts  # Include alerts in response
            }
            return jsonify(response)
        else:
            return jsonify({'error': 'No data found'}), 404
    except Exception as e:
        print(f"Error fetching data: {e}")
        return jsonify({'error': 'Internal Server Error'}), 500

@app.route('/data/history')
def get_data_history():
    conn = sqlite3.connect('sensor.db')
    cursor = conn.cursor()
    cursor.execute("SELECT timestamp, co2, humidity, temperature FROM sensor_data ORDER BY timestamp DESC LIMIT 10")
    rows = cursor.fetchall()
    conn.close()
    
    # Convert rows to dictionary format
    data = [{'timestamp': row[0], 'co2': row[1], 'humidity': row[2], 'temperature': row[3]} for row in rows]
    return jsonify(data)

@app.route('/login', methods=['POST'])
def login():
    username = request.form.get('username')
    password = request.form.get('password')

    if username == USERNAME and password == PASSWORD:
        session['logged_in'] = True
        return redirect(url_for('dashboard'))
    else:
        return jsonify({'error': 'Invalid credentials'}), 403

@app.route('/dashboard')
def dashboard():
    if 'logged_in' in session:
        return render_template('dashboard.html')
    else:
        return redirect(url_for('index'))

@app.route('/logout')
def logout():
    session.pop('logged_in', None)
    return redirect(url_for('index'))

if __name__ == '__main__':
    app.run(debug=True)
