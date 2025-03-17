const express = require('express');
const axios = require('axios');
const router = express.Router();
const jwt = require('jsonwebtoken');

const TEXTE_SERVICE_URL = 'http://service-texte:8001';

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];

    if (!bearerHeader) {
        return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    const token = bearerHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_temp');
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token invalide' });
    }
};

router.post('/generer', async (req, res) => {
    try {
        const response = await axios.post(`${TEXTE_SERVICE_URL}/generer`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Erreur lors de la génération du texte'
        });
    }
});

router.post('/generer-chapitre-suivant', verifyToken, async (req, res) => {
    try {
        const response = await axios.post(`${TEXTE_SERVICE_URL}/generer-chapitre-suivant`, req.body);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Erreur lors de la génération du chapitre suivant'
        });
    }
});

module.exports = router;
