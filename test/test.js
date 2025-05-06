const request = require('supertest');
const assert = require('assert');
const app = require('../index');

/**
 * Testing create game endpoint
 */
describe('POST /api/games', () => {
  const data = {
    publisherId: '1234567890',
    name: 'Test App',
    platform: 'ios',
    storeId: '1234',
    bundleId: 'test.bundle.id',
    appVersion: '1.0.0',
    isPublished: true,
  };
  it('respond with 200 and an object that matches what we created', (done) => {
    request(app)
      .post('/api/games')
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.publisherId, '1234567890');
        assert.strictEqual(result.body.name, 'Test App');
        assert.strictEqual(result.body.platform, 'ios');
        assert.strictEqual(result.body.storeId, '1234');
        assert.strictEqual(result.body.bundleId, 'test.bundle.id');
        assert.strictEqual(result.body.appVersion, '1.0.0');
        assert.strictEqual(result.body.isPublished, true);
        done();
      });
  });
});

/**
 * Testing get all games endpoint
 */
describe('GET /api/games', () => {
  it('respond with json containing a list that includes the game we just created', (done) => {
    request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body[0].publisherId, '1234567890');
        assert.strictEqual(result.body[0].name, 'Test App');
        assert.strictEqual(result.body[0].platform, 'ios');
        assert.strictEqual(result.body[0].storeId, '1234');
        assert.strictEqual(result.body[0].bundleId, 'test.bundle.id');
        assert.strictEqual(result.body[0].appVersion, '1.0.0');
        assert.strictEqual(result.body[0].isPublished, true);
        done();
      });
  });
});

/**
 * Testing update game endpoint
 */
describe('PUT /api/games/1', () => {
  const data = {
    id: 1,
    publisherId: '999000999',
    name: 'Test App Updated',
    platform: 'android',
    storeId: '5678',
    bundleId: 'test.newBundle.id',
    appVersion: '1.0.1',
    isPublished: false,
  };
  it('respond with 200 and an updated object', (done) => {
    request(app)
      .put('/api/games/1')
      .send(data)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.publisherId, '999000999');
        assert.strictEqual(result.body.name, 'Test App Updated');
        assert.strictEqual(result.body.platform, 'android');
        assert.strictEqual(result.body.storeId, '5678');
        assert.strictEqual(result.body.bundleId, 'test.newBundle.id');
        assert.strictEqual(result.body.appVersion, '1.0.1');
        assert.strictEqual(result.body.isPublished, false);
        done();
      });
  });
});

/**
 * Testing delete game endpoint
 */
describe('DELETE /api/games/1', () => {
  it('respond with 200', (done) => {
    request(app)
      .delete('/api/games/1')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err) => {
        if (err) return done(err);
        done();
      });
  });
});

/**
 * Testing get all games endpoint after deletion
 */
describe('GET /api/games', () => {
  it('respond with json containing no games', (done) => {
    request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.length, 0);
        done();
      });
  });
});

/**
 * Testing search games endpoint
 */
describe('POST /api/games/search', () => {
  // First create some test data
  before((done) => {
    const testGames = [
      {
        publisherId: '1234567890',
        name: 'Test Game 1',
        platform: 'ios',
        storeId: '1234',
        bundleId: 'test.bundle.id1',
        appVersion: '1.0.0',
        isPublished: true,
      },
      {
        publisherId: '1234567890',
        name: 'Test Game 2',
        platform: 'android',
        storeId: '5678',
        bundleId: 'test.bundle.id2',
        appVersion: '1.0.0',
        isPublished: true,
      },
      {
        publisherId: '1234567890',
        name: 'Ios Game',
        platform: 'ios',
        storeId: '9012',
        bundleId: 'test.bundle.id3',
        appVersion: '1.0.0',
        isPublished: true,
      },
    ];

    // Create test games sequentially
    const createGames = testGames.reduce(
      (promiseChain, game) => promiseChain.then(() => request(app)
        .post('/api/games')
        .send(game)
        .set('Accept', 'application/json')),
      Promise.resolve(),
    );

    createGames.then(() => done()).catch(done);
  });

  it('should return all games when no search parameters are provided', (done) => {
    request(app)
      .post('/api/games/search')
      .send({})
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.length, 3);
        done();
      });
  });

  it('should return games matching the name search', (done) => {
    request(app)
      .post('/api/games/search')
      .send({ name: 'Test' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.length, 2);
        assert(result.body.every((game) => game.name.includes('Test')));
        done();
      });
  });

  it('should return games matching the platform search', (done) => {
    request(app)
      .post('/api/games/search')
      .send({ platform: 'ios' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.length, 2);
        assert(result.body.every((game) => game.platform === 'ios'));
        done();
      });
  });

  it('should return games matching both name and platform search', (done) => {
    request(app)
      .post('/api/games/search')
      .send({ name: 'Test', platform: 'ios' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.length, 1);
        assert.strictEqual(result.body[0].name, 'Test Game 1');
        assert.strictEqual(result.body[0].platform, 'ios');
        done();
      });
  });

  it('should return empty array when no matches found', (done) => {
    request(app)
      .post('/api/games/search')
      .send({ name: 'NonExistentGame' })
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.length, 0);
        done();
      });
  });
});
