// service-texte/test/test-generateur.js
const Generateur = require('../generateur');
const { PromptBuilder, CLES, nouveauConte } = require('../prompt-builder');
const chalk = require('chalk');

const exempleQuestionnaireRempli = new Map(nouveauConte);
exempleQuestionnaireRempli.set(CLES.TITRE_CONTE, "Le Chevalier Nancéien");
exempleQuestionnaireRempli.set(CLES.TYPES_CONTE, "Aventure");
exempleQuestionnaireRempli.set(CLES.EPOQUE, "Moyen Âge");
exempleQuestionnaireRempli.set(CLES.LIEU, "Royaume de Nancy");
exempleQuestionnaireRempli.set(CLES.GENRE_PERSO, "Masculin");
exempleQuestionnaireRempli.set(CLES.VALEURS_PERSO, "Courage, Perseverance, Loyauté");
exempleQuestionnaireRempli.set(CLES.TRAITS_PERSO, "Brave, Tenace");
exempleQuestionnaireRempli.set(CLES.DESCRIPTION, "L'histoire d'un apprenti chevalier nancéien");

async function executerTest() {
    try {
        const reponseJSON = await Generateur.genererConte(exempleQuestionnaireRempli);

        console.log(chalk.blue.bold("\n=== Réponse brute de Mistral ==="));
        console.log(reponseJSON);

        const reponseNettoyee = Generateur.nettoyerReponse(reponseJSON);

        console.log(chalk.blue.bold("\n=== Réponse nettoyée ==="));
        console.log(reponseNettoyee);

    } catch (error) {
        console.error(`Erreur: ${error.message}`);
    }
}

executerTest();