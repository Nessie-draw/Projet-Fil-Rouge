// Bouton qui change le thème
const boutonTheme = document.querySelector('#bouton-theme');

// Au chargement : si le thème clair avait été choisi, on le remet
if (localStorage.getItem('theme') === 'clair') {
  document.body.classList.add('clair');
}

// Au clic : on ajoute ou on enlève la classe "clair", puis on retient le choix
boutonTheme.addEventListener('click', () => {
  document.body.classList.toggle('clair');

  if (document.body.classList.contains('clair')) {
    localStorage.setItem('theme', 'clair');
  } else {
    localStorage.setItem('theme', 'sombre');
  }
});