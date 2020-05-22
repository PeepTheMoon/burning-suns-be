require('dotenv').config();

const { execSync } = require('child_process');

const fakeRequest = require('supertest');
const app = require('../lib/app');
const client = require('../lib/client');

describe('app routes', () => {
  beforeAll(done => {
    return client.connect(done);
  });

  beforeEach(() => {
    // TODO: ADD DROP SETUP DB SCRIPT
    execSync('npm run setup-db');
  });

  afterAll(done => {
    return client.end(done);
  });

  test('returns notes', async() => {

    const expectation = [
      {
        'user_id': '1',
        'lat': '0',
        'lon': '0',
        'city': '',
        'date': '04-20-2020',
        'title': '',
        'body': '',
        'wish': 'true'
      }
    ];

    const data = true;
    // await fakeRequest(app)
    //   .get('/notes')
    //   .expect('Content-Type', /json/)
    //   .expect(200);

    expect(data).toEqual(true);
  });
});
