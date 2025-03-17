// frontend/public/js/questionnaire.js
import { TypeConte, Valeur, TraitCaractere } from './enums.js';

const questions = [
    "Quel titre souhaitez-vous donner à ce conte ?",
    "Quel type de conte décrit le mieux l'histoire que vous souhaitez générer ?",
    "Souhaitez-vous que l'histoire se déroule à une époque particulière ?",
    "Souhaitez-vous que l'histoire se déroule dans un lieu particulier ?",
    "Quel est le genre du personnage principal ?",
    "Parmi ces valeurs, lesquelles décrivent le mieux votre héros/héroïne ?",
    "Parmi ces traits de caractères, lesquels décrivent le mieux votre héros/héroïne ?",
    "Décrivez brièvement votre conte (200 mots maximum)"
];

let indexQuestionActuelle = 0;
let reponses = {
    TITRE_CONTE: '',
    TYPES_CONTE: '',
    EPOQUE: '',
    LIEU: '',
    GENRE_PERSO: '',
    VALEURS_PERSO: '',
    TRAITS_PERSO: '',
    DESCRIPTION: ''
};

export function initialiserQuestionnaire() {
    const conteneurQuestionnaire = document.getElementById('questionnaire-container');
    if (!conteneurQuestionnaire) return;

    afficherQuestionCourante();

    document.getElementById('next-question')?.addEventListener('click', () => {
        if (validerQuestionCourante()) {
            enregistrerReponse();

            if (indexQuestionActuelle < questions.length - 1) {
                indexQuestionActuelle++;
                afficherQuestionCourante();
            } else {
                envoyerQuestionnaire();
            }
        }
    });

    document.getElementById('prev-question')?.addEventListener('click', () => {
        if (indexQuestionActuelle > 0) {
            enregistrerReponse();
            indexQuestionActuelle--;
            afficherQuestionCourante();
        }
    });
}

function validerQuestionCourante() {
    switch (indexQuestionActuelle) {
        case 0: // Titre
            const titre = document.getElementById('titre').value.trim();
            if (!titre) {
                alert('Veuillez saisir un titre pour votre conte');
                return false;
            }
            return true;

        case 1: // Type de conte
            const typeChecked = document.querySelector('input[name="type"]:checked');
            if (!typeChecked) {
                alert('Veuillez sélectionner un type de conte');
                return false;
            }
            return true;

        case 4: // Genre héros
            const genreChecked = document.querySelector('input[name="genre"]:checked');
            if (!genreChecked) {
                alert('Veuillez sélectionner le genre du personnage principal');
                return false;
            }
            return true;

        case 5: // Valeurs héros
            const valeursChecked = document.querySelectorAll('input[name="valeur"]:checked');
            if (valeursChecked.length === 0) {
                alert('Veuillez sélectionner au moins une valeur');
                return false;
            }
            return true;

        case 6: // Traits héros
            const traitsChecked = document.querySelectorAll('input[name="trait"]:checked');
            if (traitsChecked.length === 0) {
                alert('Veuillez sélectionner au moins un trait de caractère');
                return false;
            }
            return true;

        case 7: // Desc
            const description = document.getElementById('description').value.trim();
            if (!description) {
                alert('Veuillez saisir une description pour votre conte');
                return false;
            }
            if (description.split(/\s+/).length > 200) {
                alert('La description ne doit pas dépasser 200 mots');
                return false;
            }
            return true;

        default:
            return true;
    }
}

