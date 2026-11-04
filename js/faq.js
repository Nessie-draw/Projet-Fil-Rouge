// Éléments de la page
const champRecherche = document.querySelector('#recherche');
const questions = document.querySelectorAll('.faq-groupe details');
const groupes = document.querySelectorAll('.faq-groupe');
const aucunResultat = document.querySelector('.aucun-resultat');

// À chaque lettre tapée dans le champ de recherche
champRecherche.addEventListener('input', () => {
  // Texte cherché, en minuscules pour ignorer les majuscules
  const recherche = champRecherche.value.trim().toLowerCase();
  let nombreVisibles = 0;

  // On garde seulement les questions qui contiennent le texte cherché
  questions.forEach((question) => {
    const correspond = question.textContent.toLowerCase().includes(recherche);
    question.hidden = !correspond;
    if (correspond) {
      nombreVisibles++;
    }
  });

  // On cache une catégorie entière si elle n'a plus aucune question visible
  groupes.forEach((groupe) => {
    const visibles = groupe.querySelectorAll('details:not([hidden])');
    groupe.hidden = visibles.length === 0;
  });

  // Message « Aucune question ne correspond » seulement si rien n'est trouvé
  aucunResultat.hidden = nombreVisibles > 0;
});