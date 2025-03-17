// service-extraction/server.js
const express = require('express');
const { Pool } = require('pg');
const Extracteur = require('./extracteur');
const dotenv = require('dotenv');
const axios = require('axios');
const { JsonCleaner } = require('./util-json');

dotenv.config();

const app = express();
app.use(express.json());

const extracteur = new Extracteur();

const TEXTE_SERVICE_URL = 'http://service-texte:8001';

const pool = new Pool({
    user: process.env.POSTGRES_USER || 'conte_user',
    host: process.env.POSTGRES_HOST || 'db-conte',
    database: process.env.POSTGRES_DB || 'conte_db',
    password: process.env.POSTGRES_PASSWORD || 'conte_password',
    port: 5432,
});

// Fonctions util
function traiterParagraphes(chapitre, extracteur) {
    let paragraphesFormattes = [];

    if (Array.isArray(chapitre.paragraphes) &&
        typeof chapitre.paragraphes[0] === 'string' &&
        chapitre.paragraphes[0].includes('{')) {

        const texteComplet = chapitre.paragraphes.join('');

        if (texteComplet.includes('titre:') && texteComplet.includes('paragraphes:')) {
            const paragraphesJSON = extracteur.extraireParagraphesJSON(texteComplet);
            if (paragraphesJSON && paragraphesJSON.length > 0) {
                paragraphesFormattes = paragraphesJSON;
            } else {
                paragraphesFormattes = extracteur.formatterParagraphes(chapitre.paragraphes);
            }
        } else {
            paragraphesFormattes = extracteur.formatterParagraphes(chapitre.paragraphes);
        }
    } else {
        paragraphesFormattes = extracteur.formatterParagraphes(chapitre.paragraphes);
    }

    return {
        paragraphes: paragraphesFormattes,
        contenu: paragraphesFormattes.join(' ')
    };
}

async function gererPersonnages(client, conteId, personnages, entites, chapitreNum, personnagesExistants = new Map()) {
    // On récup les persos existants du conte depuis la BDD
    if (personnagesExistants.size === 0 && conteId) {
        const result = await client.query(
            'SELECT nom, archetype, description FROM personnages WHERE conte_id = $1',
            [conteId]
        );

        result.rows.forEach(p => {
            const nomNormalise = JsonCleaner.normaliserNomPersonnage(p.nom);
            personnagesExistants.set(nomNormalise, {
                nom: p.nom,
                archetype: p.archetype,
                description: p.description
            });
        });
    }

    // Traitement direct des persos fournis
    if (personnages && Array.isArray(personnages)) {
        for (const personnage of personnages) {
            if (personnage && personnage.nom) {
                const nomNormalise = JsonCleaner.normaliserNomPersonnage(personnage.nom);

                if (!personnagesExistants.has(nomNormalise)) {
                    await client.query(
                        `INSERT INTO personnages (conte_id, nom, archetype, description)
                         VALUES ($1, $2, $3, $4)`,
                        [
                            conteId,
                            personnage.nom,
                            personnage.archetype || 'Personnage',
                            personnage.description || `Personnage du conte.`
                        ]
                    );
                    personnagesExistants.set(nomNormalise, true);
                }
            }
        }
    }

    // Traitement des persos extraits
    if (entites && entites.personnages && Array.isArray(entites.personnages)) {
        for (const personnage of entites.personnages) {
            const nom = typeof personnage === 'object' ? personnage.nom : personnage;

            if (nom) {
                const nomNormalise = JsonCleaner.normaliserNomPersonnage(nom);

                if (!personnagesExistants.has(nomNormalise)) {
                    await client.query(
                        `INSERT INTO personnages (conte_id, nom, archetype, description)
                         VALUES ($1, $2, $3, $4)`,
                        [
                            conteId,
                            nom,
                            typeof personnage === 'object' ? (personnage.archetype || 'Personnage') : 'Personnage',
                            typeof personnage === 'object' ?
                                (personnage.description || `Personnage découvert au chapitre ${chapitreNum || 1}.`) :
                                `Personnage découvert au chapitre ${chapitreNum || 1}.`
                        ]
                    );
                    personnagesExistants.set(nomNormalise, true);
                } else if (typeof personnage === 'object' && personnage.archetype) {
                    const existant = personnagesExistants.get(nomNormalise);

                    // MAJ si la nouvelle description est meilleure
                    if (personnage.description && existant && existant.description &&
                        personnage.description.length > existant.description.length)
                    {
                        await client.query(
                            `UPDATE personnages SET description = $1 WHERE conte_id = $2 AND LOWER(nom) = LOWER($3)`,
                            [personnage.description, conteId, nom]
                        );
                    }
                }
            }
        }
    }

    return personnagesExistants;
}

