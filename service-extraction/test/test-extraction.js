const Extracteur = require('../extracteur');
const chalk = require('chalk');

async function testExtraction() {
    const extracteur = new Extracteur();

    const conteChevalierNanceien = `
Dans le Royaume de Nancy, vivait un jeune apprenti chevalier nommé Léo. Il rêvait de devenir un véritable chevalier, mais il n'avait pas encore prouvé sa valeur.
Un jour, le roi annonça un tournoi pour trouver le meilleur chevalier du royaume. Léo décida de participer, même s'il savait que la compétition serait rude.
Pendant qu'il s'entraînait, il entendit parler d'un dragon qui menaçait les villages voisins.
`;

    console.log(chalk.blue.bold("=== PROMPT ENVOYÉ ==="));
    const promptExtraction = `Voici un conte : "${conteChevalierNanceien}"

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
}`;
    console.log(promptExtraction);
    console.log(chalk.blue.bold("\n=== RÉSULTAT DE L'EXTRACTION ==="));
    const resultat = await extracteur.extraireEntites(conteChevalierNanceien);
    console.log(JSON.stringify(resultat, null, 2));
}

testExtraction();