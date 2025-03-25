// service-texte/test/test-prompt-builder.js
const { PromptBuilder, ETAPES_NARRATIVES, CLES, nouveauConte } = require('../prompt-builder');
const chalk = require('chalk');

// Définition du prompt système pour l'afficher
const SYSTEM_PROMPT =
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
15. L'attribut etapeNarrative doit être Situation Initiale`;

const exempleQuestionnaireRempli = new Map(nouveauConte);
exempleQuestionnaireRempli.set(CLES.TITRE_CONTE, "Le Chevalier Nancéien");
exempleQuestionnaireRempli.set(CLES.TYPES_CONTE, "Aventure");
exempleQuestionnaireRempli.set(CLES.EPOQUE, "Moyen Âge");
exempleQuestionnaireRempli.set(CLES.LIEU, "Royaume de Nancy");
exempleQuestionnaireRempli.set(CLES.GENRE_PERSO, "Masculin");
exempleQuestionnaireRempli.set(CLES.VALEURS_PERSO, "Courage, Perseverance, Loyauté");
exempleQuestionnaireRempli.set(CLES.TRAITS_PERSO, "Brave, Tenace");
exempleQuestionnaireRempli.set(CLES.DESCRIPTION, "L'histoire d'un apprenti chevalier nancéien");

console.log(chalk.blue.bold("\n=== Questionnaire ==="));
for (const [cle, valeur] of exempleQuestionnaireRempli.entries()) {
    console.log(`${chalk.bold(cle)}: ${valeur}`);
}

// Affichage du prompt système avant le prompt généré
console.log(chalk.blue.bold("\n=== Prompt Système ==="));
console.log(SYSTEM_PROMPT);

console.log(chalk.blue.bold("\n=== Prompt Généré ==="));
const promptNouveauConte = PromptBuilder.genererPromptNouveauConte(exempleQuestionnaireRempli);

const lignesPrompt = promptNouveauConte.split('\n');
const sortiePrompt = [];

for (let i = 0; i < lignesPrompt.length; i++) {
    const ligne = lignesPrompt[i];

    if (ligne.startsWith("Génère") ||
        ligne.startsWith("Caractéristiques") ||
        ligne.startsWith("Description du conte") ||
        ligne.startsWith("Résultat attendu") ||
        ligne.startsWith("Règles importantes")) {
        sortiePrompt.push(chalk.bold(ligne));
        continue;
    }

    if (ligne.startsWith("-")) {
        sortiePrompt.push(ligne);
        continue;
    }

    if (ligne.includes("Structure du conte")) {
        sortiePrompt.push(chalk.bold(ligne));
        let j = i + 1;
        while (j < lignesPrompt.length && !lignesPrompt[j].startsWith("Règles importantes")) {
            sortiePrompt.push(lignesPrompt[j]);
            j++;
        }
        i = j - 1;
        continue;
    }

    if (ligne.startsWith("Règles importantes")) {
        continue;
    }

    sortiePrompt.push(ligne);
}

console.log(sortiePrompt.join('\n'));



const SYSTEM_PROMPT_CHAPITRE_SUIVANT = `
Tu es un générateur de contes pour enfants qui renvoie UNIQUEMENT un JSON valide sans aucun texte supplémentaire. 
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
12. Le conte aura EXACTEMENT 5 chapitres, un pour chaque étape narrative.`;

function afficherPromptSuite() {
    const conteExistant = {
        id: 123,
        titre: "Les Aventures de Léo",
        description: "Un jeune apprenti chevalier part à l'aventure pour prouver sa valeur.",
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
                description: "Villages menaçés par le dragon"
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

    const dernierChapitre = conteExistant.chapitres[0];

    console.log(chalk.blue.bold("\n=== CONTE EXISTANT ==="));
    console.log(chalk.yellow("Titre:"), conteExistant.titre);
    console.log(chalk.yellow("Description:"), conteExistant.description);
    console.log(chalk.yellow("Époque:"), conteExistant.epoque);
    console.log(chalk.yellow("Lieu initial:"), conteExistant.lieu);

    console.log(chalk.blue.bold("\n=== PERSONNAGES EXISTANTS ==="));
    conteExistant.personnages.forEach(p => {
        console.log(`- ${chalk.yellow(p.nom)}: ${p.archetype} - ${p.description}`);
    });

    console.log(chalk.blue.bold("\n=== LIEUX EXISTANTS ==="));
    conteExistant.lieux.forEach(l => {
        console.log(`- ${chalk.yellow(l.nom)}: ${l.description}`);
    });

    console.log(chalk.blue.bold("\n=== DERNIER CHAPITRE ==="));
    console.log(chalk.yellow("Titre:"), dernierChapitre.titre);
    console.log(chalk.yellow("Étape narrative:"), dernierChapitre.etapeNarrative);
    console.log(chalk.yellow("Contenu:"));
    dernierChapitre.paragraphes.forEach(p => {
        console.log(`\t${p}`);
    });

    console.log(chalk.blue.bold("\n=== PROMPT SYSTÈME ==="));
    console.log(SYSTEM_PROMPT_CHAPITRE_SUIVANT);

    const promptUtilisateur = PromptBuilder.genererPromptChapitreSuivant(conteExistant, dernierChapitre);

    console.log(chalk.blue.bold("\n=== PROMPT UTILISATEUR GÉNÉRÉ ==="));
    console.log(promptUtilisateur);

    const numeroProchainChapitre = conteExistant.chapitres.length + 1;
    const etapeSuivante = ETAPES_NARRATIVES[numeroProchainChapitre - 1];

    console.log(chalk.blue.bold("\n=== INFORMATION SUR L'ÉTAPE NARRATIVE ==="));
    console.log(chalk.yellow("Numéro du prochain chapitre:"), numeroProchainChapitre);
    console.log(chalk.yellow("Étape narrative correspondante:"), etapeSuivante);

    const match = promptUtilisateur.match(/ÉTAPE NARRATIVE À RESPECTER: "([^"]+)"/);
    if (match) {
        const etapeDansPrompt = match[1];
        console.log(chalk.yellow("Étape narrative dans le prompt:"), etapeDansPrompt);
        console.log(chalk.yellow("Correspondance avec étape attendue:"),
            etapeDansPrompt === etapeSuivante ? "OUI ✓" : "NON ✗");
    }
}

console.log(chalk.magenta.bold("===== TEST D'AFFICHAGE DU PROMPT DE CHAPITRE SUIVANT ====="));
afficherPromptSuite();