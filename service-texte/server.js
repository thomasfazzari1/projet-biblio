// service-texte/server.js
const express = require('express');
const dotenv = require('dotenv');
const { CLES, PromptBuilder } = require('./prompt-builder');
const Generateur = require('./generateur.js');
const { JsonCleaner } = require('./util-json');

dotenv.config();

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Service Texte en ligne');
});

app.post('/generer', async (req, res) => {
    try {
        const parametres = new Map();

        // On affecte les réponses du questionnaireaux valeurs du Map
        Object.entries(CLES).forEach(([key, value]) => {
            parametres.set(value, req.body[key] || '');
        });

        const resultatBrut = await Generateur.genererConte(parametres);
        const resultatNettoye = Generateur.nettoyerReponse(resultatBrut);

        try {
            const resultatJSON = JSON.parse(resultatNettoye);

            if (!resultatJSON.chapitre1?.paragraphes) {
                resultatJSON.chapitre1 = {
                    titre: "",
                    etapeNarrative: "",
                    paragraphes: [""]
                };
            }

            // On vérifie que les persos ont des archétypes et des desc
            if (!resultatJSON.personnages || !Array.isArray(resultatJSON.personnages)) {
                resultatJSON.personnages = [];
            }

            resultatJSON.personnages = resultatJSON.personnages.map(p => {
                if (!p) return { nom: "", archetype: "", description: "" };
                return {
                    nom: p.nom || "",
                    archetype: p.archetype || "Personnage",
                    description: p.description && p.description !== "Introduit dans le chapitre.." ?
                        p.description : "Personnage du conte avec des caractéristiques à définir."
                };
            });

            // On vérifie que les lieux ont des desc
            if (!resultatJSON.lieux || !Array.isArray(resultatJSON.lieux)) {
                resultatJSON.lieux = [];
            }

            resultatJSON.lieux = resultatJSON.lieux.map(l => {
                if (!l) return { nom: "", description: "" };
                return {
                    nom: l.nom || "",
                    description: l.description && l.description !== "Description non fournie" ?
                        l.description : "Description non fournie"
                };
            });

            res.json({ success: true, conte: resultatJSON });
        } catch (parseError) {
            // En cas d'échec on construit une structure vide
            const resultatJSON = {
                titre: req.body.TITRE_CONTE || "",
                description: req.body.DESCRIPTION?.substring(0, 100) || "",
                chapitre1: {
                    titre: "",
                    etapeNarrative: "",
                    paragraphes: [""]
                },
                personnages: [{ nom: "", archetype: "Archetype non fourni", description: "Description non fournie" }],
                lieux: [{ nom: "", description: "Description non fournie" }]
            };

            res.json({ success: true, conte: resultatJSON });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

app.post('/generer-chapitre-suivant', async (req, res) => {
    try {
        const { conte, dernierChapitre } = req.body;

        if (!conte || !dernierChapitre) {
            return res.status(400).json({
                success: false,
                message: 'Données manquantes'
            });
        }

        if (conte.statut === 'terminé') {
            return res.status(400).json({
                success: false,
                message: 'Conte déjà terminé'
            });
        }

        const resultatBrut = await Generateur.genererChapitreSuivant(conte, dernierChapitre);
        const resultatNettoye = Generateur.nettoyerReponse(resultatBrut);

        try {
            const chapitre = JSON.parse(resultatNettoye);

            // On regarde si le conte est terminé pour changer son statut s'il le faut
            const numeroProchainChapitre = conte.chapitres ? conte.chapitres.length + 1 : 2;
            const statut = (chapitre.etapeNarrative && chapitre.etapeNarrative.toLowerCase().includes('finale'))
            || numeroProchainChapitre >= 8 ? 'terminé' : 'en cours';

            if (chapitre.paragraphes) {
                chapitre.paragraphes = JsonCleaner.formatterParagraphes(chapitre.paragraphes);
            } else {
                chapitre.paragraphes = ["Le contenu de ce chapitre n'a pas pu être généré"];
            }

            // Extraction nouveaux personnages / lieux
            let nouveauxPersonnages = [];
            let nouveauxLieux = [];

            if (chapitre.nouveaux_elements) {
                if (chapitre.nouveaux_elements.personnages && Array.isArray(chapitre.nouveaux_elements.personnages)) {
                    nouveauxPersonnages = chapitre.nouveaux_elements.personnages.map(p => ({
                        nom: p.nom || "",
                        archetype: p.archetype || "Archetype non fourni",
                        description: p.description || "Description non fournie"
                    }));
                }

                if (chapitre.nouveaux_elements.lieux && Array.isArray(chapitre.nouveaux_elements.lieux)) {
                    nouveauxLieux = chapitre.nouveaux_elements.lieux.map(l => ({
                        nom: l.nom || "",
                        description: l.description || "Description non fournie"
                    }));
                }
                delete chapitre.nouveaux_elements;
            }

            // Gestion doublons pour les lieux
            if (conte.lieux && Array.isArray(conte.lieux)) {
                const lieuxExistantsNormalises = conte.lieux
                    .filter(l => l && l.nom)
                    .map(l => JsonCleaner.normaliserNomLieu(l.nom));

                nouveauxLieux = nouveauxLieux.filter(nl =>
                    !lieuxExistantsNormalises.includes(JsonCleaner.normaliserNomLieu(nl.nom))
                );
            }

            chapitre.nouveauxPersonnages = nouveauxPersonnages;
            chapitre.nouveauxLieux = nouveauxLieux;

            res.json({
                success: true,
                chapitre: chapitre,
                statut: statut,
                nouveauxPersonnages: nouveauxPersonnages,
                nouveauxLieux: nouveauxLieux
            });
        } catch (parseError) {
            console.error('Erreur lors du parsing du chapitre:', parseError);

            const numeroProchainChapitre = conte.chapitres ? conte.chapitres.length + 1 : 2;
            const estDernierChapitre = numeroProchainChapitre >= 8;

            const chapitreParDefaut = {
                titre: `Chapitre ${numeroProchainChapitre}`,
                etapeNarrative: estDernierChapitre ? "Situation Finale" : "Péripéties",
                paragraphes: [""],
                nouveauxPersonnages: [],
                nouveauxLieux: []
            };

            res.json({
                success: true,
                chapitre: chapitreParDefaut,
                statut: estDernierChapitre ? 'terminé' : 'en cours',
                nouveauxPersonnages: [],
                nouveauxLieux: []
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

const port = 8001;
app.listen(port);