async function gererLieux(client, conteId, lieux, entites, chapitreNum, lieuxExistants = new Map()) {
    // On récup les lieux existants du conte depuis la BDD
    if (lieuxExistants.size === 0 && conteId) {
        const result = await client.query(
            'SELECT nom, description FROM lieux WHERE conte_id = $1',
            [conteId]
        );

        result.rows.forEach(l => {
            const nomNormalise = JsonCleaner.normaliserNomLieu(l.nom);
            lieuxExistants.set(nomNormalise, {
                nom: l.nom,
                description: l.description
            });
        });
    }

    // Traitement direct des lieux fournis
    if (lieux && Array.isArray(lieux)) {
        for (const lieu of lieux) {
            if (lieu && (lieu.nom || typeof lieu === 'string')) {
                const nom = typeof lieu === 'object' ? lieu.nom : lieu;
                const nomNormalise = JsonCleaner.normaliserNomLieu(nom);

                if (!lieuxExistants.has(nomNormalise)) {
                    await client.query(
                        `INSERT INTO lieux (conte_id, nom, description)
                         VALUES ($1, $2, $3)`,
                        [
                            conteId,
                            nom,
                            typeof lieu === 'object' ?
                                (lieu.description || `Lieu du conte.`) :
                                `Lieu du conte.`
                        ]
                    );
                    lieuxExistants.set(nomNormalise, true);
                }
            }
        }
    }

    // Traiter les lieux extraits du texte
    if (entites && entites.lieux && Array.isArray(entites.lieux)) {
        for (const lieu of entites.lieux) {
            const nom = typeof lieu === 'object' ? lieu.nom : lieu;

            if (nom) {
                const nomNormalise = JsonCleaner.normaliserNomLieu(nom);

                if (!lieuxExistants.has(nomNormalise)) {
                    await client.query(
                        `INSERT INTO lieux (conte_id, nom, description)
                         VALUES ($1, $2, $3)`,
                        [
                            conteId,
                            nom,
                            typeof lieu === 'object' ?
                                (lieu.description || `Lieu découvert au chapitre ${chapitreNum || 1}.`) :
                                `Lieu découvert au chapitre ${chapitreNum || 1}.`
                        ]
                    );
                    lieuxExistants.set(nomNormalise, true);
                } else if (typeof lieu === 'object' && lieu.description) {
                    // Mise à jour si la nouvelle description est plus détaillée
                    const existant = lieuxExistants.get(nomNormalise);
                    if (existant && existant.description &&
                        lieu.description.length > existant.description.length &&
                        !existant.description.includes("découvert au chapitre")) {
                        await client.query(
                            `UPDATE lieux SET description = $1 WHERE conte_id = $2 AND LOWER(nom) = LOWER($3)`,
                            [lieu.description, conteId, nom]
                        );
                    }
                }
            }
        }
    }

    return lieuxExistants;
}

