const sqlite = require('sqlite'),
  Sequelize = require('sequelize'),
  request = require('request'),
  express = require('express'),
  app = express();

const {
  PORT = 3000,
  NODE_ENV = 'development',
  DB_PATH = './db/database.db'
} = process.env;
let url = 'http://credentials-api.generalassemb.ly/4576f55f-c427-4cfc-a11c-5bfe914ca6c1'
let errMsg = {
  "message" : "key missing"
}

// START SERVER
Promise.resolve().then(() => app.listen(PORT, () => console.log(`App listening on port ${PORT}`))).catch((err) => {
  if (NODE_ENV === 'development')
    console.error(err.stack);
  }
);
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

sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.');
  console.log(sequelize.models);
}).catch(err => {
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
  deathday: Sequelize.STRING,
  gender: Sequelize.INTEGER,
  place_of_birth: Sequelize.STRING
}, {timestamps: false})

const Film = sequelize.define('film', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  title: Sequelize.STRING,
  release_date: Sequelize.DATE,
  tagline: Sequelize.STRING,
  revenue: Sequelize.INTEGER,
  budget: Sequelize.INTEGER,
  runtime: Sequelize.INTEGER,
  original_language: Sequelize.STRING,
  status: Sequelize.STRING,
  genre_id: Sequelize.INTEGER
}, {timestamps: false})

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

}, {timestamps: false})

const Genre = sequelize.define('genre', {
  id: {
    type: Sequelize.INTEGER,
    allowNull: false,
    primaryKey: true
  },
  name: Sequelize.STRING
}, {timestamps: false})

// ROUTES
app.get('/films/:id/recommendations', getFilmRecommendations);
app.get('*', (req, res) => {
  res.status(404).json({
    message: "key missing"
  })
})
// ROUTE HANDLER
function getFilmRecommendations(req, res) {

  let getGenre = "",
    getRating = 0,
    getReleaseDate = ''

  console.log(req.params.id);
  console.log(req.query.limit);
  let filmId = req.params.id;
  let offset = 1;
  let limit = 10;
  if (req.query.limit) {
    limit = req.query.limit
  }
  if (req.query.offset){
    offset = req.query.offset
  }
  Film.findById(req.params.id).then(data => {
    console.log(typeof(data.release_date), typeof(new Date()));
    getGenre = data.genre_id;
    getReleaseDate = new Date(data.release_date);
    getReleaseYearPlus = getReleaseDate.setFullYear(getReleaseDate.getFullYear() + 15);
    getReleaseYearMinus = getReleaseDate.setFullYear(getReleaseDate.getFullYear() - 30);
  }).then(data => {

    Film.findAll({
      where: {
        genre_id: getGenre,
        release_date: {
          $or: {
            $lt: (new Date(getReleaseYearPlus)),
            $gt: (new Date(getReleaseYearMinus))
          }
        }
      },
      offset: +offset,
      limit: +limit
    }).then(data => {
      for (let i = 0; i < data.length; i++) {
        let getDate = (new Date(data[i].release_date));
        if (getDate < (new Date(getReleaseYearPlus)) || getDate < (new Date(getReleaseYearPlus))) {
          request(`${url}?films=${data[i].id}`, function(error, response, body) {
            Film.all({
              attributes: [
                'id', 'title', 'release_date'
              ],
              where: {
                id: { in: data[i].id
                }
              },
              order: ['id'],
              limit: 3
            })
              .then(filmRec => {
              const mapped = filmRec.map(film => {
                if (film.averageRating >= 4 && film.reviews > 5) {
                  return film.id;
                } else {
                  return errMsg;
                }
                return {

                  id: mapped[0].film,
                  title: film.title,
                  releaseDate: film.release_date,
                  genre: genre.name,
                  averageRating: film.average_rating,
                  reviews: mapped[0].reviews
                }
              })
              res.json({
                recommendations: mapped,
                meta: {
                  limit: 10,
                  offset: 1
                }
              });
            }).catch(err => {
              res.status(500).json(err);
            });

          })
        }
      }
    })
// res.send('hello')
  })
}

  module.exports = app;
