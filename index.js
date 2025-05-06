const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs').promises;
const db = require('./models');

const app = express();

app.use(bodyParser.json());
app.use(express.static(`${__dirname}/static`));

app.get('/api/games', (req, res) => db.Game.findAll()
  .then((games) => res.send(games))
  .catch((err) => {
    console.log('There was an error querying games', JSON.stringify(err));
    return res.send(err);
  }));

app.post('/api/games', (req, res) => {
  const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
  return db.Game.create({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
    .then((game) => res.send(game))
    .catch((err) => {
      console.log('***There was an error creating a game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.delete('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      return game.destroy({ force: true })
        .then(() => res.send({ id }))
        .catch((err) => {
          console.log('***Error deleting game', JSON.stringify(err));
          return res.status(400).send(err);
        });
    })
    .catch((err) => {
      console.log('***Error finding game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.put('/api/games/:id', (req, res) => {
  // eslint-disable-next-line radix
  const id = parseInt(req.params.id);
  return db.Game.findByPk(id)
    .then((game) => {
      if (!game) {
        return res.status(404).json({ error: 'Game not found' });
      }
      const { publisherId, name, platform, storeId, bundleId, appVersion, isPublished } = req.body;
      return game.update({ publisherId, name, platform, storeId, bundleId, appVersion, isPublished })
        .then(() => res.send(game))
        .catch((err) => {
          console.log('***Error updating game', JSON.stringify(err));
          return res.status(400).send(err);
        });
    })
    .catch((err) => {
      console.log('***Error finding game', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.post('/api/games/search', (req, res) => {
  const { name, platform } = req.body;
  const whereClause = {};

  if (name) {
    whereClause.name = {
      [db.Sequelize.Op.like]: `%${name}%`,
    };
  }

  if (platform) {
    whereClause.platform = platform;
  }

  return db.Game.findAll({
    where: whereClause,
  })
    .then((games) => res.send(games))
    .catch((err) => {
      console.log('There was an error searching games', JSON.stringify(err));
      return res.status(400).send(err);
    });
});

app.post('/api/games/populate', async (req, res) => {
  try {
    let androidData;
    let iosData;
    try {
      androidData = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'android.top100.json'), 'utf8'));
      iosData = JSON.parse(await fs.readFile(path.join(__dirname, 'data', 'ios.top100.json'), 'utf8'));
    } catch (parseError) {
      return res.status(500).json({
        error: 'Failed to parse JSON data',
        details: parseError.message,
      });
    }

    const allGames = [...androidData.games, ...iosData.games];

    const gamesToCreate = allGames.map((game) => ({
      name: game.name,
      platform: game.platform,
      publisherId: game.publisherId,
      storeId: game.storeId,
      bundleId: game.bundleId,
      appVersion: game.appVersion,
      isPublished: true,
    }));

    const existingStoreIds = (await db.Game.findAll({
      where: {
        storeId: gamesToCreate.map((g) => g.storeId),
      },
      attributes: ['storeId'],
    })).map((g) => g.storeId);

    const newGames = gamesToCreate.filter((game) => !existingStoreIds.includes(game.storeId));

    const createdGames = await db.Game.bulkCreate(newGames);

    return res.json({
      message: 'Successfully populated games database',
      count: createdGames.length,
    });
  } catch (error) {
    console.error('Error populating games:', error);
    return res.status(500).json({
      error: 'Failed to populate games database',
    });
  }
});

app.listen(3000, () => {
  console.log('Server is up on port 3000');
});

module.exports = app;