async function extraireEtSauvegarder(conte, chapitre, utilisateurId, extracteur, pool) {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const { paragraphes, contenu } = traiterParagraphes(chapitre, extracteur);

        const entites = await extracteur.extraireEntites(contenu);

        // Insertion conte
        const conteResult = await client.query(
            `INSERT INTO contes
             (titre, description, types, epoque, lieu, genre_personnage, valeurs, traits, utilisateur_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
                 RETURNING id`,
            [
                conte.titre,
                conte.description,
                conte.types || [],
                conte.epoque,
                conte.lieu,
                conte.genrePersonnage,
                conte.valeurs || [],
                conte.traits || [],
                utilisateurId
            ]
        );

        const conteId = conteResult.rows[0].id;

        // Insertion chapitre
        await client.query(
            `INSERT INTO chapitres
                 (conte_id, numero, titre, etape_narrative, contenu)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                conteId,
                1,
                chapitre.titre,
                chapitre.etapeNarrative,
                JSON.stringify(paragraphes)
            ]
        );

        await gererPersonnages(client, conteId, conte.personnages, entites, 1);
        await gererLieux(client, conteId, conte.lieux, entites, 1);

        await client.query('COMMIT');

        return {
            success: true,
            conteId,
            titre: conte.titre,
            description: conte.description,
            chapitreTitre: chapitre.titre,
            paragraphes
        };
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
    }
}

const verifyToken = (req, res, next) => {
    const bearerHeader = req.headers['authorization'];

    if (!bearerHeader) {
        return res.status(401).json({ success: false, message: 'Token manquant' });
    }

    const userHeader = req.headers['x-user-info'];
    if (userHeader) {
        try {
            req.user = JSON.parse(userHeader);
            next();
        } catch (error) {
            return res.status(401).json({ success: false, message: 'Informations utilisateur invalides' });
        }
    }
};

app.get('/', (req, res) => {
    res.send('Service Extraction fonctionnel');
});

app.post('/extraire', async (req, res) => {
    try {
        const { texte } = req.body;
        if (!texte) {
            return res.status(400).json({ success: false, message: 'Texte manquant' });
        }

        const entites = await extracteur.extraireEntites(texte);
        res.json({ success: true, entites });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/extraire-et-sauvegarder', async (req, res) => {
    try {
        const { conte, chapitre, utilisateurId } = req.body;

        if (!conte || !chapitre || !utilisateurId) {
            return res.status(400).json({
                success: false,
                message: 'Données manquantes. Conte, chapitre et ID utilisateur requis.'
            });
        }

        const result = await extraireEtSauvegarder(conte, chapitre, utilisateurId, extracteur, pool);
        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Nouveau conte
app.post('/nouveau', verifyToken, async (req, res) => {
    try {
        if (!req.body.parametres) {
            return res.status(400).json({
                success: false,
                message: 'Paramètres manquants'
            });
        }

        const texteResponse = await axios.post(`${TEXTE_SERVICE_URL}/generer`, req.body.parametres);

        if (!texteResponse.data.success) {
            return res.status(400).json(texteResponse.data);
        }

        const conte = texteResponse.data.conte;

        const extractionData = {
            conte: {
                titre: conte.titre,
                description: conte.description,
                types: req.body.parametres.TYPES_CONTE?.split(',') || [],
                epoque: req.body.parametres.EPOQUE,
                lieu: req.body.parametres.LIEU,
                genrePersonnage: req.body.parametres.GENRE_PERSO,
                valeurs: req.body.parametres.VALEURS_PERSO?.split(',') || [],
                traits: req.body.parametres.TRAITS_PERSO?.split(',') || [],
                personnages: conte.personnages
            },
            chapitre: conte.chapitre1,
            utilisateurId: req.user.id
        };

        try {
            const result = await extraireEtSauvegarder(
                extractionData.conte,
                extractionData.chapitre,
                extractionData.utilisateurId,
                extracteur,
                pool
            );

            res.json(result);
        } catch (extractionError) {
            throw new Error('Erreur lors de l\'extraction et de la sauvegarde: ' + extractionError.message);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || error.message || 'Erreur lors de la création du conte'
        });
    }
});

app.get('/contes', async (req, res) => {
    try {
        const { page = 1, limit = 10, type, statut, utilisateurId } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT c.*,
                   (SELECT json_build_object('titre', ch.titre, 'contenu', ch.contenu)
                    FROM chapitres ch
                    WHERE ch.conte_id = c.id
                    ORDER BY ch.numero DESC
                       LIMIT 1) as dernier_chapitre
            FROM contes c
            WHERE 1=1
        `;

        const queryParams = [];
        let paramCounter = 1;

        if (type) {
            if (Array.isArray(type)) {
                const typeConditions = type.map((_, idx) => `$${paramCounter + idx} = ANY(c.types)`);
                query += ` AND (${typeConditions.join(' OR ')})`;
                queryParams.push(...type);
                paramCounter += type.length;
            } else {
                query += ` AND $${paramCounter} = ANY(c.types)`;
                queryParams.push(type);
                paramCounter++;
            }
        }

        if (statut) {
            query += ` AND c.statut = $${paramCounter}`;
            queryParams.push(statut);
            paramCounter++;
        }

        if (utilisateurId) {
            query += ` AND c.utilisateur_id = $${paramCounter}`;
            queryParams.push(utilisateurId);
            paramCounter++;
        }

        query += ` ORDER BY c.date_creation DESC LIMIT $${paramCounter} OFFSET $${paramCounter+1}`;
        queryParams.push(limit, offset);

        const result = await pool.query(query, queryParams);

        const contes = result.rows.map(conte => ({
            ...conte,
            dernier_chapitre: conte.dernier_chapitre ? {
                ...conte.dernier_chapitre,
                contenu: JSON.parse(conte.dernier_chapitre.contenu)
            } : null
        }));

        res.json({ success: true, contes });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération des contes' });
    }
});

