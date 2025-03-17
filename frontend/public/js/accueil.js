// frontend/public/js/accueil.js
import { TypeConte, Statut } from './enums.js';
import { ouvrirQuestionnaire } from './questionnaire.js';

let estConnecte = false;
let infoUtilisateur = null;
let typesFiltres = [];

document.addEventListener('DOMContentLoaded', async () => {
    await initialiserAccueil();
    window.addEventListener('tokenUpdated', async () => {
        await initialiserAccueil();
    });
});

async function initialiserAccueil() {
    const token = localStorage.getItem('token');
    estConnecte = !!token;

    if (token) {
        try {
            infoUtilisateur = JSON.parse(atob(token.split('.')[1]));
        } catch (e) {
            console.error('Erreur lors du décodage du token:', e);
        }
    }
    initialiserBoutonGenerer();

    // Défaut = tous les contes (aucun filtre)
    typesFiltres = [];

    await chargerContes();

    initialiserFiltres();

    // "Tous" coché par défaut
    const tousCheckbox = document.getElementById('filter-tous');
    if (tousCheckbox) {
        tousCheckbox.checked = true;
    }
}

function initialiserBoutonGenerer() {
    const boutonGenerer = document.getElementById('generateButton');
    if (!boutonGenerer) return;

    const nouveauBouton = boutonGenerer.cloneNode(true);
    boutonGenerer.parentNode.replaceChild(nouveauBouton, boutonGenerer);

    if (estConnecte) {
        nouveauBouton.classList.remove('hidden');
        nouveauBouton.addEventListener('click', ouvrirModalCredits);
    } else {
        nouveauBouton.classList.add('hidden');
    }
}

function ouvrirModalCredits() {
    const modalCredits = document.getElementById('creditModal');
    if (!modalCredits) return;

    // Si l'utilisateur est développeur, pas besoin de dépenser de crédit
    if (infoUtilisateur?.est_developpeur) {
        ouvrirQuestionnaire();
        return;
    }

    modalCredits.classList.remove('hidden');

    const boutonConfirmer = document.getElementById('confirmCredit');
    const boutonAnnuler = document.getElementById('cancelCredit');

    const nouveauBoutonConfirmer = boutonConfirmer.cloneNode(true);
    const nouveauBoutonAnnuler = boutonAnnuler.cloneNode(true);

    boutonConfirmer.parentNode.replaceChild(nouveauBoutonConfirmer, boutonConfirmer);
    boutonAnnuler.parentNode.replaceChild(nouveauBoutonAnnuler, boutonAnnuler);

    nouveauBoutonConfirmer.addEventListener('click', async () => {
        try {
            const reponse = await fetch('http://localhost:8000/credits/debit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ userId: infoUtilisateur.id })
            });

            const donnees = await reponse.json();
            if (donnees.success) {
                localStorage.setItem('token', donnees.token);
                window.dispatchEvent(new Event('tokenUpdated'));

                modalCredits.classList.add('hidden');
                ouvrirQuestionnaire();
            } else {
                alert(donnees.message || 'Erreur lors du débit du crédit');
                modalCredits.classList.add('hidden');
            }
        } catch (erreur) {
            console.error('Erreur:', erreur);
            alert('Une erreur est survenue');
            modalCredits.classList.add('hidden');
        }
    });

    nouveauBoutonAnnuler.addEventListener('click', () => {
        modalCredits.classList.add('hidden');
    });
}

