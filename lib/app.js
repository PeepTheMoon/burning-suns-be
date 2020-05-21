const ensureAuth = require('./auth/ensure-auth');
const createAuthRoutes = require('./auth/create-auth-routes');
const authRoutes = createAuthRoutes();
const express = require('express');
const cors = require('cors');
const client = require('./client.js');
const app = express();
const request = require('superagent');

// setup authentication routes to give user an auth token
// creates a /auth/signin and a /auth/signup POST route. 
// each requires a POST body with a .email and a .password

app.use(cors()); 
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//Gets the NASA Astronomy Picture of the Day
app.get('/nasa', async(req, res) => {

  try {
    const response = await request.get(`https://api.nasa.gov/planetary/apod?api_key=${process.env.NASA_API_KEY}`);

    res.json(response.body);

  } catch(e) { 
    console.error(e);

    res.json(e);
  }
});

app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

//Gets the astronomical data from ipgeolocation based on user search request

//Tried testing this endpoint, but a passing test is virtually impossible due to the sun_altitude, sun_distance, sun_azimuth, moon_altitude, moon_distance, moon_azimuth and moon_parallactic_angle values being updated and changed every second.  All of the other values are consistent, however.  I have added a screenshot to the readme file as a reference.
app.get('/api/astro', async(req, res) => {

  try {
    const response = await request.get(`https://api.ipgeolocation.io/astronomy?apiKey=${process.env.IPGEOLOCATION_KEY}&lat=${req.query.lat}&long=${req.query.long}`);

    res.json(response.body);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Gets the location data from weatherstack based on user search request
app.get('/api/location/:city', async(req, res) => {

  try {
    const response = await request.get(`http://api.weatherstack.com/current?access_key=${process.env.WEATHERSTACK_KEY}&query=${req.params.city}`);

    res.json(response.body.location);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Gets the weather for a city 
app.get('/api/weather/:city', async(req, res) => {

  try {
    const response = await request.get(`http://api.weatherstack.com/forecast?access_key=${process.env.WEATHERSTACK_KEY}&query=${req.params.city}`);

    const forecast = response.body.forecast;
    const current = response.body.current;

    res.json({ current, forecast });

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Gets the logged in user's saved location data
app.get('/api/saved-locations', async(req, res) => {

  try {
    const data = await client.query(`
      SELECT saved_locations.city, saved_locations.state, saved_locations.lat, saved_locations.lon, saved_locations.user_id
      FROM saved_locations
      JOIN users
      ON saved_locations.user_id = users.id
      WHERE users.id=$1`, 
    [req.userId]);

    res.json(data.rows);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Posts a new saved location to the logged-in user's saved locations table
app.post('/api/saved-locations', async(req, res) => {
  try {
    const data = await client.query(`
      INSERT into saved_locations (city, state, lat, lon, user_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
  `, [req.body.city, req.body.state, req.body.lat, req.body.lon, req.userId]);

    res.json(data.rows);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Deletes all saved locations from the logged-in user's saved locations table
app.delete('/api/saved-locations', async(req, res) => {
  try {

    const data = await client.query(`
      DELETE FROM saved_locations
      WHERE city=$1 AND state=$2 AND user_id=$3
      RETURNING *;
  `, [req.body.city, req.body.state, req.userId]);

    res.json(data.rows);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Deletes one saved location from the logged-in user's saved locations table
app.delete('/api/saved-locations/:id', async(req, res) => {
  try {

    const data = await client.query(`
      DELETE FROM saved_locations
      WHERE id=$1 AND city=$2 AND state=$3 AND user_id=$4
      RETURNING *;
  `, [req.params.id, req.body.city, req.body.state, req.userId]);

    res.json(data.rows);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Gets the logged in user's notes data
app.get('/api/notes', async(req, res) => {

  try {
    const data = await client.query(`
      SELECT notes.user_id, notes.lat, notes.lon, notes.city, notes.date, notes.title, notes.body, notes.wish
      FROM notes
      JOIN users
      ON notes.user_id = users.id
      WHERE users.id=$1`, 
    [req.userId]);

    res.json(data.rows);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Gets ONE note from the logged in user's notes data
app.get('/api/note/:id', async(req, res) => {

  try {
    const data = await client.query(`
      SELECT notes.user_id, notes.lat, notes.lon, notes.city, notes.date, notes.title, notes.body, notes.wish
      FROM notes
      JOIN users
      ON notes.user_id = users.id
      WHERE users.id=$1
      AND notes.id=$1`, 
    [req.userId]);

    res.json(data.rows);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Posts a new note to the logged-in user's notes table
app.post('/api/notes', async(req, res) => {

  try {
    const data = await client.query(`
      INSERT into notes (user_id, lat, lon, city, date, title, body, wish)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
  `, [req.userId, req.body.lat, req.body.lon, req.body.city, req.body.date, req.body.title, req.body.body, req.body.wish]);

    res.json(data.rows);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//allows logged-in user to update a note
app.put('/api/notes/:id', async(req, res) => {

  try {
    const data = await client.query(`
      UPDATE notes
      SET date = $2,
          title = $3,
          body = $4,
          wish = $5
      WHERE id=$1 
      RETURNING *;
  `, [req.params.id, req.body.date, req.body.title, req.body.body, req.body.wish]);

    res.json(data.rows[0]);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

//Deletes a note from the logged-in user's notes table
app.delete('/api/notes/:id', async(req, res) => {

  try {
    const data = await client.query(`
      DELETE FROM notes
      WHERE id=$1
      RETURNING *;
  `, [req.params.id]);

    res.json(data.rows[0]);

  } catch(e) {
    console.error(e);

    res.json(e);
  }
});

app.use(require('./middleware/error'));

module.exports = app;
