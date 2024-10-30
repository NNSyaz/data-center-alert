window.onload = function() {
    // Auto-refresh every 5 seconds
    setInterval(fetchSensorData, 5000);

    // Manual refresh
    document.getElementById('refresh').addEventListener('click', fetchSensorData);

    // Fetch sensor data on page load
    fetchSensorData();
};

// Function to fetch data from the Flask API
function fetchSensorData() {
    fetch('/data/latest')
    .then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok: ' + response.statusText);
        }
        return response.json();
    })
    .then(data => {
        const currentTimestamp = new Date().toISOString();
        
        // Update Gauges and Charts
        updateGauges(data.co2, data.humidity, data.temperature);
        updateLineCharts(data.co2, data.humidity, data.temperature, currentTimestamp);

        // Display Alerts
        const alertContainer = document.getElementById('alert-container');
        alertContainer.innerHTML = "";  // Clear previous alerts
        if (data.alerts && data.alerts.length > 0) {
            data.alerts.forEach(alert => {
                const alertMsg = document.createElement('p');
                alertMsg.textContent = alert;
                alertContainer.appendChild(alertMsg);
            });
        }
    })
    .catch(error => console.error('Error fetching data:', error));
}


// Functions to create and update the gauges
function createGauge(id, label, min, max) {
    return new Chart(document.getElementById(id), {
        type: 'doughnut',
        data: {
            labels: [label],
            datasets: [{
                data: [0, 100], // Placeholder data
                backgroundColor: ['#00ffcc', '#ccc'],
                borderWidth: 1
            }]
        },
        options: {
            rotation: Math.PI,

            responsive: true,
        }
    });
}

// Initialize Gauges
let co2Gauge = createGauge('co2Gauge', 'CO2 (ppm)', 0, 1000);
let humidityGauge = createGauge('humidityGauge', 'Humidity (%)', 0, 100);
let temperatureGauge = createGauge('temperatureGauge', 'Temperature (°C)', 0, 40);

function updateGauges(co2, humidity, temperature) {
    // Define color thresholds
    const co2Color = co2 > 800 ? '#ff4d4d' : co2 > 400 ? '#ffc107' : '#00ffcc';
    const humidityColor = humidity > 70 ? '#ff4d4d' : humidity > 40 ? '#ffc107' : '#00ffcc';
    const temperatureColor = temperature > 27 ? '#ff4d4d' : temperature > 19 ? '#ffc107' : '#00ffcc';
    // Clamp values to prevent exceeding gauge limits
    co2 = Math.min(co2, 1000);
    humidity = Math.min(humidity, 100);
    temperature = Math.min(temperature, 40);

 // Update CO2 gauge with color threshold
    co2Gauge.data.datasets[0].data = [co2, 1000 - co2];
    co2Gauge.data.datasets[0].backgroundColor = [co2Color, '#1f1f1f'];

    // Update humidity gauge with color threshold
    humidityGauge.data.datasets[0].data = [humidity, 100 - humidity];
    humidityGauge.data.datasets[0].backgroundColor = [humidityColor, '#1f1f1f'];

    // Update temperature gauge with color threshold
    temperatureGauge.data.datasets[0].data = [temperature, 50 - temperature];
    temperatureGauge.data.datasets[0].backgroundColor = [temperatureColor, '#1f1f1f'];
    
    co2Gauge.update();
    humidityGauge.update();
    temperatureGauge.update();
}

// Functions to create and update line charts
function createLineChart(id, label) {
    return new Chart(document.getElementById(id), {
        type: 'line',
        data: {
            labels: [], // Placeholder for timestamps
            datasets: [{
                label: label,
                data: [],
                borderColor: '#00ffcc',
                fill: false,
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time', // Use time scale
                    time: {
                        unit: 'minute', // You can change this to 'hour', 'day', etc., based on your needs
                        tooltipFormat: 'll HH:mm', // Tooltip format
                        displayFormats: {
                            minute: 'HH:mm',
                            hour: 'MMM D HH:mm',
                            day: 'MMM D'
                        }
                    },
                    title: {
                        display: true,
                        text: 'Timestamp'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Sensor Data'
                    }
                }
            }
        }
    });
}

// Initialize Line Charts
let co2Chart = createLineChart('co2Chart', 'CO2 (ppm)');
let humidityChart = createLineChart('humidityChart', 'Humidity (%)');
let temperatureChart = createLineChart('temperatureChart', 'Temperature (°C)');

function updateLineCharts(co2, humidity, temperature, timestamp) {
    // Use the provided timestamp (current timestamp)
    const formattedTimestamp = new Date(timestamp).toISOString(); // Format timestamp for Chart.js

    co2Chart.data.labels.push(formattedTimestamp);
    humidityChart.data.labels.push(formattedTimestamp);
    temperatureChart.data.labels.push(formattedTimestamp);

    co2Chart.data.datasets[0].data.push(co2);
    humidityChart.data.datasets[0].data.push(humidity);
    temperatureChart.data.datasets[0].data.push(temperature);

    // Limit the number of points displayed if needed (e.g., keep the last 50)
    const maxPoints = 50;
    if (co2Chart.data.labels.length > maxPoints) {
        co2Chart.data.labels.shift(); // Remove the oldest label
        co2Chart.data.datasets[0].data.shift(); // Remove the oldest data point
    }
    if (humidityChart.data.labels.length > maxPoints) {
        humidityChart.data.labels.shift();
        humidityChart.data.datasets[0].data.shift();
    }
    if (temperatureChart.data.labels.length > maxPoints) {
        temperatureChart.data.labels.shift();
        temperatureChart.data.datasets[0].data.shift();
    }

    co2Chart.update();
    humidityChart.update();
    temperatureChart.update();
}

// Basic Authentication for the login form
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    let username = document.getElementById('username').value;
    let password = document.getElementById('password').value;

    // Basic authentication check (hardcoded credentials for demo purposes)
    if (username === 'admin' && password === 'password') {
        document.getElementById('login-container').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
    } else {
        alert('Invalid credentials, try again.');
    }
});

// Fetch previous data and display in the table
function fetchHistoricalData() {
    fetch('/data/history') // Adjust endpoint to match your Flask route
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('table-body');
            tableBody.innerHTML = ''; // Clear previous table rows

            // Populate table rows with data
            data.forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${new Date(entry.timestamp).toLocaleString()}</td>
                    <td>${entry.co2}</td>
                    <td>${entry.humidity}</td>
                    <td>${entry.temperature}</td>
                `;
                tableBody.appendChild(row);
            });
        })
        .catch(error => console.error('Error fetching historical data:', error));
}

// Call fetchHistoricalData on page load and set interval for updates
window.onload = function() {
    fetchSensorData();
    fetchHistoricalData(); // Fetch data for the table on load
    setInterval(fetchSensorData, 5000); // Refresh sensor data every 5 seconds
    setInterval(fetchHistoricalData, 60000); // Refresh historical data every 60 seconds
};
