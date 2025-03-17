// service-extraction/extracteur.js
const { Mistral } = require('@mistralai/mistralai');
require('dotenv').config();
const { JsonCleaner } = require('./util-json');

class Extracteur {
    constructor() {
        this.API_KEY = process.env.MISTRAL_API_KEY_2;
        if (!this.API_KEY) {
            console.error('MISTRAL_API_KEY_2 non définie');
            process.exit(1);
        }
        this.client = new Mistral({ apiKey: this.API_KEY });
        this.model = 'mistral-large-latest';
    }

    async extraireEntites(texte) {
        const prompt = `
        Voici un conte : "${texte}"
        
        Analyse attentivement ce texte pour identifier avec précision:
        
        1. PERSONNAGES: Liste exhaustive de tous les personnages avec descriptions, incluant:
           - Personnages principaux et secondaires
           - Leurs noms, titres (roi, reine, etc.) et rôles
           - Personnages implicites avec des descriptions reconnaissables
           - Pour chaque personnage, identifie un archétype (Héros, Mentor, Antagoniste, Allié, etc.)
           - Une brève description (max 40 caractères) quand possible
        
        2. LIEUX: Liste détaillée de tous les endroits mentionnés, incluant:
           - Royaumes, villages, châteaux, forêts, montagnes, etc.
           - Lieux fictifs ou réels nommés explicitement
           - Une brève description si possible
        
        Format de réponse strict (JSON):
        {
          "personnages": [
            {"nom": "Nom du personnage", "archetype": "Archétype", "description": "Brève description"},
            ...
          ],
          "lieux": [
            {"nom": "Nom du lieu", "description": "Brève description"},
            ...
          ]
        }
        `;

        try {
            const response = await this.client.chat.complete({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
            });

            const reponseBrute = response.choices[0].message.content;
            return this.parseJSON(reponseBrute);
        } catch (error) {
            return { personnages: [], lieux: [] };
        }
    }

    parseJSON(reponse) {
        try {
            // On tente de trouver et extraire un JSON valide
            const match = reponse.match(/\{[\s\S]*\}/);
            if (match) {
                const jsonData = JSON.parse(match[0]);

                // Maps pour éviter les doublons
                const personnagesMap = new Map();
                const lieuxMap = new Map();

                // Persos
                if (jsonData.personnages && Array.isArray(jsonData.personnages)) {
                    jsonData.personnages.forEach(p => {
                        let personnage;

                        if (typeof p === 'string') {
                            personnage = {
                                nom: p,
                                archetype: "Personnage",
                                description: "Personnage du conte."
                            };
                        } else {
                            personnage = {
                                nom: p.nom || "",
                                archetype: p.archetype || "Personnage",
                                description: p.description || "Personnage du conte."
                            };
                        }

                        // On normalise et vérifie les doublons
                        if (personnage.nom) {
                            const nomNormalise = JsonCleaner.normaliserNomPersonnage(personnage.nom);

                            // Si le perso existe déjà on fusionne les infos
                            if (personnagesMap.has(nomNormalise)) {
                                const existant = personnagesMap.get(nomNormalise);
                                // On garde la description la plus longue
                                if (personnage.description.length > existant.description.length) {
                                    existant.description = personnage.description;
                                }

                                existant.archetype = personnage.archetype;
                            } else {
                                personnagesMap.set(nomNormalise, personnage);
                            }
                        }
                    });
                }

                // Lieux (pareil)
                if (jsonData.lieux && Array.isArray(jsonData.lieux)) {
                    jsonData.lieux.forEach(l => {
                        let lieu;

                        if (typeof l === 'string') {
                            lieu = {
                                nom: l,
                                description: "Lieu du conte."
                            };
                        } else {
                            lieu = {
                                nom: l.nom || "",
                                description: l.description || "Lieu du conte."
                            };
                        }

                        if (lieu.nom) {
                            const nomNormalise = JsonCleaner.normaliserNomLieu(lieu.nom);
                            if (lieuxMap.has(nomNormalise)) {
                                const existant = lieuxMap.get(nomNormalise);
                                if (lieu.description.length > existant.description.length) {
                                    existant.description = lieu.description;
                                }
                            } else {
                                lieuxMap.set(nomNormalise, lieu);
                            }
                        }
                    });
                }

                return {
                    personnages: Array.from(personnagesMap.values()),
                    lieux: Array.from(lieuxMap.values())
                };
            }
            return { personnages: [], lieux: [] };
        } catch (error) {
            return { personnages: [], lieux: [] };
        }
    }

    extraireParagraphesJSON(jsonString) { return JsonCleaner.extraireParagraphesJSON(jsonString); }

    formatterParagraphes(paragraphes) { return JsonCleaner.formatterParagraphes(paragraphes); }
}

module.exports = Extracteur;