const client = require('../lib/client');
// import our seed data:
const saved_locationsData = require('./saved_locations.js');
const usersData = require('./users.js');
const journalsData = require('./journals.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash, display_name)
                      VALUES ($1, $2, $3)
                      RETURNING *;
                  `,
        [user.email, user.hash, user.display_name]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      saved_locationsData.map(saved_location => {
        return client.query(`
                    INSERT INTO saved_locations (city, state, lat, lon, city_id, user_id, date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7);
                `,
        [saved_location.city, saved_location.state, saved_location.lat, saved_location.lon, saved_location.city_id, user.id, saved_location.date]);
      })
    );

    await Promise.all(
      journalsData.map(journal => {
        return client.query(`
<<<<<<< HEAD
                    INSERT INTO journals (user_id, location_id, date, title, body)
                    VALUES ($1, $2, $3, $4, $5);
                `,
        [user.id, journal.location_id, journal.date, journal.title, journal.body]);
=======
                    INSERT INTO journals (user_id, lat, lon, date, title, body)
                    VALUES ($1, $2, $3, $4, $5, $6);
                `,
        [user.id, journal.lat, journal.lon, journal.date, journal.title, journal.body]);
>>>>>>> 248558d40c65ae31bd585abfbec804b83722b19e
      })
    );
    

    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
