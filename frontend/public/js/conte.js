document.addEventListener('DOMContentLoaded', async () => {
    const partiesUrl = window.location.pathname.split('/');
    const idConte = partiesUrl[partiesUrl.length - 1];
    let indexChapitreActuel = 0;
    let dataConte = null;
    let estDeveloppeur = false;
    let generationEnCours = false;

    const paramChap = new URLSearchParams(window.location.search).get('chap');
    if (paramChap) {
        indexChapitreActuel = parseInt(paramChap) - 1;
    } else {
        const indexSauvegarde = localStorage.getItem(`conte_${idConte}_chapter`);
        if (indexSauvegarde) {
            indexChapitreActuel = parseInt(indexSauvegarde);
        }
    }

    if (!idConte) {
        afficherErreur('ID de conte invalide');
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const entetes = token ? { 'Authorization': `Bearer ${token}` } : {};

        if (token) {
            try {
                const infoUtilisateur = JSON.parse(atob(token.split('.')[1]));
                estDeveloppeur = infoUtilisateur.est_developpeur;
            } catch (erreur) {
            }
        }

        const reponse = await fetch(`http://localhost:8000/conte/${idConte}`, { headers: entetes });
        const donnees = await reponse.json();

        if (!donnees.success) {
            afficherErreur(donnees.message || 'Erreur lors du chargement du conte');
            return;
        }

        dataConte = donnees.conte;

        if (indexChapitreActuel >= dataConte.chapitres.length) {
            indexChapitreActuel = dataConte.chapitres.length - 1;
        }
        if (indexChapitreActuel < 0) {
            indexChapitreActuel = 0;
        }

        sauvegarderIndexChapitre(indexChapitreActuel);

        afficherEntete(dataConte, indexChapitreActuel);
        afficherChapitre(dataConte, indexChapitreActuel);
        configurerPagination(dataConte);
    } catch (erreur) {
        afficherErreur('Une erreur est survenue lors du chargement du conte');
    }

    function parserContenu(contenu) {
        if (Array.isArray(contenu)) {
            return contenu.map(p => {
                if (typeof p === 'string') {
                    return p.replace(/^P\d+\s*:\s*/, '').trim();
                }
                return '';
            }).filter(p => p.length > 0);
        }

        if (typeof contenu === 'string') {
            try {
                const contenuParse = JSON.parse(contenu);
                return parserContenu(contenuParse);
            } catch (e) {
                return contenu
                    .split(/\n\n|\r\n\r\n/)
                    .map(p => p.trim())
                    .filter(p => p.length > 0);
            }
        }

        return [];
    }

    function afficherEntete(conte, index) {
        const elementTitre = document.getElementById('conte-titre');

        if (!conte.chapitres || !conte.chapitres[index]) {
            elementTitre.textContent = conte.titre;
            return;
        }

        const chapitre = conte.chapitres[index];

        elementTitre.textContent = `${conte.titre} — Chapitre ${chapitre.numero}: ${chapitre.titre}`;
        elementTitre.classList.add('text-center');

        const header = document.createElement('div');
        header.className = 'flex justify-center items-center relative mb-5';

        const titre = elementTitre.parentNode;
        titre.replaceChild(header, elementTitre);

        header.appendChild(elementTitre);
    }

    function afficherChapitre(conte, index) {
        if (!conte.chapitres || !conte.chapitres[index]) {
            document.getElementById('chapter-content').innerHTML = '<p class="text-center text-gray-500">Chapitre non disponible</p>';
            return;
        }

        const chapitre = conte.chapitres[index];
        const contenuChapitre = document.getElementById('chapter-content');

        contenuChapitre.innerHTML = '';

        const paragraphes = parserContenu(chapitre.contenu);

        if (paragraphes.length > 0) {
            paragraphes.forEach(p => {
                if (!p || p.length === 0) return;

                const para = document.createElement('p');
                para.className = 'text-gray-200 mb-5 leading-relaxed text-m';
                para.innerHTML = `<span class="indent">\u00A0\u00A0\u00A0\u00A0</span>${p}`;
                contenuChapitre.appendChild(para);
            });
        } else {
            const para = document.createElement('p');
            para.className = 'text-gray-300 mb-4 leading-relaxed';
            para.textContent = "Le contenu de ce chapitre n'a pas pu être correctement chargé.";
            contenuChapitre.appendChild(para);
        }

        document.getElementById('chap-courant').innerHTML = `
                <i class="bi bi-book mr-2"></i>
                ${index + 1} / ${conte.chapitres.length}
            `;

        document.getElementById('chap-precedent').disabled = index === 0;
        document.getElementById('chap-precedent').classList.toggle('opacity-50', index === 0);
        document.getElementById('chap-suivant').disabled = index >= conte.chapitres.length - 1;
        document.getElementById('chap-suivant').classList.toggle('opacity-50', index >= conte.chapitres.length - 1);

        const header = document.querySelector('#conte-titre').parentNode;
        if (!header.classList.contains('flex')) {
            afficherEntete(conte, index);
        } else {
            const elementTitre = document.getElementById('conte-titre');
            const chapitre = conte.chapitres[index];
            elementTitre.textContent = `${conte.titre} — Chapitre ${chapitre.numero}: ${chapitre.titre}`;
        }

        const messageAttenteExistant = document.querySelector('.message-attente');
        if (messageAttenteExistant) {
            messageAttenteExistant.remove();
        }

        const boutonGenererExistant = document.getElementById('generer-chap-suivant');
        if (boutonGenererExistant) {
            boutonGenererExistant.remove();
        }

        const estDernierChapitre = index === conte.chapitres.length - 1;
        if (dataConte.statut !== 'terminé' && estDernierChapitre) {
            const dernierChapitre = dataConte.chapitres[dataConte.chapitres.length - 1];
            const dateCreationDernierChapitre = new Date(dernierChapitre.date_creation);
            const maintenant = new Date();
            const diffHeures = (maintenant - dateCreationDernierChapitre) / (1000 * 60 * 60);

            if (generationEnCours) {
                afficherMessageGenerationEnCours();
            } else if (estDeveloppeur || diffHeures >= 24) {
                ajouterBoutonGenererSuivant();
            } else {
                ajouterMessageAttente(24 - Math.floor(diffHeures));
            }
        }

        sauvegarderIndexChapitre(index);
        mettreAJourUrl(index);
    }

    function sauvegarderIndexChapitre(index) {
        localStorage.setItem(`conte_${idConte}_chapter`, index);
    }

    function mettreAJourUrl(index) {
        const url = new URL(window.location);
        url.searchParams.set('chap', index + 1);
        window.history.replaceState({}, '', url);
    }

    function configurerPagination(conte) {
        document.getElementById('chap-precedent').addEventListener('click', () => {
            if (indexChapitreActuel > 0) {
                indexChapitreActuel--;
                afficherChapitre(conte, indexChapitreActuel);
                window.scrollTo(0, 0);
            }
        });

        document.getElementById('chap-suivant').addEventListener('click', () => {
            if (indexChapitreActuel < conte.chapitres.length - 1) {
                indexChapitreActuel++;
                afficherChapitre(conte, indexChapitreActuel);
                window.scrollTo(0, 0);
            }
        });
    }

    function ajouterBoutonGenererSuivant() {
        const boutonExistant = document.getElementById('generer-chap-suivant');
        if (boutonExistant) {
            boutonExistant.remove();
        }

        const boutonGenerer = document.createElement('button');
        boutonGenerer.id = 'generer-chap-suivant';
        boutonGenerer.className = 'group px-4 py-2.5 rounded-lg transition-all text-gray-300 hover:text-blue-400 font-medium flex items-center gap-2 text-s absolute right-0 top-8';
        boutonGenerer.innerHTML = '<i class="bi bi-magic text-lg group-hover:rotate-12 transition-transform"></i> Générer la suite';

        const header = document.querySelector('#conte-titre').parentNode;
        header.appendChild(boutonGenerer);

        boutonGenerer.addEventListener('click', async () => {
            boutonGenerer.disabled = true;
            boutonGenerer.innerHTML = '<i class="bi bi-hourglass-split text-lg"></i> Génération en cours...';
            boutonGenerer.classList.add('opacity-70', 'cursor-not-allowed');

            generationEnCours = true;

            await genererEtAjouterChapitre();

            generationEnCours = false;

            boutonGenerer.disabled = false;
            boutonGenerer.innerHTML = '<i class="bi bi-magic text-lg group-hover:rotate-12 transition-transform"></i> Générer la suite';
            boutonGenerer.classList.remove('opacity-70', 'cursor-not-allowed');
        });
    }

    function afficherMessageGenerationEnCours() {
        const messageExistant = document.querySelector('.message-generation-en-cours');
        if (messageExistant) return;

        const message = document.createElement('div');
        message.className = 'message-generation-en-cours px-4 py-2.5 bg-gray-800 rounded-lg text-blue-400 font-medium flex items-center gap-2 text-s absolute right-0 top-8';
        message.innerHTML = '<i class="bi bi-hourglass-split text-lg animate-pulse"></i> Génération en cours...';

        const header = document.querySelector('#conte-titre').parentNode;
        header.appendChild(message);
    }

    function ajouterMessageAttente(heuresRestantes) {
        const messageAttenteExistant = document.querySelector('.message-attente');
        if (messageAttenteExistant) {
            messageAttenteExistant.remove();
        }

        const messageAttente = document.createElement('div');
        messageAttente.className = 'message-attente px-4 py-2.5 bg-gray-800 rounded-lg text-amber-400 font-medium flex items-center gap-2 text-s mt-5 mx-auto max-w-xl text-center';
        messageAttente.innerHTML = `<i class="bi bi-hourglass-split text-lg"></i> Vous pourrez générer la suite dans ${Math.ceil(heuresRestantes)} heures`;

        const contenuChapitre = document.getElementById('chapter-content');
        contenuChapitre.after(messageAttente);
    }

    async function genererEtAjouterChapitre() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Vous devez être connecté pour pouvoir générer la suite');
                generationEnCours = false;
                return;
            }

            const dernierChapitre = dataConte.chapitres[dataConte.chapitres.length - 1];

            const reponseGeneration = await fetch(`http://localhost:8000/texte/generer-chapitre-suivant`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    conte: dataConte,
                    dernierChapitre: dernierChapitre
                })
            });

            const generation = await reponseGeneration.json();

            if (!generation.success) {
                alert(generation.message || 'Erreur lors de la génération du chapitre');
                generationEnCours = false;
                return;
            }

            const reponseSauvegarde = await fetch(`http://localhost:8000/conte/${idConte}/chapitre`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    chapitre: generation.chapitre,
                    statut: generation.statut
                })
            });

            const sauvegarde = await reponseSauvegarde.json();

            if (!sauvegarde.success) {
                alert(sauvegarde.message);
                generationEnCours = false;
                return;
            }

            const nouveauChapitreIndex = dataConte.chapitres.length;
            sauvegarderIndexChapitre(nouveauChapitreIndex);

            window.location.href = `${window.location.pathname}?chap=${nouveauChapitreIndex + 1}`;

        } catch (erreur) {
            alert('Une erreur est survenue lors de la génération du chapitre');
            generationEnCours = false;
        }
    }
});

function afficherErreur(message) {
    const contenuPrincipal = document.getElementById('main-content');
    if (contenuPrincipal) {
        contenuPrincipal.innerHTML = `
                <div class="max-w-2xl mx-auto mt-12 p-6 bg-red-900/20 border border-red-800 rounded-xl text-center">
                    <h2 class="text-xl font-medium text-red-400 mb-2">Erreur</h2>
                    <p class="text-gray-300">${message}</p>
                    <button onclick="window.location.href='/'" class="mt-4 px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-all">
                        Retour à l'accueil
                    </button>
                </div>
            `;
    }
}