// service-texte/test/test-generateur.js
const Generateur = require('../generateur');
const { PromptBuilder, CLES, nouveauConte, ETAPES_NARRATIVES } = require('../prompt-builder');
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

// Exemple d'un conte existant avec son premier chapitre
const exempleConteExistant = {
    id: 123,
    titre: "Le Chevalier Nancéien",
    description: "L'histoire d'un apprenti chevalier nancéien",
    epoque: "Moyen Âge",
    lieu: "Royaume de Nancy",
    personnages: [
        {
            nom: "Léo",
            archetype: "Héros",
            description: "Jeune apprenti chevalier"
        },
        {
            nom: "Le roi",
            archetype: "Mentor",
            description: "Souverain du Royaume de Nancy"
        },
        {
            nom: "Le dragon",
            archetype: "Antagoniste",
            description: "Créature menaçante"
        }
    ],
    lieux: [
        {
            nom: "Royaume de Nancy",
            description: "Royaume où vit Léo"
        },
        {
            nom: "Villages voisins",
            description: "Villages menacés par le dragon"
        }
    ],
    chapitres: [
        {
            numero: 1,
            titre: "L'Apprenti Chevalier",
            etapeNarrative: "Situation Initiale",
            paragraphes: [
                "Dans le Royaume de Nancy, vivait un jeune apprenti chevalier nommé Léo. Il rêvait de devenir un véritable chevalier, mais il n'avait pas encore prouvé sa valeur.",
                "Un jour, le roi annonça un tournoi pour trouver le meilleur chevalier du royaume. Léo décida de participer, même s'il savait que la compétition serait rude.",
                "Pendant qu'il s'entraînait, il entendit parler d'un dragon qui menaçait les villages voisins."
            ]
        }
    ]
};

async function executerTest() {
    try {
        // Test de génération d'un nouveau conte
        console.log(chalk.blue.bold("\n=== TEST GÉNÉRATION NOUVEAU CONTE ==="));
        const reponseJSON = await Generateur.genererConte(exempleQuestionnaireRempli);

        console.log(chalk.blue.bold("\n=== Réponse brute de Mistral ==="));
        console.log(reponseJSON);

        const reponseNettoyee = Generateur.nettoyerReponse(reponseJSON);

        console.log(chalk.blue.bold("\n=== Réponse nettoyée ==="));
        console.log(reponseNettoyee);

        // Test de génération d'un chapitre suivant
        console.log(chalk.blue.bold("\n=== TEST GÉNÉRATION CHAPITRE SUIVANT ==="));

        // Afficher les informations du conte existant
        console.log(chalk.blue.bold("\n=== CONTE EXISTANT ==="));
        console.log(chalk.yellow("Titre:"), exempleConteExistant.titre);
        console.log(chalk.yellow("Description:"), exempleConteExistant.description);
        console.log(chalk.yellow("Époque:"), exempleConteExistant.epoque);
        console.log(chalk.yellow("Lieu initial:"), exempleConteExistant.lieu);

        console.log(chalk.blue.bold("\n=== PERSONNAGES EXISTANTS ==="));
        exempleConteExistant.personnages.forEach(p => {
            console.log(`- ${chalk.yellow(p.nom)}: ${p.archetype} - ${p.description}`);
        });

        console.log(chalk.blue.bold("\n=== LIEUX EXISTANTS ==="));
        exempleConteExistant.lieux.forEach(l => {
            console.log(`- ${chalk.yellow(l.nom)}: ${l.description}`);
        });

        const dernierChapitre = exempleConteExistant.chapitres[0];

        console.log(chalk.blue.bold("\n=== DERNIER CHAPITRE ==="));
        console.log(chalk.yellow("Titre:"), dernierChapitre.titre);
        console.log(chalk.yellow("Étape narrative:"), dernierChapitre.etapeNarrative);
        console.log(chalk.yellow("Contenu:"));
        dernierChapitre.paragraphes.forEach(p => {
            console.log(`\t${p}`);
        });

        // Afficher le prompt qui sera utilisé
        const promptUtilisateur = PromptBuilder.genererPromptChapitreSuivant(exempleConteExistant, dernierChapitre);
        console.log(chalk.blue.bold("\n=== PROMPT UTILISATEUR GÉNÉRÉ ==="));
        console.log(promptUtilisateur);

        // Générer le chapitre suivant
        const reponseChapitreSuivant = await Generateur.genererChapitreSuivant(exempleConteExistant, dernierChapitre);

        console.log(chalk.blue.bold("\n=== Réponse brute pour chapitre suivant ==="));
        console.log(reponseChapitreSuivant);

        const reponseChapitreSuivantNettoyee = Generateur.nettoyerReponse(reponseChapitreSuivant);

        console.log(chalk.blue.bold("\n=== Réponse nettoyée pour chapitre suivant ==="));
        console.log(reponseChapitreSuivantNettoyee);

        // Afficher quelle étape narrative était attendue
        const numeroProchainChapitre = exempleConteExistant.chapitres.length + 1;
        const etapeSuivante = ETAPES_NARRATIVES[numeroProchainChapitre - 1];
        console.log(chalk.yellow.bold(`\nÉtape narrative attendue pour le chapitre ${numeroProchainChapitre}: ${etapeSuivante}`));

        // Extraire l'étape narrative du prompt
        const match = promptUtilisateur.match(/ÉTAPE NARRATIVE À RESPECTER: "([^"]+)"/);
        if (match) {
            const etapeDansPrompt = match[1];
            console.log(chalk.yellow.bold(`Étape narrative dans le prompt: ${etapeDansPrompt}`));
            console.log(chalk.yellow.bold(`Correspondance avec étape attendue: ${etapeDansPrompt === etapeSuivante ? "OUI ✓" : "NON ✗"}`));
        }

        // Tenter de parser la réponse pour voir si l'étape narrative correspond
        try {
            const chapitreSuivantObj = JSON.parse(reponseChapitreSuivantNettoyee);
            console.log(chalk.yellow.bold(`Étape narrative dans la réponse: ${chapitreSuivantObj.etapeNarrative}`));
            console.log(chalk.yellow.bold(`Correspondance avec étape attendue: ${chapitreSuivantObj.etapeNarrative === etapeSuivante ? "OUI ✓" : "NON ✗"}`));
        } catch (e) {
            console.error(chalk.red("Impossible de parser la réponse JSON"));
        }

    } catch (error) {
        console.error(`Erreur: ${error.message}`);
    }
}

executerTest();