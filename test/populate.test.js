const request = require('supertest');
const assert = require('assert');
const path = require('path');
const fs = require('fs').promises;
const app = require('../index');
const { Game } = require('../models');

describe('POST /api/games/populate', () => {
  // Clean up the database before and after each test
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
    assert.strictEqual(response.body.count, 10); // 5 Android games + 5 iOS games

    // Verify the games were actually created in the database
    const games = await request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect(200);

    assert.strictEqual(games.body.length, 10);

    // Verify Android games
    const androidGames = games.body.filter((game) => game.platform === 'android');
    assert.strictEqual(androidGames.length, 5);
    assert(androidGames.some((game) => game.name === 'PUBG Mobile'));
    assert(androidGames.some((game) => game.name === 'Candy Crush Saga'));

    // Verify iOS games
    const iosGames = games.body.filter((game) => game.platform === 'ios');
    assert.strictEqual(iosGames.length, 5);
    assert(iosGames.some((game) => game.name === 'Roblox'));
    assert(iosGames.some((game) => game.name === 'Minecraft'));
  });

  it('should handle invalid JSON data gracefully', async () => {
    // Temporarily modify the Android JSON file to be invalid
    const androidPath = path.join(__dirname, '..', 'data', 'android.top100.json');
    const originalContent = await fs.readFile(androidPath, 'utf8');
    try {
      await fs.writeFile(androidPath, '{ invalid json }');

      const response = await request(app)
        .post('/api/games/populate')
        .set('Accept', 'application/json')
        .expect('Content-Type', /json/)
        .expect(500);

      assert(response.body.error);
      assert(response.body.details);
    } finally {
      // Restore the original content
      await fs.writeFile(androidPath, originalContent);
    }
  });

  it('should not create duplicate games when run multiple times', async () => {
    // First population
    await request(app)
      .post('/api/games/populate')
      .set('Accept', 'application/json')
      .expect(200);

    // Get count after first population
    const firstCount = (await request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect(200)).body.length;

    // Second population
    await request(app)
      .post('/api/games/populate')
      .set('Accept', 'application/json')
      .expect(200);

    // Get count after second population
    const secondCount = (await request(app)
      .get('/api/games')
      .set('Accept', 'application/json')
      .expect(200)).body.length;

    // Verify counts are equal
    assert.strictEqual(firstCount, secondCount);
  });
});
