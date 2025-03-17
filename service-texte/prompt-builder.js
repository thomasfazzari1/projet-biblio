// service-texte/prompt-builder.js
const { JsonCleaner } = require('./util-json');

const ETAPES_NARRATIVES = [
    "Situation Initiale",
    "Élément Perturbateur",
    "Péripéties",
    "Élément de Résolution",
    "Situation Finale"
];

const CLES = {
    TITRE_CONTE: "Titre du conte",
    TYPES_CONTE: "Types de conte",
    EPOQUE: "Epoque souhaitée",
    LIEU: "Lieu souhaité",
    GENRE_PERSO: "Genre du personnage principal",
    VALEURS_PERSO: "Valeurs représentées par le personnage principal",
    TRAITS_PERSO: "Traits de caractère du personnage principal",
    DESCRIPTION: "Description"
};

let nouveauConte = new Map(Object.entries(CLES).map(([key, value]) => [value, null]));

const PromptBuilder = {
    genererPromptNouveauConte(conte) {
        return [
            "Génère le premier chapitre d'un conte pour enfant en respectant STRICTEMENT les spécifications suivantes :",
            `- Titre : ${conte.get(CLES.TITRE_CONTE)}`,
            `- Type(s) souhaité(s) : ${conte.get(CLES.TYPES_CONTE)}`,
            `- Époque souhaitée : ${conte.get(CLES.EPOQUE)}`,
            `- Lieu souhaité : ${conte.get(CLES.LIEU)}`,
            "Caractéristiques du personnage principal :",
            `- Genre : ${conte.get(CLES.GENRE_PERSO)}`,
            `- Valeurs : ${conte.get(CLES.VALEURS_PERSO)}`,
            `- Traits de caractère : ${conte.get(CLES.TRAITS_PERSO)}`,
            "Description du conte :",
            conte.get(CLES.DESCRIPTION)
        ].join("\n");
    },

    genererPromptChapitreSuivant(conte, dernierChapitre) {
        // On détermine l'étape narrative pour le chapitre
        const numeroProchainChapitre = conte.chapitres ? conte.chapitres.length + 1 : 2;

        // On s'assure que nb chap <= 5 (un par étape narrative)
        if (numeroProchainChapitre > ETAPES_NARRATIVES.length) {
            return null;
        }

        const etapeSuggestion = ETAPES_NARRATIVES[numeroProchainChapitre - 1];

        let personnagesListe = '';
        if (conte.personnages && conte.personnages.length > 0) {
            personnagesListe = conte.personnages
                .filter(p => p && p.nom)
                .map(p => `- ${p.nom}: ${p.archetype || 'Personnage'} - ${p.description || 'Personnage du conte'}`)
                .join('\n');
        } else if (conte.personnages_noms && conte.personnages_noms.length > 0) {
            personnagesListe = conte.personnages_noms
                .filter(Boolean)
                .map(nom => `- ${nom}`)
                .join('\n');
        }

        // Lieux existants avec unification des noms
        let lieuxUniques = new Map();
        let lieuxListe = '';

        if (conte.lieux && conte.lieux.length > 0) {
            // Lieux par noms
            conte.lieux
                .filter(l => l && l.nom)
                .forEach(lieu => {
                    const nomNormalise = JsonCleaner.normaliserNomLieu(lieu.nom);
                    if (!lieuxUniques.has(nomNormalise) || lieuxUniques.get(nomNormalise).description.length < lieu.description.length) {
                        lieuxUniques.set(nomNormalise, lieu);
                    }
                });

            lieuxListe = Array.from(lieuxUniques.values())
                .map(l => `- ${l.nom}: ${l.description || 'Lieu du conte'}`)
                .join('\n');
        } else if (conte.lieux_noms && conte.lieux_noms.length > 0) {
            // Noms des lieux unifiés
            const nomsUniques = new Map();
            conte.lieux_noms
                .filter(Boolean)
                .forEach(nom => {
                    const nomNormalise = JsonCleaner.normaliserNomLieu(nom);
                    if (!nomsUniques.has(nomNormalise)) {
                        nomsUniques.set(nomNormalise, nom);
                    }
                });

            lieuxListe = Array.from(nomsUniques.values())
                .map(nom => `- ${nom}`)
                .join('\n');
        }

        // Contenu du dernier chapitre
        let dernierChapitreContenu = '';
        if (dernierChapitre) {
            if (Array.isArray(dernierChapitre.paragraphes)) {
                dernierChapitreContenu = dernierChapitre.paragraphes.join('\n\n');
            } else if (dernierChapitre.contenu) {
                try {
                    const contenuParse = JSON.parse(dernierChapitre.contenu);
                    dernierChapitreContenu = Array.isArray(contenuParse) ? contenuParse.join('\n\n') : dernierChapitre.contenu;
                } catch (e) {
                    dernierChapitreContenu = dernierChapitre.contenu;
                }
            }
        }

        return [
            `Génère le chapitre ${numeroProchainChapitre} d'un conte pour enfant intitulé "${conte.titre}" en respectant strictement les éléments suivants:`,
            `Description du conte: ${conte.description || ''}`,
            `Époque: ${conte.epoque || ''}`,
            `Lieu initial: ${conte.lieu || ''}`,
            `ÉTAPE NARRATIVE À RESPECTER: "${etapeSuggestion}"`,
            `PERSONNAGES EXISTANTS:`,
            personnagesListe || 'Aucun personnage défini.',
            `LIEUX EXISTANTS:`,
            lieuxListe || 'Aucun lieu défini.',
            `DERNIER CHAPITRE (Chapitre ${numeroProchainChapitre-1}):`,
            dernierChapitreContenu || ''
        ].filter(Boolean).join('\n');
    }
};

module.exports = { PromptBuilder, CLES, nouveauConte, ETAPES_NARRATIVES };