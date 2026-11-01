// Éléments de la page
const wrapper = document.querySelector('.wrapper');
const registerLink = document.querySelector('.register-link a');
const loginLink = document.querySelector('.login-link a');

// Clic sur « Inscription » : on ajoute la classe "active"
// → le CSS cache la connexion et affiche l'inscription
registerLink.addEventListener('click', (e) => {
  e.preventDefault(); // empêche le lien "#" de remonter en haut de la page
  wrapper.classList.add('active');
});

// Clic sur « Connexion » : on enlève la classe "active"
// → retour au formulaire de connexion
loginLink.addEventListener('click', (e) => {
  e.preventDefault();
  wrapper.classList.remove('active');
});