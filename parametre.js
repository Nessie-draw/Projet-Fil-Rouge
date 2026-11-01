// ===== Onglets =====
// Affiche l'onglet choisi et cache les autres
function openTab(event, nomOnglet) {
  // 1. Cacher tous les contenus d'onglets
  const contenus = document.querySelectorAll('.tab-content');
  contenus.forEach((contenu) => {
    contenu.style.display = 'none';
  });

  // 2. Enlever la classe "active" de tous les boutons
  const boutons = document.querySelectorAll('.tab-button');
  boutons.forEach((bouton) => {
    bouton.classList.remove('active');
  });

  // 3. Afficher le contenu de l'onglet cliqué
  document.getElementById(nomOnglet).style.display = 'block';

  // 4. Mettre le bouton cliqué en "active"
  event.currentTarget.classList.add('active');
}

// ===== Préférence : son à la réception d'un message =====
const caseSon = document.querySelector('#son-messages');

// Au chargement : on remet le choix enregistré (activé par défaut)
caseSon.checked = localStorage.getItem('son') !== 'non';

// Quand on coche ou décoche, on retient le choix
caseSon.addEventListener('change', () => {
  if (caseSon.checked) {
    localStorage.setItem('son', 'oui');
  } else {
    localStorage.setItem('son', 'non');
  }
});