function afficherQuestionCourante() {
    const contenuQuestionnaire = document.getElementById('questionnaire-content');
    if (!contenuQuestionnaire) return;

    document.getElementById('question-progress').textContent = `Question ${indexQuestionActuelle + 1}/${questions.length}`;

    const barreProgression = document.getElementById('progress-bar');
    barreProgression.style.width = `${((indexQuestionActuelle + 1) / questions.length) * 100}%`;

    document.getElementById('question-text').textContent = questions[indexQuestionActuelle];

    const conteneurSaisie = document.getElementById('question-input');
    conteneurSaisie.innerHTML = '';

    switch (indexQuestionActuelle) {
        case 0: // Titre
            conteneurSaisie.innerHTML = `<input type="text" id="titre" class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white" placeholder="Titre de votre conte" value="${reponses.TITRE_CONTE || ''}">`;
            break;

        case 1: // Type de conte
            const grilleTypes = document.createElement('div');
            grilleTypes.className = 'grid grid-cols-2 gap-3';

            Object.entries(TypeConte).forEach(([key, value]) => {
                const div = document.createElement('div');
                div.className = 'group relative';
                div.innerHTML = `
                    <input type="radio" id="${key.toLowerCase()}" name="type" value="${value}" class="peer hidden" ${reponses.TYPES_CONTE === value ? 'checked' : ''}>
                    <label for="${key.toLowerCase()}" 
                        class="inline-flex justify-center w-full cursor-pointer text-sm px-3 py-1 rounded-full
                        border border-gray-600 text-gray-400
                        peer-checked:border-blue-500 peer-checked:text-blue-400 peer-checked:bg-blue-500/10
                        hover:border-blue-400/50 hover:text-blue-300
                        transition-all duration-200">
                        ${value}
                    </label>
                `;
                grilleTypes.appendChild(div);
            });
            conteneurSaisie.appendChild(grilleTypes);
            break;

        case 2: // Epoque
            conteneurSaisie.innerHTML = `<input type="text" id="epoque" class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white" placeholder="Moderne, Moyen-Âge, Futur..." value="${reponses.EPOQUE || ''}">`;
            break;

        case 3: // Lieux
            conteneurSaisie.innerHTML = `<input type="text" id="lieu" class="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white" placeholder="Forêt, Ville, Océan..." value="${reponses.LIEU || ''}">`;
            break;

        case 4: // Genre héros
            conteneurSaisie.innerHTML = `
                <div class="flex gap-4">
                    <div class="flex-1">
                        <input type="radio" id="genre-masculin" name="genre" value="Masculin" class="peer hidden" ${reponses.GENRE_PERSO === 'Masculin' ? 'checked' : ''}>
                        <label for="genre-masculin" 
                            class="flex justify-center w-full cursor-pointer py-2 rounded-lg
                            border border-gray-600 text-gray-400
                            peer-checked:border-blue-500 peer-checked:text-blue-400 peer-checked:bg-blue-500/10
                            hover:border-blue-400/50 hover:text-blue-300
                            transition-all duration-200">
                            Masculin
                        </label>
                    </div>
                    <div class="flex-1">
                        <input type="radio" id="genre-feminin" name="genre" value="Féminin" class="peer hidden" ${reponses.GENRE_PERSO === 'Féminin' ? 'checked' : ''}>
                        <label for="genre-feminin" 
                            class="flex justify-center w-full cursor-pointer py-2 rounded-lg
                            border border-gray-600 text-gray-400
                            peer-checked:border-blue-500 peer-checked:text-blue-400 peer-checked:bg-blue-500/10
                            hover:border-blue-400/50 hover:text-blue-300
                            transition-all duration-200">
                            Féminin
                        </label>
                    </div>
                    <div class="flex-1">
                        <input type="radio" id="genre-neutre" name="genre" value="Non spécifié" class="peer hidden" ${reponses.GENRE_PERSO === 'Non spécifié' ? 'checked' : ''}>
                        <label for="genre-neutre" 
                            class="flex justify-center w-full cursor-pointer py-2 rounded-lg
                            border border-gray-600 text-gray-400
                            peer-checked:border-blue-500 peer-checked:text-blue-400 peer-checked:bg-blue-500/10
                            hover:border-blue-400/50 hover:text-blue-300
                            transition-all duration-200">
                            Non spécifié
                        </label>
                    </div>
                </div>
            `;
            break;

        case 5: // Valeurs héros
            const grilleValeurs = document.createElement('div');
            grilleValeurs.className = 'grid grid-cols-3 gap-3';

            Object.entries(Valeur).forEach(([key, value]) => {
                const div = document.createElement('div');
                div.className = 'group relative';
                div.innerHTML = `
                    <input type="checkbox" id="${key.toLowerCase()}" name="valeur" value="${value}" class="peer hidden" ${reponses.VALEURS_PERSO?.includes(value) ? 'checked' : ''}>
                    <label for="${key.toLowerCase()}" 
                        class="inline-flex justify-center w-full cursor-pointer text-sm px-3 py-1 rounded-full
                        border border-gray-600 text-gray-400
                        peer-checked:border-blue-500 peer-checked:text-blue-400 peer-checked:bg-blue-500/10
                        hover:border-blue-400/50 hover:text-blue-300
                        transition-all duration-200">
                        ${value}
                    </label>
                `;
                grilleValeurs.appendChild(div);
            });
            conteneurSaisie.appendChild(grilleValeurs);
            break;

        case 6: // Traits du héros
            const grilleTraits = document.createElement('div');
            grilleTraits.className = 'grid grid-cols-3 gap-3';

            Object.entries(TraitCaractere).forEach(([key, value]) => {
                const div = document.createElement('div');
                div.className = 'group relative';
                div.innerHTML = `
                    <input type="checkbox" id="${key.toLowerCase()}" name="trait" value="${value}" class="peer hidden" ${reponses.TRAITS_PERSO?.includes(value) ? 'checked' : ''}>
                    <label for="${key.toLowerCase()}" 
                        class="inline-flex justify-center w-full cursor-pointer text-sm px-3 py-1 rounded-full
                        border border-gray-600 text-gray-400
                        peer-checked:border-blue-500 peer-checked:text-blue-400 peer-checked:bg-blue-500/10
                        hover:border-blue-400/50 hover:text-blue-300
                        transition-all duration-200">
                        ${value}
                    </label>
                `;
                grilleTraits.appendChild(div);
            });
            conteneurSaisie.appendChild(grilleTraits);
            break;

        case 7: // Desc
            conteneurSaisie.innerHTML = `<textarea id="description" class="w-full h-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white" placeholder="Décrivez brièvement votre conte (200 mots maximum)">${reponses.DESCRIPTION || ''}</textarea>`;
            break;
    }

    const boutonSuivant = document.getElementById('next-question');
    if (boutonSuivant) {
        boutonSuivant.textContent = indexQuestionActuelle === questions.length - 1 ? 'Générer' : 'Suivant';
    }

    const boutonPrecedent = document.getElementById('prev-question');
    if (boutonPrecedent) {
        boutonPrecedent.style.display = indexQuestionActuelle === 0 ? 'none' : 'block';
    }
}

