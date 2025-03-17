// gateway/routes/extraction-routes.js
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const router = express.Router();

const EXTRACTION_SERVICE_URL = 'http://service-extraction:8002';

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

router.post('/nouveau', verifyToken, async (req, res) => {
    try {
        const response = await axios.post(
            `${EXTRACTION_SERVICE_URL}/nouveau`,
            req.body,
            {
                headers: {
                    'Authorization': req.headers['authorization'],
                    'X-User-Info': JSON.stringify(req.user)
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Erreur lors de la création du conte'
        });
    }
});

// Récupère tous les contes
router.get('/', async (req, res) => {
    try {
        const response = await axios.get(`${EXTRACTION_SERVICE_URL}/contes`, {
            params: req.query
        });
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Erreur lors de la récupération des contes'
        });
    }
});

// Récupére un conte par ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.get(`${EXTRACTION_SERVICE_URL}/contes/${id}`);
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Erreur lors de la récupération du conte'
        });
    }
});

// Dev uniquement
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.delete(
            `${EXTRACTION_SERVICE_URL}/contes/${id}`,
            {
                headers: {
                    'Authorization': req.headers['authorization'],
                    'X-User-Info': JSON.stringify(req.user)
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Erreur lors de la suppression du conte'
        });
    }
});

// Génère la suite
router.post('/:id/chapitre', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const response = await axios.post(
            `${EXTRACTION_SERVICE_URL}/contes/${id}/chapitre`,
            req.body,
            {
                headers: {
                    'Authorization': req.headers['authorization'],
                    'X-User-Info': JSON.stringify(req.user)
                }
            }
        );
        res.json(response.data);
    } catch (error) {
        res.status(error.response?.status || 500).json({
            success: false,
            message: error.response?.data?.message || 'Erreur lors de l\'ajout du chapitre'
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