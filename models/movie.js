// models/movie.js
const mongoose = require('mongoose');

const MovieSchema = new mongoose.Schema(
  {
    Movie_ID:   { type: Number, index: true },
    Title:      { type: String, index: true, trim: true },
    Released:   { type: String },
    metascore:  { type: String },
    year:       { type: Number },
    genres:     [{ type: String }],
    rating:     { type: Number },
    movie_id:   { type: Number, index: true },
    movie_title:{ type: String, trim: true }
  },
  { timestamps: true, strict: false }
);

module.exports = mongoose.model('Movie', MovieSchema, 'movies');
