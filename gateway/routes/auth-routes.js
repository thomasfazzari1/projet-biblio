const express = require('express');
const axios = require('axios');
const router = express.Router();

const AUTH_SERVICE_URL = 'http://service-auth:8004';

router.post('/auth/inscription', async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/inscription`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ message: 'Erreur interne (inscription)' });
    }
});

router.post('/auth/connexion', async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/connexion`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ message: 'Erreur interne (connexion)' });
    }
});

router.post('/credits/recharge', async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/recharge-credit`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ message: 'Erreur interne (recharge crédit)' });
    }
});

router.post('/credits/debit', async (req, res) => {
    try {
        const response = await axios.post(`${AUTH_SERVICE_URL}/debit-credit`, req.body);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ message: 'Erreur interne (débit crédit)' });
    }
});

router.get('/dev/databases', async (req, res) => {
    try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/databases`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ message: 'Erreur interne' });
    }
});

router.get('/dev/tables/:db', async (req, res) => {
    try {
        const response = await axios.get(`${AUTH_SERVICE_URL}/tables/${req.params.db}`, {
            headers: { Authorization: req.headers.authorization }
        });
        res.json(response.data);
    } catch (error) {
        if (error.response) {
            return res.status(error.response.status).json(error.response.data);
        }
        res.status(500).json({ message: 'Erreur interne' });
    }
});

module.exports = router;
