const client = require('../lib/client');
// import our seed data:
const saved_locationsData = require('./saved_locations.js');
const usersData = require('./users.js');
const notesData = require('./notes.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      saved_locationsData.map(saved_location => {
        return client.query(`
                    INSERT INTO saved_locations (city, state, lat, lon, user_id)
                    VALUES ($1, $2, $3, $4, $5);
                `,
        [saved_location.city, saved_location.state, saved_location.lat, saved_location.lon, user.id]);
      })
    );

    await Promise.all(
      notesData.map(notes => {
        return client.query(`
                    INSERT INTO notes (user_id, lat, lon, city, date, title, body, wish)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
                `,
        [user.id, notes.lat, notes.lon, notes.city, notes.date, notes.title, notes.body, notes.wish]);
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
