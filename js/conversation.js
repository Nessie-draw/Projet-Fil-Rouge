// Éléments de la page
const formulaire = document.querySelector('.envoi');
const champMessage = document.querySelector('#message');
const listeMessages = document.querySelector('.messages');

// Quand on envoie le formulaire (bouton « Envoyer » ou touche Entrée)
formulaire.addEventListener('submit', (e) => {
  e.preventDefault(); // empêche la page de se recharger

  const texte = champMessage.value.trim();
  if (texte === '') return; // on ignore les messages vides

  // Heure actuelle au format « 14 h 05 »
  const maintenant = new Date();
  const minutes = String(maintenant.getMinutes()).padStart(2, '0');
  const heure = maintenant.getHours() + ' h ' + minutes;

  // Création de la bulle : <li class="envoye"><article>…</article></li>
  const li = document.createElement('li');
  li.className = 'envoye';

  const article = document.createElement('article');

  const auteur = document.createElement('strong');
  auteur.textContent = 'Moi';

  const p = document.createElement('p');
  p.textContent = texte; // textContent empêche d'injecter du code HTML

  const temps = document.createElement('time');
  temps.textContent = heure;

  // Ordre : nom (caché), texte, puis heure
  article.append(auteur, p, temps);
  li.append(article);
  listeMessages.append(li);

  // On vide le champ et on descend jusqu'au nouveau message
  champMessage.value = '';
  listeMessages.scrollTop = listeMessages.scrollHeight;
});