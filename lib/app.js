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

app.use('/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api', ensureAuth);

// and now every request that has a token in the Authorization header will have a `req.userId` property for us to see who's talking
app.get('/api/test', (req, res) => {
  res.json({
    message: `in this proctected route, we get the user's id like so: ${req.userId}`
  });
});

app.get('/api/location/:city', async(req, res) => {

  const response = await request.get(`http://api.weatherstack.com/current?access_key=${process.env.WEATHERSTACK_KEY}&query=${req.params.city}`);

  res.json(response.body.location);
});

app.get('/api/weather/:city', async(req, res) => {
  const response = await request.get(`http://api.weatherstack.com/forecast?access_key=${process.env.WEATHERSTACK_KEY}&query=${req.params.city}`);

  const forecast = response.body.forecast;
  const current = response.body.current;

  res.json({ current, forecast });
});

app.get('/api/saved-locations', async(req, res) => {
  const data = await client.query(`
  SELECT saved_locations.city, saved_locations.state, saved_locations.lat, saved_locations.lon, saved_locations.user_id
  FROM saved_locations
  JOIN users
  ON saved_locations.user_id = users.id
  WHERE users.id=$1`, 
  [req.userId]);

  res.json(data.rows);
});

app.post('/api/saved-locations', async(req, res) => {
  const data = await client.query(`
    INSERT into saved_locations (city, state, lat, lon, city_id, user_id, date)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `, [req.body.city, req.body.state, req.body.lat, req.lon, req.body.city_id, req.body.user_id, req.body.date]);

  res.json(data.rows);
});

app.use(require('./middleware/error'));



module.exports = app;
