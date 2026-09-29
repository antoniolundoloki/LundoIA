const CATEGORY_KEYWORDS = {
  informatica: ['informatica', 'informática', 'engenharia informatica', 'ti', 'tecnologia', 'programacao'],
  direito: ['direito'],
  medicina: ['medicina', 'enfermagem'],
  matematica: ['matematica', 'matemática', 'calculo', 'estatistica'],
  economia: ['economia', 'gestao', 'contabilidade'],
  fisica: ['fisica', 'física'],
};

function normalize(text) {
  return (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Determina a categoria de módulos a sugerir com base no curso/área indicados
 * no onboarding. Devolve 'generico' quando nenhuma categoria específica coincide.
 */
function getCategoryFor(text) {
  const norm = normalize(text);
  const match = Object.entries(CATEGORY_KEYWORDS).find(([, keywords]) =>
    keywords.some((k) => norm.includes(normalize(k)))
  );
  return match ? match[0] : 'generico';
}

module.exports = { getCategoryFor };
