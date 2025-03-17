// service.auth/server.js
const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || (() => {
    console.error('JWT_SECRET non défini');
    process.exit(1);
})();

const app = express();
app.use(cors());
app.use(express.json());

const pools = {
    auth_db: new Pool({
        user: process.env.AUTH_DB_USER,
        password: process.env.AUTH_DB_PASSWORD,
        host: process.env.AUTH_DB_HOST,
        database: process.env.AUTH_DB_NAME,
        port: process.env.AUTH_DB_PORT || 5432,
    }),
    conte_db: new Pool({
        user: process.env.CONTE_DB_USER,
        password: process.env.CONTE_DB_PASSWORD,
        host: process.env.CONTE_DB_HOST,
        database: process.env.CONTE_DB_NAME,
        port: process.env.CONTE_DB_PORT || 5432,
    })
};

function hashMdp(mdp) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
        .pbkdf2Sync(mdp, salt, 10000, 64, 'sha512')
        .toString('hex');
    return `${salt}:${hash}`;
}

function verifierMdp(mdp, mdpHash) {
    const [salt, hash] = mdpHash.split(':');
    const verifyHash = crypto
        .pbkdf2Sync(mdp, salt, 10000, 64, 'sha512')
        .toString('hex');
    return hash === verifyHash;
}

const verifierDev = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Non authentifié' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        if (!decoded.est_developpeur) {
            return res.status(403).json({ message: 'Accès non autorisé' });
        }
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token invalide' });
    }
};

app.post('/inscription', async (req, res) => {
    const { email, mdp, est_developpeur } = req.body;
    try {
        const existe = await pools.auth_db.query(
            'SELECT * FROM utilisateurs WHERE email = $1',
            [email]
        );
        if (existe.rows.length > 0) {
            return res.status(400).json({ message: 'Email déjà utilisé' });
        }

        const estDev = est_developpeur === true || est_developpeur === 'true';

        const mdpHash = hashMdp(mdp);
        const resultat = await pools.auth_db.query(
            `INSERT INTO utilisateurs (email, mdp_hash, est_developpeur, credits)
             VALUES ($1, $2, $3, 1) RETURNING id, email, credits, est_developpeur`,
            [email, mdpHash, estDev]
        );

        const token = jwt.sign(
            {
                id: resultat.rows[0].id,
                email: resultat.rows[0].email,
                credits: resultat.rows[0].credits,
                est_developpeur: resultat.rows[0].est_developpeur,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de l\'inscription' });
    }
});

app.post('/connexion', async (req, res) => {
    const { email, mdp } = req.body;
    try {
        const resultat = await pools.auth_db.query(
            'SELECT * FROM utilisateurs WHERE email = $1',
            [email]
        );
        if (resultat.rows.length === 0) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        const utilisateur = resultat.rows[0];
        if (!verifierMdp(mdp, utilisateur.mdp_hash)) {
            return res.status(401).json({ message: 'Identifiants invalides' });
        }
        const token = jwt.sign(
            {
                id: utilisateur.id,
                email: utilisateur.email,
                credits: utilisateur.credits,
                est_developpeur: utilisateur.est_developpeur,
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        res.json({ token });
    } catch (error) {
        res.status(500).json({ message: 'Erreur lors de la connexion' });
    }
});

app.post('/recharge-credit', async (req, res) => {
    const { userId } = req.body;

    try {
        const user = await pools.auth_db.query(
            'SELECT * FROM utilisateurs WHERE id = $1',
            [userId]
        );

        if (user.rows.length === 0) {
            return res.status(404).json({ message: 'Utilisateur non trouvé' });
        }

        const lastRecharge = user.rows[0].date_rechargement_credit;
        const now = new Date();

        if (!lastRecharge || (now - new Date(lastRecharge)) >= 24 * 60 * 60 * 1000) {
            const result = await pools.auth_db.query(
                `UPDATE utilisateurs
                 SET credits = credits + 1,
                     date_rechargement_credit = CURRENT_TIMESTAMP
                 WHERE id = $1
                     RETURNING id, email, credits, est_developpeur`,
                [userId]
            );

            const token = jwt.sign(
                {
                    id: result.rows[0].id,
                    email: result.rows[0].email,
                    credits: result.rows[0].credits,
                    est_developpeur: result.rows[0].est_developpeur,
                },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            return res.json({
                success: true,
                token,
                message: 'Crédit rechargé avec succès'
            });
        }

        const tempsRestant = 24 * 60 * 60 * 1000 - (now - new Date(lastRecharge));
        const heuresRestantes = Math.ceil(tempsRestant / (60 * 60 * 1000));

        res.status(400).json({
            success: false,
            message: `Veuillez attendre encore ${heuresRestantes} heure(s)`
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erreur lors de la recharge du crédit'
        });
    }
});

app.post('/debit-credit', async (req, res) => {
    const { userId } = req.body;
    try {
        const result = await pools.auth_db.query(
            `UPDATE utilisateurs 
             SET credits = credits - 1 
             WHERE id = $1 AND credits > 0 
             RETURNING id, email, credits, est_developpeur`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ success: false, message: 'Crédits insuffisants' });
        }

        const token = jwt.sign({
            id: result.rows[0].id,
            email: result.rows[0].email,
            credits: result.rows[0].credits,
            est_developpeur: result.rows[0].est_developpeur,
        }, JWT_SECRET, { expiresIn: '24h' });

        res.json({ success: true, token });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur lors du débit' });
    }
});

app.get('/databases', verifierDev, async (req, res) => {
    try {
        res.json({
            success: true,
            databases: [{
                name: 'auth_db',
                host: 'db-auth',
                port: 5432
            }, {
                name: 'conte_db',
                host: 'db-conte',
                port: 5432
            }]
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

app.get('/tables/:db', verifierDev, async (req, res) => {
    const pool = pools[req.params.db];
    if (!pool) {
        return res.status(400).json({ success: false, message: 'Base de données invalide' });
    }

    try {
        const tables = await pool.query(`
            SELECT table_name
            FROM information_schema.tables
            WHERE table_schema = 'public'
        `);

        const tablesData = await Promise.all(tables.rows.map(async ({ table_name }) => {
            const columns = await pool.query(`
                SELECT column_name
                FROM information_schema.columns
                WHERE table_name = $1
                ORDER BY ordinal_position
            `, [table_name]);

            const data = await pool.query(`SELECT * FROM ${table_name}`);

            return {
                name: table_name,
                columns: columns.rows.map(col => col.column_name),
                rows: data.rows
            };
        }));

        res.json({ success: true, tables: tablesData });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erreur serveur' });
    }
});

const port = 8004;
app.listen(port)