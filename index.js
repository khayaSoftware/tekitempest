// index.js

// Import required modules
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Ensure the OpenWeatherMap API key is set
if (!process.env.OPENWEATHERMAP_API_KEY) {
  console.error("Error: OPENWEATHERMAP_API_KEY is not set in .env file");
  process.exit(1);
}

// Health check endpoint
app.get('/', (req, res) => {
    res.json({ status: 'ok' });
});

/**
 * Fetch current weather data from OpenWeatherMap for a given location.
 * @param {string} location - The city name.
 * @returns {Object} - Weather data.
 */
const fetchCurrentWeather = async (location) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${location}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    // Detailed error handling
    if (error.response) {
      // API returned an error response
      throw new Error(`OpenWeatherMap API error: ${error.response.data.message}`);
    } else if (error.request) {
      throw new Error("No response received from OpenWeatherMap API");
    } else {
      throw new Error("Error fetching current weather: " + error.message);
    }
  }
};

/**
 * Fetch 5-day weather forecast data from OpenWeatherMap for a given location.
 * @param {string} location - The city name.
 * @returns {Object} - Forecast data.
 */
const fetchWeatherForecast = async (location) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${location}&appid=${apiKey}&units=metric`;

  try {
    const response = await axios.get(url);
    return response.data;
  } catch (error) {
    // Detailed error handling
    if (error.response) {
      throw new Error(`OpenWeatherMap API error: ${error.response.data.message}`);
    } else if (error.request) {
      throw new Error("No response received from OpenWeatherMap API");
    } else {
      throw new Error("Error fetching forecast: " + error.message);
    }
  }
};

/**
 * GET /weather
 * Returns current weather data for a specified location.
 * Query Parameter: location (default: London)
 */
app.get('/weather', async (req, res) => {
  const location = req.query.location || 'London';
  try {
    const data = await fetchCurrentWeather(location);
    res.json({
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /forecast
 * Returns 5-day weather forecast data for a specified location.
 * Query Parameter: location (default: London)
 */
app.get('/forecast', async (req, res) => {
  const location = req.query.location || 'London';
  try {
    const data = await fetchWeatherForecast(location);
    res.json({
      city: data.city,
      forecasts: data.list, // Array of forecast objects
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /details
 * Returns both current weather and forecast data for a specified location.
 * Query Parameter: location (default: London)
 */
app.get('/details', async (req, res) => {
  const location = req.query.location || 'London';
  try {
    const [currentData, forecastData] = await Promise.all([
      fetchCurrentWeather(location),
      fetchWeatherForecast(location)
    ]);
    res.json({
      current: {
        location: currentData.name,
        temperature: currentData.main.temp,
        description: currentData.weather[0].description,
        humidity: currentData.main.humidity,
        windSpeed: currentData.wind.speed,
      },
      forecast: {
        city: forecastData.city,
        forecasts: forecastData.list,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Global Error Handling Middleware (optional)
 */
app.use((err, req, res, next) => {
  console.error('Global error:', err.stack);
  res.status(500).send('Something went wrong!');
});

// Start the server
app.listen(port, () => {
  console.log(`TekiTempest API is running on port ${port}`);
});
