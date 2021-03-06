const client = require('../lib/client');
const { getEmoji } = require('../lib/emoji.js');

// async/await needs to run in a function
run();

async function run() {

  try {
    // initiate connecting to db
    await client.connect();

    // run a query to create tables
    await client.query(`
                CREATE TABLE users (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(256) NOT NULL,
                    hash VARCHAR(512) NOT NULL
                );           
                CREATE TABLE saved_locations (
                    id SERIAL PRIMARY KEY NOT NULL,
                    city VARCHAR(256) NOT NULL,
                    state VARCHAR(256) NOT NULL,
                    lat VARCHAR(256) NOT NULL,
                    lon VARCHAR(256) NOT NULL,
                    user_id INTEGER NOT NULL REFERENCES users(id)
            );
                CREATE TABLE notes (
                    id SERIAL PRIMARY KEY NOT NULL,
                    user_id INTEGER NOT NULL REFERENCES users(id),
                    lat VARCHAR(256) NOT NULL,
                    lon VARCHAR(256) NOT NULL,
                    city VARCHAR(256) NOT NULL,
                    date VARCHAR(256) NOT NULL,
                    title VARCHAR(512) NOT NULL,
                    body VARCHAR(1000) NOT NULL,
                    wish BOOLEAN NOT NULL
            );
        `);

    console.log('create tables complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    // problem? let's see the error...
    console.log(err);
  }
  finally {
    // success or failure, need to close the db connection
    client.end();
  }

}
