const chargerBDD = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        const response = await fetch('http://localhost:8000/dev/databases', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(await response.text());

        const res = await response.json();
        const select = document.getElementById('dbSelect');
        if (!select) return;

        select.innerHTML = '<option value="">Sélectionner une BDD</option>';

        if (res.success && res.databases) {
            const navTables = document.createElement('div');
            navTables.id = 'navTables';
            navTables.className = 'mb-4 flex gap-2 flex-wrap';
            document.getElementById('dbContent').before(navTables);
            
            res.databases.forEach((base, index) => {
                const option = document.createElement('option');
                option.value = base.name;
                option.textContent = base.name;
                select.appendChild(option);
            });

            if (res.databases.length > 0) {
                const premiere = res.databases[0].name;
                select.value = premiere;

                chargerTable(premiere);
            }
        }
    } catch (erreur) {
        alert('Erreur de chargement des bases de données');
    }
};

const chargerTable = async (nomBase) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/';
            return;
        }

        const response = await fetch(`http://localhost:8000/dev/tables/${nomBase}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(await response.text());

        const res = await response.json();
        const contenuBase = document.getElementById('dbContent');
        const navTables = document.getElementById('navTables');
        if (!contenuBase || !navTables) return;

        navTables.innerHTML = '';

        if (res.success && res.tables) {
            res.tables.forEach(table => {
                const bouton = document.createElement('button');
                bouton.textContent = table.name;
                bouton.className = 'px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 text-sm';
                bouton.onclick = () => scrollVersTable(table.name);
                navTables.appendChild(bouton);
            });

            contenuBase.innerHTML = res.tables.map(table => {
                const enTeteColonnes = table.columns
                    .map(col => `<th class="px-4 py-2 text-left text-sm font-medium text-gray-300 border-b border-gray-700 sticky top-0 bg-gray-800">${col}</th>`)
                    .join('');

                const lignes = table.rows
                    .map(row => {
                        const cellules = Object.values(row)
                            .map(val => `<td class="px-4 py-2 text-sm text-gray-300 border-b border-gray-800">${val === null ? 'NULL' : val.toString()}</td>`)
                            .join('');
                        return `<tr>${cellules}</tr>`;
                    })
                    .join('');

                return `
                    <div id="table-${table.name}" class="bg-gray-900 rounded-lg p-4 mb-4">
                        <h4 class="text-lg font-semibold mb-3">${table.name}</h4>
                        <div class="overflow-auto max-h-96">
                            <table class="min-w-full">
                                <thead class="bg-gray-800">
                                    <tr>${enTeteColonnes}</tr>
                                </thead>
                                <tbody>
                                    ${lignes}
                                </tbody>
                            </table>
                        </div>
                    </div>`;
            }).join('');
        } else {
            contenuBase.innerHTML = '<p>Aucune donnée disponible</p>';
        }
    } catch (erreur) {
        alert('Erreur de chargement des tables');
    }
};

const scrollVersTable = (nomTable) => {
    const table = document.getElementById(`table-${nomTable}`);
    if (table) {
        table.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (!token && window.location.pathname === '/espace-dev') {
        window.location.href = '/';
        return;
    }

    const selectBase = document.getElementById('dbSelect');
    if (selectBase) {
        chargerBDD();
        selectBase.addEventListener('change', (e) => {
            if (e.target.value) {
                chargerTable(e.target.value);
            } else {
                const contenuBase = document.getElementById('dbContent');
                const navTables = document.getElementById('navTables');
                if (contenuBase) contenuBase.innerHTML = '';
                if (navTables) navTables.innerHTML = '';
            }
        });
    }
});
