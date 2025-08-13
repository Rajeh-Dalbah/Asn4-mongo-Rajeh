const express = require('express');
const mongoose = require('mongoose');
const { body, param, query, validationResult } = require('express-validator');
const database = require('./config/database');
const Movie = require('./models/movie');

const app = express();
const port = process.env.PORT || 8000;

connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const path = require('path');
const exphbs = require('express-handlebars');
// step 3 q3
app.use(express.static(path.join(__dirname, 'public')));

// Handlebars
app.engine('.hbs', exphbs.engine({
  extname: '.hbs',
  helpers: {
    eq: (a,b) => String(a) === String(b)
  }
}));
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Home UI
app.get('/ui', (req, res) => {
  res.render('ui_home', { title: 'Movies UI' });
});

// Show form (by _id or Movie_ID)
app.get('/ui/movie/show', (req, res) => {
  res.render('ui_show_form', { title: 'Find a Movie' });
});

// Handle show result
app.post('/ui/movie/show', async (req, res, next) => {
  try {
    const { keyType, keyValue } = req.body;
    let movie = null;

    if (keyType === 'mongo') {
      movie = await Movie.findById(keyValue).lean();
    } else if (keyType === 'movieId') {
      const n = Number(keyValue);
      movie = await Movie.findOne({ $or: [{ Movie_ID: n }, { movie_id: n }] }).lean();
    }

    if (!movie) return res.render('ui_result', { title: 'Result', notFound: true, keyType, keyValue });
    res.render('ui_result', { title: 'Result', movie });
  } catch (e) { next(e); }
});

// Insert form
app.get('/ui/movie/new', (req, res) => {
  res.render('ui_new_form', { title: 'Add Movie' });
});

// Handle insert
app.post('/ui/movie/new', async (req, res, next) => {
  try {
    const { Movie_ID, Title, Released } = req.body;
    const doc = await Movie.create({
      Movie_ID: Movie_ID ? Number(Movie_ID) : undefined,
      Title,
      Released
    });
    res.render('ui_result', { title: 'Created', created: true, movie: doc.toObject() });
  } catch (e) { next(e); }
});

// step 3 q3

app.get('/', (req, res) => res.json({ ok: true, service: 'asn4-movies', ts: new Date().toISOString() }));

function v(req, res, next) {
  const e = validationResult(req);
  if (!e.isEmpty()) return res.status(400).json({ errors: e.array() });
  next();
}

app.get('/api/movies',
  [ query('limit').optional().isInt({ min: 1, max: 500 }) ],
  v,
  async (req, res, next) => {
    try {
      const { limit = 50, q } = req.query;
      const filter = q ? { Title: new RegExp(q, 'i') } : {};
      const docs = await Movie.find(filter).limit(Number(limit));
      res.json(docs);
    } catch (err) { next(err); }
  }
);

app.get('/api/movies/by-id/:mid',
  [ param('mid').isInt() ],
  v,
  async (req, res, next) => {
    try {
      const mid = Number(req.params.mid);
      const doc = await Movie.findOne({ $or: [{ Movie_ID: mid }, { movie_id: mid }] });
      if (!doc) return res.status(404).json({ error: 'not found' });
      res.json(doc);
    } catch (err) { next(err); }
  }
);

app.get('/api/movies/by-title/:title', async (req, res, next) => {
  try {
    const doc = await Movie.findOne({ Title: req.params.title });
    if (!doc) return res.status(404).json({ error: 'not found' });
    res.json(doc);
  } catch (err) { next(err); }
});

app.get('/api/movies/:id([0-9a-fA-F]{24})',
  v,
  async (req, res, next) => {
    try {
      const doc = await Movie.findById(req.params.id);
      if (!doc) return res.status(404).json({ error: 'not found' });
      res.json(doc);
    } catch (err) { next(err); }
  }
);

app.post('/api/movies',
  [
    body('Title').isString().notEmpty(),
    body('Movie_ID').optional().isInt(),
    body('Released').optional().isString()
  ],
  v,
  async (req, res, next) => {
    try {
      const doc = await Movie.create(req.body);
      res.status(201).json(doc);
    } catch (err) { next(err); }
  }
);

app.delete('/api/movies/by-id/:mid',
  [ param('mid').isInt() ],
  v,
  async (req, res, next) => {
    try {
      const mid = Number(req.params.mid);
      const out = await Movie.findOneAndDelete({ $or: [{ Movie_ID: mid }, { movie_id: mid }] });
      if (!out) return res.status(404).json({ error: 'not found' });
      res.json({ deleted: true, Movie_ID: out.Movie_ID || out.movie_id });
    } catch (err) { next(err); }
  }
);

app.delete('/api/movies/:id([0-9a-fA-F]{24})',
  v,
  async (req, res, next) => {
    try {
      const out = await Movie.findByIdAndDelete(req.params.id);
      if (!out) return res.status(404).json({ error: 'not found' });
      res.json({ deleted: true, _id: out._id });
    } catch (err) { next(err); }
  }
);

app.delete('/api/movies/by-title/:title', async (req, res, next) => {
  try {
    const out = await Movie.findOneAndDelete({ Title: req.params.title });
    if (!out) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: true, Title: out.Title });
  } catch (err) {
    next(err);
  }
});


app.put('/api/movies/by-id/:mid',
  [
    param('mid').isInt(),
    body('Title').optional().isString().notEmpty(),
    body('Released').optional().isString()
  ],
  v,
  async (req, res, next) => {
    try {
      const mid = Number(req.params.mid);
      const updates = {};
      if (req.body.Title !== undefined) updates.Title = req.body.Title;
      if (req.body.Released !== undefined) updates.Released = req.body.Released;
      const doc = await Movie.findOneAndUpdate(
        { $or: [{ Movie_ID: mid }, { movie_id: mid }] },
        updates,
        { new: true }
      );
      if (!doc) return res.status(404).json({ error: 'not found' });
      res.json(doc);
    } catch (err) { next(err); }
  }
);

app.put('/api/movies/:id([0-9a-fA-F]{24})',
  [
    body('Title').optional().isString().notEmpty(),
    body('Released').optional().isString()
  ],
  v,
  async (req, res, next) => {
    try {
      const updates = {};
      if (req.body.Title !== undefined) updates.Title = req.body.Title;
      if (req.body.Released !== undefined) updates.Released = req.body.Released;
      const doc = await Movie.findByIdAndUpdate(req.params.id, updates, { new: true });
      if (!doc) return res.status(404).json({ error: 'not found' });
      res.json(doc);
    } catch (err) { next(err); }
  }
);

app.use((err, req, res, next) => {
  console.error('ERROR:', err.message);
  res.status(500).json({ error: 'Internal Server Error', detail: err.message });
});

// step 4
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  const mongoose = require('mongoose');
  const database = require('./config/database');
  const port = process.env.PORT || 8000;

  mongoose.connect(database.url)
    .then(() => {
      console.log(' MongoDB Atlas connected:', mongoose.connection.name);
      app.listen(port, () => console.log(` Server running on http://localhost:${port}`));
    })
    .catch(err => {
      console.error(' MongoDB connection error:', err.message);
      process.exit(1);
    });
}


// step 4

/*
mongoose.connect(database.url)
  .then(() => {
    console.log(' MongoDB Atlas connected:', mongoose.connection.name);
    app.listen(port, () => console.log(` Server running on http://localhost:${port}`));
  })
  .catch(err => {
    console.error(' MongoDB connection error:', err.message);
    process.exit(1);
  });
*/