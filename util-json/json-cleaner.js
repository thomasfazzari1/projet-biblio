class JsonCleaner {
    static nettoyerReponse(reponse) {
        const json = reponse.match(/(\{[\s\S]*\})/);
        if (json) {
            reponse = json[1];
        }

        try {
            JSON.parse(reponse);
            return reponse;
        } catch (e) {
            //Clés sans guillemets
            let jsonNettoye = reponse.replace(/([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":');

            try {
                JSON.parse(jsonNettoye);
                return jsonNettoye;
            } catch (e2) {
                return reponse;
            }
        }
    }

    static extraireParagraphesJSON(jsonString) {
        try {
            // JSON déjà parsé
            if (typeof jsonString === 'object' && jsonString !== null) {
                if (jsonString.chapitre1?.paragraphes) {
                    return jsonString.chapitre1.paragraphes
                        .map(p => typeof p === 'string' ? p.trim() : '')
                        .filter(Boolean);
                }
                return null;
            }

            // Chaîne JSON
            if (typeof jsonString === 'string' && jsonString.includes('{')) {
                try {
                    // On tente d'extraire un objet JSON valide
                    const match = jsonString.match(/\{[\s\S]*\}/);
                    if (match) {
                        const parsed = JSON.parse(match[0]);
                        if (parsed.paragraphes) {
                            return parsed.paragraphes.map(p => p.trim()).filter(Boolean);
                        } else if (parsed.chapitre1?.paragraphes) {
                            return parsed.chapitre1.paragraphes.map(p => p.trim()).filter(Boolean);
                        }
                    }
                } catch (e) {
                    // Si échec on extrait au moins les paragraphes préfixés
                    const pLines = jsonString.match(/P\d+\s*:\s*"([^"]+)"/g);
                    if (pLines?.length) {
                        return pLines.map(line => {
                            const match = line.match(/P\d+\s*:\s*"([^"]+)"/);
                            return match ? match[1].trim() : '';
                        }).filter(Boolean);
                    }
                }
            }

            return null;
        } catch (e) {
            return null;
        }
    }

    static formatterParagraphes(paragraphes) {
        // Chaîne JSON
        if (typeof paragraphes === 'string' && paragraphes.includes('{')) {
            const paragraphesJSON = this.extraireParagraphesJSON(paragraphes);
            if (paragraphesJSON && paragraphesJSON.length > 0) {
                return paragraphesJSON;
            }
        }

        // Tableau contenant du JSON
        if (Array.isArray(paragraphes) && paragraphes.some(p =>
            typeof p === 'string' && (p.includes('{') || p.includes('paragraphes')))) {

            // Reconstruction du JSON
            const joinedText = paragraphes.join(' ');
            const paragraphesJSON = this.extraireParagraphesJSON(joinedText);
            if (paragraphesJSON && paragraphesJSON.length > 0) {
                return paragraphesJSON;
            }
        }

        // Tableau normal
        if (Array.isArray(paragraphes)) {
            return paragraphes
                .filter(p => typeof p === 'string' && p.trim().length > 0)
                .map(p => p.replace(/^P\d+\s*:\s*/, '').replace(/^"(.*)"$/, '$1').trim())
                .filter(p => p.length > 0);
        }

        // Chaîne simple = Division en paragraphes
        if (typeof paragraphes === 'string') {
            return paragraphes
                .split(/\n\n|\r\n\r\n/)
                .map(p => p.replace(/^P\d+\s*:\s*/, '').trim())
                .filter(p => p.length > 0);
        }
        return [];
    }

    // Normalise les noms de lieux
    static normaliserNomLieu(nom) {
        let nomNormalise = nom.toLowerCase().trim();
        // Suppression articles et prépositions
        nomNormalise = nomNormalise.replace(/^(le |la |les |l['']|du |de la |des |de l[''])/i, '');
        // Suppression typologies de lieux
        nomNormalise = nomNormalise.replace(/^(village(?: de)? |ville(?: de)? |forêt(?: de)? |château(?: de)? |royaume(?: de)? |montagne(?: de)? |caverne(?: de)? |grotte(?: de)? |pays(?: de)? |île(?: de)? |lac(?: de)? |rivière(?: de)? |vallon(?: de)? |vallée(?: de)? |colline(?: de)? )/i, '');
        // Suppression qualificatifs
        nomNormalise = nomNormalise.replace(/(mystérieuse|mystérieux|sombre|magique|enchanté[e]?|ancien[ne]?|verdoyant[e]?|grand[e]?|petit[e]?|profond[e]?)$/i, '').trim();
        // Suppression "des" et "de" à la fin
        nomNormalise = nomNormalise.replace(/\s+(des|de|du)$/i, '').trim();
        // Singularisation
        if (nomNormalise.endsWith('s') && !nomNormalise.endsWith('as') && !nomNormalise.endsWith('is') && !nomNormalise.endsWith('us') && !nomNormalise.endsWith('os')) {
            nomNormalise = nomNormalise.slice(0, -1);
        }

        return nomNormalise;
    }

    // Normalise les noms de persos
    static normaliserNomPersonnage(nom) {
        let nomNormalise = nom.toLowerCase().trim();
        // Suppression articles et prépositions
        nomNormalise = nomNormalise.replace(/^(le |la |les |l[''])/i, '');
        // Suppression titres
        nomNormalise = nomNormalise.replace(/^(roi |reine |prince |princesse |seigneur |dame |chevalier |magicien |sorcier |fée |monstre |géant |nain |elfe |gobelin |dragon )/i, '');
        // Supprimession qualificatifs
        nomNormalise = nomNormalise.replace(/^(petit |grand |jeune |vieux |vieille |ancien |ancienne |sage |brave |noble |honorable |pauvre |riche )/i, '');
        // Suppression adjectifs descriptifs
        nomNormalise = nomNormalise.replace(/(mystérieux|mystérieuse|sage|blanc|blanche|noir|noire|vert|verte|bleu|bleue|rouge|doré|dorée|argenté|argentée|puissant|puissante|intelligent|intelligente|rusé|rusée|courageux|courageuse|timide)$/i, '').trim();
        // Suppression mentions
        nomNormalise = nomNormalise.replace(/(en détresse|blessé|perdu|égaré|magique|enchanté)$/i, '').trim();

        return nomNormalise;
    }
}

module.exports = { JsonCleaner };