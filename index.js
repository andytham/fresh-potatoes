const sqlite = require('sqlite'),
      Sequelize = require('sequelize'),
      request = require('request'),
      express = require('express'),
      app = express();

const { PORT=3000, NODE_ENV='development', DB_PATH='./db/database.db' } = process.env;

// START SERVER
Promise.resolve()
  .then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`)))
  .catch((err) => { if (NODE_ENV === 'development') console.error(err.stack); });
// connect to db
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  operatorsAliases: false,

  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  },

  // SQLite only
  storage: './db/database.db'
});

sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
    console.log(sequelize.models);
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
  });
// MODELS



const Artist = sequelize.define('artist', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  name: Sequelize.STRING,
  birthday: Sequelize.STRING,
  deathday:Sequelize.STRING,
  gender: Sequelize.INTEGER,
  place_of_birth: Sequelize.STRING
  },{timestamps: false})


const Film = sequelize.define('film', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  title: Sequelize.STRING,
  release_date: Sequelize.STRING,
  tagline: Sequelize.STRING,
  revenue: Sequelize.INTEGER,
  budget: Sequelize.INTEGER,
  runtime: Sequelize.INTEGER,
  original_language: Sequelize.STRING,
  status: Sequelize.STRING,
  genre_id: Sequelize.INTEGER
  },{timestamps: false})

const ArtistFilms = sequelize.define('artist_film', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  credit_Type: Sequelize.STRING,
  role: Sequelize.STRING,
  description: Sequelize.STRING,
  artist_id: Sequelize.INTEGER,
  film_id: Sequelize.INTEGER

  },{timestamps: false})

const Genre = sequelize.define('genre', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true,
  },
  name: Sequelize.STRING
  },{timestamps: false})


sequelize
.query('SELECT * FROM films WHERE id = 7746', { raw:true })
.then(films => {
  console.log(films)
})

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('/', (req, res) => {
  res.send('buggah')
})
// ROUTE HANDLER
function getFilmRecommendations(req, res) {
  res.status(500).send('Not Implemented');
}

module.exports = app;
