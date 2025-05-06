const request = require('supertest');
const assert = require('assert');
const app = require('../index');
const { Game } = require('../models');

// Clean up the database before and after each test suite
before(async () => {
  await Game.destroy({ where: {}, force: true });
});

after(async () => {
  await Game.destroy({ where: {}, force: true });
});

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
        return done();
      });
  });
});

/**
 * Testing get all games endpoint
 */
describe('GET /api/games', () => {
  before((done) => {
    request(app)
      .post('/api/games')
      .send({
        publisherId: '1234567890',
        name: 'Test App',
        platform: 'ios',
        storeId: '1234',
        bundleId: 'test.bundle.id',
        appVersion: '1.0.0',
        isPublished: true,
      })
      .set('Accept', 'application/json')
      .expect(200)
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });

  it('respond with json containing a list that includes the game we just created', (done) => {
    request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert(result.body && result.body.length > 0, 'Response body should not be empty');
        const game = result.body[0];
        assert.strictEqual(game.publisherId, '1234567890');
        assert.strictEqual(game.name, 'Test App');
        assert.strictEqual(game.platform, 'ios');
        assert.strictEqual(game.storeId, '1234');
        assert.strictEqual(game.bundleId, 'test.bundle.id');
        assert.strictEqual(game.appVersion, '1.0.0');
        assert.strictEqual(game.isPublished, true);
        return done();
      });
  });
});

/**
 * Testing update game endpoint
 */
describe('PUT /api/games/:id', () => {
  let gameId;

  before((done) => {
    request(app)
      .post('/api/games')
      .send({
        publisherId: '1234567890',
        name: 'Test App',
        platform: 'ios',
        storeId: '1234',
        bundleId: 'test.bundle.id',
        appVersion: '1.0.0',
        isPublished: true,
      })
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        gameId = res.body.id;
        return done();
      });
  });

  const data = {
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
      .put(`/api/games/${gameId}`)
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
        return done();
      });
  });
});

/**
 * Testing delete game endpoint
 */
describe('DELETE /api/games/:id', () => {
  let gameId;

  before((done) => {
    request(app)
      .post('/api/games')
      .send({
        publisherId: '1234567890',
        name: 'Test App',
        platform: 'ios',
        storeId: '1234',
        bundleId: 'test.bundle.id',
        appVersion: '1.0.0',
        isPublished: true,
      })
      .set('Accept', 'application/json')
      .expect(200)
      .end((err, res) => {
        if (err) return done(err);
        gameId = res.body.id;
        return done();
      });
  });

  it('respond with 200', (done) => {
    request(app)
      .delete(`/api/games/${gameId}`)
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err) => {
        if (err) return done(err);
        return done();
      });
  });
});

/**
 * Testing get all games endpoint after deletion
 */
describe('GET /api/games', () => {
  beforeEach(async () => {
    await Game.destroy({ where: {}, force: true });
  });

  it('respond with json containing no games', (done) => {
    request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200)
      .end((err, result) => {
        if (err) return done(err);
        assert.strictEqual(result.body.length, 0);
        return done();
      });
  });
});

/**
 * Testing search games endpoint
 */
describe('POST /api/games/search', () => {
  beforeEach(async () => {
    await Game.destroy({ where: {}, force: true });
  });

  afterEach(async () => {
    await Game.destroy({ where: {}, force: true });
  });

  // First create some test data
  beforeEach((done) => {
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
        .set('Accept', 'application/json')
        .expect(200)),
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
        return done();
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
        return done();
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
        return done();
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
        return done();
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
        return done();
      });
  });
});

describe('POST /api/games/populate', () => {
  beforeEach(async () => {
    await Game.destroy({ where: {}, force: true });
  });

  afterEach(async () => {
    await Game.destroy({ where: {}, force: true });
  });

  it('should successfully populate games from JSON files', async () => {
    const response = await request(app)
      .post('/api/games/populate')
      .set('Accept', 'application/json')
      .expect('Content-Type', /json/)
      .expect(200);

    assert.strictEqual(response.body.message, 'Successfully populated games database');
    assert.strictEqual(response.body.count, 10);

    const games = await request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect(200);

    assert.strictEqual(games.body.length, 10);

    const androidGames = games.body.filter((game) => game.platform === 'android');
    assert.strictEqual(androidGames.length, 5);
    assert(androidGames.some((game) => game.name === 'PUBG Mobile'));
    assert(androidGames.some((game) => game.name === 'Candy Crush Saga'));

    const iosGames = games.body.filter((game) => game.platform === 'ios');
    assert.strictEqual(iosGames.length, 5);
    assert(iosGames.some((game) => game.name === 'Roblox'));
    assert(iosGames.some((game) => game.name === 'Minecraft'));
  });

  it('should not create duplicate games when run multiple times', async () => {
    await request(app)
      .post('/api/games/populate')
      .set('Accept', 'application/json')
      .expect(200);

    const response = await request(app)
      .post('/api/games/populate')
      .set('Accept', 'application/json')
      .expect(200);

    assert.strictEqual(response.body.count, 0);

    const games = await request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect(200);

    assert.strictEqual(games.body.length, 10);
  });
});
