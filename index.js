// index.js
const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;
const cache = new NodeCache({ stdTTL: 600 }); // Cache data for 10 minutes

const fetchWeather = async (endpoint, params) => {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const baseUrl = `https://api.openweathermap.org/data/2.5/${endpoint}`;
  const cacheKey = JSON.stringify(params);
  
  if (cache.has(cacheKey)) return cache.get(cacheKey);
  
  try {
    const response = await axios.get(baseUrl, { params: { ...params, appid: apiKey, units: 'metric' } });
    cache.set(cacheKey, response.data);
    return response.data;
  } catch (error) {
    console.error('Error fetching weather data:', error.message);
    throw error;
  }
};

// Current Weather by City Name
app.get('/weather', async (req, res) => {
  try {
    const location = req.query.location || 'London';
    const data = await fetchWeather('weather', { q: location });
    res.json({
      location: data.name,
      temperature: data.main.temp,
      description: data.weather[0].description,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch weather data.' });
  }
});

// 7-Day Forecast
app.get('/forecast', async (req, res) => {
  try {
    const location = req.query.location || 'London';
    const data = await fetchWeather('forecast/daily', { q: location, cnt: 7 });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch forecast data.' });
  }
});

// UV Index & Air Quality
app.get('/air-quality', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;
    if (!lat || !lon) return res.status(400).json({ error: 'Latitude and Longitude required' });
    const data = await fetchWeather('air_pollution', { lat, lon });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch air quality data.' });
  }
});

// Weather by GPS Coordinates
app.get('/weather-coords', async (req, res) => {
  try {
    const lat = req.query.lat;
    const lon = req.query.lon;
    if (!lat || !lon) return res.status(400).json({ error: 'Latitude and Longitude required' });
    const data = await fetchWeather('weather', { lat, lon });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch weather data.' });
  }
});

// Multi-City Weather
app.get('/batch-weather', async (req, res) => {
  try {
    const locations = req.query.locations?.split(',');
    if (!locations || locations.length === 0) return res.status(400).json({ error: 'Locations required' });
    const weatherData = await Promise.all(locations.map(location => fetchWeather('weather', { q: location })));
    res.json(weatherData);
  } catch (error) {
    res.status(500).json({ error: 'Unable to fetch batch weather data.' });
  }
});

app.listen(port, () => {
  console.log(`Weather API is running on port ${port}`);
});
