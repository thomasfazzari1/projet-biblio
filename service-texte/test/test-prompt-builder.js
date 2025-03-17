// service-texte/test/test-prompt-builder.js
const { PromptBuilder, CLES, nouveauConte } = require('../prompt-builder');
const chalk = require('chalk');

// Définition du prompt système pour l'afficher
const SYSTEM_PROMPT = `Tu es un générateur de contes pour enfants qui renvoie UNIQUEMENT un JSON valide sans aucun texte supplémentaire. 
Ne pas inclure de texte explicatif. Ne pas utiliser de préfixes tels que P1:, P2: dans les paragraphes.
La structure doit être exactement: {titre, description, chapitren: {titre, etapeNarrative, paragraphes}, 
personnages: [{nom, archetype, description}], lieux: [{nom, description}]} où n est le numéro du chapitre.
Pour chaque personnage, fournir un archetype précis (Héros, Mentor, Allié, Antagoniste, etc.) et une description détaillée.

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
    },
    "personnages": [
        {
            "nom": "string (15 caractères max)",
            "archetype": "string (15 caractères max)",
            "description": "string (40 caractères max)"
        }
    ],
    "lieux": [
        {
            "nom": "string (15 caractères max)",
            "description": "string (40 caractères max)"
        }
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
8. La fin du chapitre doit rester en suspens
9. Les paragraphes doivent comprendre des phrases simples
10. Pour chaque personnage, fournir un archetype précis (Héros, Mentor, Allié, etc.)
11. Pour chaque personnage, fournir une description BRÈVE (max 40 caractères)
12. Pour chaque lieu, fournir une description BRÈVE (max 40 caractères)
13. Tous les NOMS doivent être COURTS (max 15 caractères)
14. Tous les TITRES doivent être COURTS (max 30 caractères)
15. L'attribut etapeNarrative doit rester court (max 20 caractères)`;

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