async function chargerContes() {
    try {
        const token = localStorage.getItem('token');
        let estDeveloppeur = false;
        if (token) {
            try {
                const infoUtilisateur = JSON.parse(atob(token.split('.')[1]));
                estDeveloppeur = infoUtilisateur.est_developpeur;
            } catch (erreur) {
                console.error('Erreur de décodage du token:', erreur);
            }
        }

        let url = 'http://localhost:8000/conte';
        const params = [];

        if (typesFiltres.length > 0) {
            typesFiltres.forEach(type => {
                params.push(`type=${encodeURIComponent(type)}`);
            });
        }

        if (params.length > 0) {
            url += '?' + params.join('&');
        }

        const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
        const reponse = await fetch(url, { headers });

        const donnees = await reponse.json();
        if (!donnees.success) {
            console.error('Erreur:', donnees.message);
            return;
        }

        const conteneurContes = document.getElementById('contes');
        conteneurContes.innerHTML = '';

        if (donnees.contes.length === 0) {
            conteneurContes.innerHTML = `
                <div class="text-center py-6 text-gray-500">
                    Aucun conte disponible pour le moment.
                </div>
            `;
            return;
        }

        donnees.contes.forEach(conte => {
            const elementConte = document.createElement('div');
            elementConte.className = 'bg-gray-800/50 rounded-lg p-5 hover:bg-gray-800 transition-all border border-gray-700/50';

            // Suppression de conte que pour les développeurs
            const boutonsAction = estDeveloppeur ? `
                <div class="flex justify-end gap-2">
                    <a href="/conte/${conte.id}" class="text-gray-300 hover:text-blue-400 transition-all">
                        <i class="bi bi-book"></i>
                    </a>
                    <button class="delete-conte text-gray-300 hover:text-red-500 transition-all" data-conte-id="${conte.id}">
                        <i class="bi bi-trash"></i>
                    </button>
                </div>
            ` : `
                <div class="flex justify-end">
                    <a href="/conte/${conte.id}" class="text-gray-300 hover:text-blue-400 transition-all">
                        <i class="bi bi-book"></i>
                    </a>
                </div>
            `;

            elementConte.innerHTML = `
                <div>
                    <div class="flex justify-between items-start">
                        <h3 class="text-xl font-medium mb-1">${conte.titre}</h3>
                        ${boutonsAction}
                    </div>
                    <p class="text-gray-400 text-sm mb-4">${conte.description || 'Aucune description'}</p>
                    <div class="flex flex-wrap gap-2 mt-2">
                        ${(conte.types || []).map(type =>
                `<span class="px-2 py-1 bg-gray-700/60 text-xs rounded-full text-gray-300">${type}</span>`
            ).join('')}
                    </div>
                </div>
            `;

            conteneurContes.appendChild(elementConte);
        });

        if (estDeveloppeur) {
            document.querySelectorAll('.delete-conte').forEach(bouton => {
                bouton.addEventListener('click', async (e) => {
                    const conteId = e.currentTarget.dataset.conteId;
                    if (confirm('Êtes-vous sûr de vouloir supprimer ce conte ? Cette action est irréversible.')) {
                        await supprimerConte(conteId);
                    }
                });
            });
        }

    } catch (erreur) {
        console.error('Erreur lors du chargement des contes:', erreur);
    }
}

async function supprimerConte(conteId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const reponse = await fetch(`http://localhost:8000/conte/${conteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const donnees = await reponse.json();

        if (donnees.success) {
            await chargerContes();
        } else {
            alert(donnees.message || 'Erreur lors de la suppression du conte');
        }

    } catch (erreur) {
        console.error('Erreur lors de la suppression:', erreur);
        alert('Une erreur est survenue lors de la suppression du conte');
    }
}

function initialiserFiltres() {
    const conteneurFiltres = document.getElementById('filters');
    if (!conteneurFiltres) return;

    if (conteneurFiltres.querySelector('#filter-types-container')) {
        return;
    }

    conteneurFiltres.innerHTML = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-400 mb-2">Types de contes</label>
                <div class="mb-3">
                    <div class="group relative">
                        <input type="checkbox" id="filter-tous" name="filter-all" class="peer hidden">
                        <label for="filter-tous" 
                            class="inline-flex justify-center w-full cursor-pointer text-sm px-3 py-1 rounded-full
                            border border-gray-600 text-gray-400
                            peer-checked:border-blue-500 peer-checked:text-blue-400 peer-checked:bg-blue-500/10
                            hover:border-blue-400/50 hover:text-blue-300
                            transition-all duration-200">
                            Tous les types
                        </label>
                    </div>
                </div>
                <div id="filter-types-container" class="grid grid-cols-2 gap-3">
                    ${Object.values(TypeConte).map(type => `
                        <div class="group relative">
                            <input type="checkbox" id="filter-${type.toLowerCase()}" name="filter-type" value="${type}" class="peer hidden">
                            <label for="filter-${type.toLowerCase()}" 
                                class="inline-flex justify-center w-full cursor-pointer text-sm px-3 py-1 rounded-full
                                border border-gray-600 text-gray-400
                                peer-checked:border-blue-500 peer-checked:text-blue-400 peer-checked:bg-blue-500/10
                                hover:border-blue-400/50 hover:text-blue-300
                                transition-all duration-200">
                                ${type}
                            </label>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;

    document.getElementById('filter-tous').addEventListener('change', async (e) => {
        if (e.target.checked) {
            // Décocher toutes les autres cases
            document.querySelectorAll('input[name="filter-type"]').forEach(checkbox => {
                checkbox.checked = false;
            });

            typesFiltres = [];
            await chargerContes();
        }
    });

    document.querySelectorAll('input[name="filter-type"]').forEach(checkbox => {
        checkbox.addEventListener('change', async (e) => {
            // "Tous" est automatiquement décoché si filtre
            if (e.target.checked) {
                document.getElementById('filter-tous').checked = false;
            }

            const type = e.target.value;
            if (e.target.checked) {
                if (!typesFiltres.includes(type)) {
                    typesFiltres.push(type);
                }
            } else {
                typesFiltres = typesFiltres.filter(t => t !== type);
            }

            // "Tous" est automatiquement coché si aucun filtre
            if (typesFiltres.length === 0) {
                document.getElementById('filter-tous').checked = true;
            }

            await chargerContes();
        });
    });
}