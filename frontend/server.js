// frontend/server.js
const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

app.use(express.json());
app.use(session({
    secret: 'none',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        maxAge: 24 * 60 * 60 * 1000
    }
}));

app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/deconnexion', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: err.message });
        }
        res.json({ success: true });
    });
});

app.get('/espace-dev', (req, res) => {
    res.render('index', { view: 'espace-dev' });
});

app.get('/conte/:id', (req, res) => {
    res.render('index', { view: 'conte', conteId: req.params.id });
});

app.get('/auteurs', (req, res) => {
    res.render('index', { view: 'auteurs' });
});

const PORT = 3000;
app.listen(PORT)