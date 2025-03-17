const Filter = require('bad-words');
const leoProfanity = require('leo-profanity');
const frenchBadwords = require('french-badwords-list').array;

const Moderateur = class {
    constructor() {
        this.filter = new Filter({ placeHolder: '*' });
        leoProfanity.loadDictionary('fr');
        leoProfanity.add(frenchBadwords);

        // Termes pas présents dans les bibliothèques
        this.termes = [
            'raciste', 'homophobe', 'antisémite', 'nazi', 'fasciste',
            'islamophobe', 'xénophobe', 'sexiste', 'misogyne', 'négrophobe', 'supremaciste',
            'aryien', 'nationaliste', 'ségregation', 'apartheid',
            'raciale', 'meurtre', 'tuer', 'mort', 'suicide', 'assassin', 'hitlerien', 'hitlérien', 'hitlerienne',
            'hitlérienne', 'violent', 'violence', 'sang', 'décès', 'abattre', 'égorger', 'étrangler', 'empoisonner',
            'massacrer', 'massacre', 'torturer', 'mutiler', 'décapiter', 'éventrer', 'lyncher', 'criminel', 'voleur',
            'terroriste', 'prison', 'drogue', 'fumer', 'cambrioler', 'braquer', 'dealer', 'trafic', 'bandit',
            'gangster', 'mafia', 'cartel', 'braqueur', 'cambrioleur', 'délinquant', 'escroc', 'fraudeur',
            'arnaqueur', 'proxénète', 'sexe', 'sexuel', 'pd', 'sexuelle', 'sexy', 'penis', 'pénis', 'zizi', 'zob',
            'vagin', 'seins', 'fesses', 'nu', 'nudité', 'nichons', 'nibards', 'tetons', 'chatte', 'queue', 'testicules',
            'orgasme', 'masturbation', 'sodomie', 'sodomite', 'fellation', 'cunnilingus', 'penetration',
            'organe', 'clitoris', 'anus', 'anal', 'vaginal', 'oral', 'alcool', 'bière', 'vin', 'vodka', 'whisky',
            'cigarette', 'alcoolique', 'joint', 'cannabis', 'cocaïne', 'héroïne', 'addiction', 'shoot', 'dose',
            'crack', 'ecstasy', 'mdma', 'lsd', 'meth', 'amphétamine', 'ketamine', 'opium', 'morphine',
            'toxicomane', 'junkie', 'skinhead', 'nsdap', 'nazisme', 'néonazi', 'kkk', 'reich',
            'identitaire', 'communautariste', 'communautarisme', 'divorce', 'cadavre', 'cercueil', 'morgue',
            'dépression', 'torture', 'viol', 'inceste', 'pédophilie', 'pédophile', 'nécrophilie',
            'zoophilie', 'zoophile', 'adultère', 'perversion', 'cancer', 'sida', 'charia', 'jihad', 'pistolet', 'fusil',
            'couteau', 'arme', 'bombe', 'explosif', 'flingue', 'mitraillette', 'cartouche', 'balle', 'poignard', 'grenade',
            'machette', 'calibre', 'munition', 'chargeur', 'gatling', 'kalachnikov', 'ak47', 'sniper', 'lance-roquettes',
            'missile', 'mine', 'dynamite', 'c4', 'incel', 'complotiste', 'conspirationniste', 'hitler', 'staline',
            'mussolini', 'franco', 'pinochet', 'pol pot', 'mao zedong', 'kim jong-il', 'kim jong-un', 'ben laden', 'porno',
            'pornographique'
        ];

        // Génération optimisée des variantes
        this.variantes = this.genererVariantes();
    }

    genererVariantes() {
        const variantes = new Set();

        for (const terme of this.termes) {
            variantes.add(terme);
            variantes.add(terme + 's'); // Pluriels
            // Pluriels en 'x'
            if (terme.endsWith('au') || terme.endsWith('eu') || terme.endsWith('al')) {
                variantes.add(terme.slice(0, -2) + 'aux');
            } else {
                variantes.add(terme + 'x');
            }
            // Féminisation
            if (terme.endsWith('eur') && !terme.endsWith('teur')) {
                variantes.add(terme.slice(0, -3) + 'euse');
                variantes.add(terme.slice(0, -3) + 'euses');
            } else if (terme.endsWith('teur')) {
                variantes.add(terme.slice(0, -4) + 'trice');
                variantes.add(terme.slice(0, -4) + 'trices');
            }
            // Adjectifs avec féminin en 'ive'
            if (terme.endsWith('if')) {
                variantes.add(terme.slice(0, -2) + 've');
                variantes.add(terme.slice(0, -2) + 'ves');
            }
            // Accents
            variantes.add(terme.replace(/e/g, 'é'));
            variantes.add(terme.replace(/e/g, 'è'));
            variantes.add(terme.replace(/a/g, 'à'));
            variantes.add(terme.replace(/ph/g, 'f'));
            variantes.add(terme.replace(/ai/g, 'é'));
            variantes.add(terme.replace(/é/g, 'ai'));
            // Séparateurs
            if (terme.includes('-')) {
                variantes.add(terme.replace(/-/g, ''));
                variantes.add(terme.replace(/-/g, '_'));
            }
        }

        return Array.from(variantes);
    }

    validerContenu(texte) {
        if (!texte || typeof texte !== 'string') return false;

        // Suppression des emojis et normalisation
        const sansEmoji = texte.replace(/[\u{1F600}-\u{1F64F}]/gu, '');
        const minuscules = sansEmoji.toLowerCase().trim();

        if (this.filter.isProfane(texte)) return false;
        if (leoProfanity.check(minuscules)) return false;

        for (const terme of this.variantes) {
            const regex = new RegExp(`\\b${terme}\\b`, 'i');
            if (regex.test(minuscules)) return false;
        }

        return true;
    }
}

module.exports = Moderateur;