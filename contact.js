const formInviter = document.querySelector('#form-inviter');
const champNom = document.querySelector('#nomcontact');
const formChercher = document.querySelector('#form-chercher');
const champChercher = document.querySelector('#chercher');
const listeEnvoyees = document.querySelector('#envoyees');
const listeContacts = document.querySelector('#contacts');
const zoneListes = document.querySelector('.contacts-listes');

// ---------- Fonctions pour créer les éléments ----------
function creerBouton(action, texte, danger) {
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = danger ? 'btn-petit danger' : 'btn-petit';
  bouton.dataset.action = action;
  bouton.textContent = texte;
  return bouton;
}

function creerPersonne(nom, bouton) {
  const li = document.createElement('li');

  const spanNom = document.createElement('span');
  spanNom.className = 'nom';
  spanNom.textContent = nom;

  const actions = document.createElement('span');
  actions.className = 'actions';
  actions.append(bouton);

  li.append(spanNom, actions);
  return li;
}

// ---------- Inviter un contact ----------
formInviter.addEventListener('submit', (e) => {
  e.preventDefault();
  const nom = champNom.value.trim();
  if (nom === '') return;

  const bouton = creerBouton('annuler', 'Annuler', true);
  listeEnvoyees.append(creerPersonne(nom, bouton));
  champNom.value = '';
});

// ---------- Boutons Accepter / Refuser / Annuler / Supprimer ----------
zoneListes.addEventListener('click', (e) => {
  const bouton = e.target.closest('button[data-action]');
  if (!bouton) return;

  const li = bouton.closest('li');
  const nom = li.querySelector('.nom').textContent;

  switch (bouton.dataset.action) {
    case 'accepter':
      li.remove();
      listeContacts.append(creerPersonne(nom, creerBouton('supprimer', 'Supprimer', true)));
      break;

    case 'refuser':
    case 'annuler':
      li.remove();
      break;

    case 'supprimer':
      if (confirm(`Supprimer ${nom} de vos contacts ?`)) {
        li.remove();
      }
      break;
  }
});

// ---------- Chercher dans les contacts ----------
formChercher.addEventListener('submit', (e) => e.preventDefault());

champChercher.addEventListener('input', () => {
  const recherche = champChercher.value.trim().toLowerCase();
  listeContacts.querySelectorAll('li').forEach((li) => {
    const nom = li.querySelector('.nom').textContent.toLowerCase();
    li.hidden = !nom.includes(recherche);
  });
});