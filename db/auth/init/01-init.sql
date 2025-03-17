-- db/auth/init/01-init.sql
CREATE TABLE IF NOT EXISTS utilisateurs (
                       id SERIAL PRIMARY KEY,
                       email VARCHAR(255) UNIQUE NOT NULL,
                       mdp_hash VARCHAR(255) NOT NULL,
                       credits INTEGER DEFAULT 1,
                       est_developpeur BOOLEAN DEFAULT false,
                       date_rechargement_credit TIMESTAMP,
                       date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);