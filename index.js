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
  "message" : "Return an explicit error here"
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
app.get('/', (req, res) => {
  res.send('buggah')
})
// ROUTE HANDLER
function getFilmRecommendations(req, res) {

  let getGenre = "",
    getRating = 0,
    getReleaseDate = ''

  console.log(req.params.id);
  let filmId = req.params.id;
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
      offset: 1,
      limit: 10
    }).then(data => {
      for (let i = 0; i < data.length; i++) {
        let getDate = (new Date(data[i].release_date));
        if (getDate < (new Date(getReleaseYearPlus)) || getDate < (new Date(getReleaseYearPlus))) {
          request(`${url}?films=${data[i].id}`, function(error, response, body) {
            let reviewsAll = JSON.parse(body)
            let ratingCounter = 0,
                recommendedGenre = '',
                recommendedTitle = '',
                recommendedReviewsCount= '',
                recommendedAvgRating= 0
            for(let j = 0; j < reviewsAll.length; j++){
              // console.log(reviewsAll[j].film_id);

              recommendedReviewsCount = reviewsAll[j].reviews.length
              for(let k = 0; k < reviewsAll[j].reviews.length; k++){
                ratingCounter += reviewsAll[j].reviews[k].rating
              }
              recommendedAvgRating = ratingCounter / reviewsAll[j].reviews.length
              if (recommendedAvgRating > 4 && recommendedReviewsCount >= 5) {
                Film.findById(reviewsAll[j].film_id).then(data2 => {
                  recommendedTitle = data2.title
                  Genre.findById(data2.genre_id).then(data3 => {
                    recommendedGenre = data3.name
                    console.log(data[i].id);
                    console.log(recommendedTitle);
                    console.log(data[i].release_date);
                    console.log(recommendedGenre);
                    console.log(recommendedAvgRating);
                    console.log(recommendedReviewsCount);
                    res.json({
                      recommendations: {
                        id: data[i].id,
                        title: recommendedTitle,
                        releaseDate: data[i].release_date,
                        genre: recommendedGenre,
                        averageRating: recommendedAvgRating,
                        reviews:recommendedReviewsCount
                      },
                      meta: {
                        limit: 10,
                        offset: 1
                      }
                    })
                  })
                })
              }
            }

          })
        }
      }
    })

    // res.send('hello')
  })
}

  module.exports = app;