function enregistrerReponse() {
    switch (indexQuestionActuelle) {
        case 0: // Titre
            reponses.TITRE_CONTE = document.getElementById('titre').value.trim();
            break;

        case 1: // Type de conte
            const typeSelectionne = document.querySelector('input[name="type"]:checked');
            reponses.TYPES_CONTE = typeSelectionne ? typeSelectionne.value : '';
            break;

        case 2: // Epoque
            const valeurEpoque = document.getElementById('epoque').value.trim();
            reponses.EPOQUE = valeurEpoque || 'Epoque au choix';
            break;

        case 3: // Lieu
            const valeurLieu = document.getElementById('lieu').value.trim();
            reponses.LIEU = valeurLieu || 'Lieux au choix';
            break;

        case 4: // Genre du héros
            const genreSelectionne = document.querySelector('input[name="genre"]:checked');
            reponses.GENRE_PERSO = genreSelectionne ? genreSelectionne.value : '';
            break;

        case 5: // Valeurs du héros
            const valeursSelectionnees = Array.from(document.querySelectorAll('input[name="valeur"]:checked'))
                .map(input => input.value);
            reponses.VALEURS_PERSO = valeursSelectionnees.join(', ');
            break;

        case 6: // Traits du héros
            const traitsSelectionnes = Array.from(document.querySelectorAll('input[name="trait"]:checked'))
                .map(input => input.value);
            reponses.TRAITS_PERSO = traitsSelectionnes.join(', ');
            break;

        case 7: // Description
            reponses.DESCRIPTION = document.getElementById('description').value.trim();
            break;
    }
}

async function envoyerQuestionnaire() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Veuillez vous connecter');
            return;
        }

        document.getElementById('questionnaire-content').innerHTML = `
            <div class="flex flex-col items-center justify-center py-10">
                <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
                <p class="mt-4 text-gray-300">Génération de votre conte en cours...</p>
                <p class="mt-2 text-gray-400 text-sm">Cela peut prendre jusqu'à une minute</p>
            </div>
        `;

        const reponse = await fetch('http://localhost:8000/conte/nouveau', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                parametres: reponses
            })
        });

        const donnees = await reponse.json();

        if (donnees.success) {
            window.location.href = `/conte/${donnees.conteId}`;
        } else {
            alert(donnees.message || 'Une erreur est survenue lors de la génération du conte');

            indexQuestionActuelle = 0;
            afficherQuestionCourante();
        }
    } catch (erreur) {
        alert('Une erreur est survenue lors de la génération du conte');

        indexQuestionActuelle = 0;
        afficherQuestionCourante();
    }
}

export function ouvrirQuestionnaire() {
    const contenuPrincipal = document.getElementById('main-content');

    if (contenuPrincipal) {
        contenuPrincipal.innerHTML = `
            <div id="questionnaire-container" class="max-w-2xl mx-auto mt-6 bg-gray-800 rounded-xl p-8 shadow-xl border border-blue-500/20">
                <h2 class="mea-culpa-regular text-2xl font-semibold mb-6 text-blue-500">Création d'un nouveau conte</h2>
                
                <div class="mb-8">
                    <span id="question-progress" class="text-sm text-gray-400">Question 1/8</span>
                    <div class="w-full h-2 bg-gray-700 rounded-full">
                        <div id="progress-bar" class="h-2 bg-blue-500 rounded-full transition-all" style="width: 12.5%"></div>
                    </div>
                </div>
                
                <div id="questionnaire-content">
                    <h3 id="question-text" class="text-xl font-medium mb-4 text-gray-200"></h3>
                    <div id="question-input" class="mb-6"></div>
                    
                    <div class="flex justify-between">
                        <button id="prev-question" class="px-4 py-2 rounded-lg text-gray-300 hover:text-blue-400 transition-all">Précédent</button>
                        <button id="next-question" class="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-all">Suivant</button>
                    </div>
                </div>
            </div>
        `;

        initialiserQuestionnaire();
    }
}