app.get('/contes/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const conteResult = await pool.query(
            `SELECT c.*,
                    array_agg(DISTINCT p.nom) as personnages_noms,
                    array_agg(DISTINCT l.nom) as lieux_noms
             FROM contes c
                      LEFT JOIN personnages p ON c.id = p.conte_id
                      LEFT JOIN lieux l ON c.id = l.conte_id
             WHERE c.id = $1
             GROUP BY c.id`,
            [id]
        );

        if (conteResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Conte non trouvé' });
        }

        const conte = conteResult.rows[0];

        const chapitresResult = await pool.query(
            `SELECT * FROM chapitres WHERE conte_id = $1 ORDER BY numero`,
            [id]
        );

        const personnagesResult = await pool.query(
            `SELECT * FROM personnages WHERE conte_id = $1`,
            [id]
        );

        const lieuxResult = await pool.query(
            `SELECT * FROM lieux WHERE conte_id = $1`,
            [id]
        );

        const conteFormatte = {
            ...conte,
            chapitres: chapitresResult.rows.map(chapitre => ({
                ...chapitre,
                paragraphes: JSON.parse(chapitre.contenu)
            })),
            personnages: personnagesResult.rows,
            lieux: lieuxResult.rows
        };

        res.json({ success: true, conte: conteFormatte });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors de la récupération du conte' });
    }
});

// Dev uniquement
app.delete('/contes/:id', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (!req.user.est_developpeur) {
            return res.status(403).json({
                success: false,
                message: 'Seuls les développeurs peuvent supprimer des contes'
            });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Supression des entités liées
            await client.query('DELETE FROM personnages WHERE conte_id = $1', [id]);
            await client.query('DELETE FROM lieux WHERE conte_id = $1', [id]);
            await client.query('DELETE FROM chapitres WHERE conte_id = $1', [id]);
            const result = await client.query('DELETE FROM contes WHERE id = $1 RETURNING id', [id]);

            await client.query('COMMIT');

            if (result.rowCount === 0) {
                return res.status(404).json({ success: false, message: 'Conte non trouvé' });
            }

            res.json({
                success: true,
                message: 'Conte supprimé avec succès',
                id: result.rows[0].id
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la suppression du conte'
        });
    }
});

// Ajout d'un chapitre
app.post('/contes/:id/chapitre', verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { chapitre, statut } = req.body;

        // On vérifie que le conte existe & récupere ses infos
        const conteResult = await pool.query(
            'SELECT * FROM contes WHERE id = $1',
            [id]
        );

        if (conteResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Conte non trouvé' });
        }

        // Numéro du prochain chapitre
        const chapitresResult = await pool.query(
            'SELECT MAX(numero) as max_numero FROM chapitres WHERE conte_id = $1',
            [id]
        );
        const numeroProchainChapitre = chapitresResult.rows[0].max_numero ? parseInt(chapitresResult.rows[0].max_numero) + 1 : 1;

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            const { paragraphes, contenu } = traiterParagraphes(chapitre, extracteur);
            const entites = await extracteur.extraireEntites(contenu);

            // Insertion du nouveau chapitre
            await client.query(
                `INSERT INTO chapitres
                     (conte_id, numero, titre, etape_narrative, contenu)
                 VALUES ($1, $2, $3, $4, $5)`,
                [
                    id,
                    numeroProchainChapitre,
                    chapitre.titre || `Chapitre ${numeroProchainChapitre}`,
                    chapitre.etapeNarrative || '',
                    JSON.stringify(paragraphes)
                ]
            );

            // MAJ des personnages extraits
            let personnagesExistants = new Map();
            await gererPersonnages(
                client,
                id,
                chapitre.nouveauxPersonnages || [],
                entites,
                numeroProchainChapitre,
                personnagesExistants
            );

            // MAJ des lieux extraits
            let lieuxExistants = new Map();
            await gererLieux(
                client,
                id,
                chapitre.nouveauxLieux || [],
                entites,
                numeroProchainChapitre,
                lieuxExistants
            );

            // MAJ statut si nécessaire
            if (statut === 'terminé' || (chapitre.etapeNarrative && chapitre.etapeNarrative.toLowerCase().includes('finale'))) {
                await client.query(
                    'UPDATE contes SET statut = $1 WHERE id = $2',
                    ['terminé', id]
                );
            }

            await client.query('COMMIT');

            // Données structurées
            const nouveauChapitreResult = await pool.query(
                'SELECT * FROM chapitres WHERE conte_id = $1 AND numero = $2',
                [id, numeroProchainChapitre]
            );

            const conteUpdatedResult = await pool.query(
                'SELECT statut FROM contes WHERE id = $1',
                [id]
            );

            res.json({
                success: true,
                message: 'Chapitre ajouté avec succès',
                chapitre: {
                    ...nouveauChapitreResult.rows[0],
                    paragraphes: JSON.parse(nouveauChapitreResult.rows[0].contenu)
                },
                statut: conteUpdatedResult.rows[0].statut,
                entitesExtraites: {
                    personnages: entites.personnages || [],
                    lieux: entites.lieux || []
                }
            });

        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.response?.data?.message || 'Erreur lors de l\'ajout du chapitre'
        });
    }
});

const port = 8002;
app.listen(port);