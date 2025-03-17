-- db/conte/init/01-init.sql
CREATE TABLE IF NOT EXISTS contes (
    id SERIAL PRIMARY KEY,
    titre VARCHAR(255) NOT NULL,
    description TEXT,
    types VARCHAR(255)[],
    epoque VARCHAR(255),
    lieu VARCHAR(255),
    genre_personnage VARCHAR(50),
    valeurs VARCHAR(255)[],
    traits VARCHAR(255)[],
    statut VARCHAR(50) DEFAULT 'EnCours',
    utilisateur_id INTEGER NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

CREATE TABLE IF NOT EXISTS chapitres (
    id SERIAL PRIMARY KEY,
    conte_id INTEGER NOT NULL,
    numero INTEGER NOT NULL,
    titre VARCHAR(255) NOT NULL,
    etape_narrative VARCHAR(50),
    contenu TEXT NOT NULL,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conte_id) REFERENCES contes(id),
    UNIQUE (conte_id, numero)
    );

CREATE TABLE IF NOT EXISTS personnages (
    id SERIAL PRIMARY KEY,
    conte_id INTEGER NOT NULL,
    nom VARCHAR(255) NOT NULL,
    archetype VARCHAR(50),
    description TEXT,
    FOREIGN KEY (conte_id) REFERENCES contes(id)
    );

CREATE TABLE IF NOT EXISTS lieux (
    id SERIAL PRIMARY KEY,
    conte_id INTEGER NOT NULL,
    nom VARCHAR(255) NOT NULL,
    description TEXT,
    FOREIGN KEY (conte_id) REFERENCES contes(id)
    );