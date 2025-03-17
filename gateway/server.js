// gateway/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/auth-routes');
const texteRoutes = require('./routes/texte-routes');
const extractionRoutes = require('./routes/extraction-routes');

dotenv.config();

const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));

app.use(express.json());

app.use('/', authRoutes);
app.use('/texte', texteRoutes);
app.use('/conte', extractionRoutes);

const PORT = 8000;
app.listen(PORT)