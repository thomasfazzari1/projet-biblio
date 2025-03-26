// service-texte/generateur.js
const { Mistral } = require('@mistralai/mistralai');
require('dotenv').config();
const Moderateur = require('./moderateur');
const { PromptBuilder } = require('./prompt-builder');
const { JsonCleaner } = require('./util-json');

const API_KEY = process.env.MISTRAL_API_KEY;
if (!API_KEY) {
    console.error('MISTRAL_API_KEY non définie');
    process.exit(1);
}

const Generateur = {
    client: new Mistral({ apiKey: API_KEY }),
    model: 'mistral-large-latest',
    moderateur: new Moderateur(),

    async genererConte(parametres) {
        const prompt = PromptBuilder.genererPromptNouveauConte(parametres);

        if (!this.moderateur.validerContenu(prompt)) {
            throw new Error('Contenu inapproprié détecté');
        }

        try {
            let response = await this.client.chat.complete({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content:
                            `Tu es un générateur de contes pour enfants qui renvoie UNIQUEMENT un JSON valide sans aucun texte supplémentaire. 
                        Ne pas inclure de texte explicatif. Ne pas utiliser de préfixes tels que P1:, P2: dans les paragraphes.
                        La structure doit être exactement: {titre, description, chapitren: {titre, etapeNarrative, paragraphes} 
                        où n est le numéro du chapitre.

                        Structure du conte (RESPECTER CE FORMAT EXACT) :
                        {
                            "titre": "string (30 caractères max)",
                            "description": "string (50 mots max)",
                            "chapitre1": {
                                "titre": "string (30 caractères max)",
                                "etapeNarrative": "Situation Initiale",
                                "paragraphes": [
                                    "Premier paragraphe détaillé (3-4 phrases)",
                                    "Deuxième paragraphe détaillé (3-4 phrases)",
                                    "Troisième paragraphe détaillé (3-4 phrases)"
                                ]
                            }
                        }

                        Règles importantes:
                        1. Répondre UNIQUEMENT avec le JSON valide et rien d'autre
                        2. Ne pas inclure de texte explicatif avant ou après le JSON
                        3. NE PAS utiliser de préfixes tels que P1:, P2:, etc. dans les paragraphes
                        4. Chaque paragraphe doit être une string simple dans le tableau paragraphes
                        5. TOUS les guillemets doivent être échappés correctement
                        6. La structure du JSON ne doit jamais être modifiée
                        7. L'histoire doit être adaptée aux enfants
                        8. La fin du chapitre doit rester en suspens
                        9. Les paragraphes doivent comprendre des phrases simples
                        13. Tous les NOMS doivent être COURTS (max 15 caractères)
                        14. Tous les TITRES doivent être COURTS (max 30 caractères)
                        15. L'attribut etapeNarrative doit être Situation Initiale`
                    },

                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1500,
            });

            return response.choices[0].message.content;
        } catch (error) {
            throw error;
        }
    },

    async genererChapitreSuivant(conte, dernierChapitre) {
        const prompt = PromptBuilder.genererPromptChapitreSuivant(conte, dernierChapitre);

        try {
            const response = await this.client.chat.complete({
                model: this.model,
                messages: [
                    {
                        role: 'system',
                        content:
                            `Tu es un générateur de contes pour enfants qui renvoie UNIQUEMENT un JSON valide sans aucun texte supplémentaire. 
                        Ne pas inclure de texte explicatif. Ne pas utiliser de préfixes tels que P1:, P2: dans les paragraphes.
                        La structure doit être exactement: {titre, etapeNarrative, paragraphes. 

                        Structure du chapitre (RESPECTER CE FORMAT EXACT) :
                        {
                            "titre": "string (30 caractères max)",
                            "etapeNarrative": "string (20 caractères max)",
                            "paragraphes": [
                                "Premier paragraphe détaillé (3-4 phrases)",
                                "Deuxième paragraphe détaillé (3-4 phrases)",
                                "Troisième paragraphe détaillé (3-4 phrases)"
                            ]
                        }

                        Règles importantes:
                        1. Répondre UNIQUEMENT avec le JSON valide et rien d'autre
                        2. Ne pas inclure de texte explicatif avant ou après le JSON
                        3. NE PAS utiliser de préfixes tels que P1:, P2:, etc. dans les paragraphes
                        4. Chaque paragraphe doit être une string simple dans le tableau paragraphes
                        5. TOUS les guillemets doivent être échappés correctement
                        6. La structure du JSON ne doit jamais être modifiée
                        7. L'histoire doit être adaptée aux enfants
                        8. Les paragraphes doivent comprendre des phrases simples
                        9. Respecter la continuité narrative avec le chapitre précédent
                        10. Assurer la cohérence des personnages, lieux et événements
                        11. Le titre du chapitre doit être COURT (max 30 caractères)
                        12. Le conte aura EXACTEMENT 5 chapitres, un pour chaque étape narrative.`
                    },

                    { role: 'user', content: prompt }
                ],
                temperature: 0.7,
                max_tokens: 1500,
            });

            return response.choices[0].message.content;
        } catch (error) {
            throw error;
        }
    },

    nettoyerReponse(reponse) {
        return JsonCleaner.nettoyerReponse(reponse);
    }
};

module.exports = Generateur;