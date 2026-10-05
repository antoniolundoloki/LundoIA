const CATEGORY_KEYWORDS = {
  informatica: [
    'informatica',
    'informática',
    'engenharia informatica',
    'engenharia informática',
    'tecnico de informatica',
    'técnico de informática',
    'tecnologia de informacao',
    'tecnologia de informação',
    'ti'
  ],

  electricidade: [
    'electricidade',
    'eletricidade',
    'electricidade industrial',
    'eletricidade industrial',
    'instalacoes eletricas',
    'instalações elétricas'
  ],

  frio_climatizacao: [
    'frio e climatizacao',
    'frio e climatização',
    'refrigeracao',
    'refrigeração',
    'climatizacao',
    'climatização',
    'frio'
  ],

  desenhador_projectista: [
    'desenhador projectista',
    'desenhador projetista',
    'desenho projectista',
    'desenho projetista'
  ],

  tecnologia_moveis: [
    'tecnologia de moveis',
    'tecnologia de móveis',
    'moveis',
    'móveis',
    'marcenaria'
  ],

  mecanica: [
    'mecanica',
    'mecânica',
    'mecanica automovel',
    'mecânica automóvel',
    'mecanica geral',
    'mecânica geral'
  ],

  mecanica_industrial: [
    'mecanica industrial',
    'mecânica industrial',
    'manutencao industrial',
    'manutenção industrial'
  ],

  gestao_empresarial: [
    'gestao empresarial',
    'gestão empresarial',
    'gestao de empresas',
    'gestão de empresas'
  ],

  contabilidade: [
    'contabilidade',
    'contabilidade financeira',
    'tecnico de contabilidade',
    'técnico de contabilidade'
  ],

  medicina: [
    'medicina',
    'medicina geral'
  ],

  enfermagem: [
    'enfermagem',
    'enfermagem geral'
  ],

  farmacia: [
    'farmacia',
    'farmácia',
    'tecnico de farmacia',
    'técnico de farmácia'
  ],

  topografia: [
    'topografia',
    'tecnico de topografia',
    'técnico de topografia'
  ],

  construcao_civil: [
    'construcao civil',
    'construção civil',
    'tecnico de construcao civil',
    'técnico de construção civil'
  ],

  engenharia_civil: [
    'engenharia civil'
  ],

  arquitectura: [
    'arquitectura',
    'arquitetura',
    'arquitectura e urbanismo',
    'arquitetura e urbanismo'
  ],

  electronica: [
    'electronica',
    'eletrónica',
    'eletronica',
    'electrónica',
    'electronica industrial',
    'eletrónica industrial'
  ],

  telecomunicacoes: [
    'telecomunicacoes',
    'telecomunicações',
    'engenharia de telecomunicacoes',
    'engenharia de telecomunicações'
  ],

  programacao: [
    'programacao',
    'programação',
    'desenvolvimento de software',
    'desenvolvimento web',
    'engenharia de software'
  ],

  redes_computadores: [
    'redes de computadores',
    'redes',
    'administracao de redes',
    'administração de redes'
  ],

  banco_dados: [
    'banco de dados',
    'bancos de dados',
    'base de dados',
    'bases de dados',
    'database'
  ],

  ciberseguranca: [
    'ciberseguranca',
    'cibersegurança',
    'seguranca informatica',
    'segurança informática',
    'seguranca de redes',
    'segurança de redes'
  ],

  inteligencia_artificial: [
    'inteligencia artificial',
    'inteligência artificial',
    'ia',
    'machine learning',
    'aprendizagem automatica',
    'aprendizagem automática'
  ],

  matematica: [
    'matematica',
    'matemática',
    'matematica aplicada',
    'matemática aplicada',
    'calculo',
    'cálculo',
    'estatistica',
    'estatística'
  ],

  fisica: [
    'fisica',
    'física',
    'fisica aplicada',
    'física aplicada'
  ],

  quimica: [
    'quimica',
    'química',
    'quimica aplicada',
    'química aplicada'
  ],

  biologia: [
    'biologia',
    'biologia geral'
  ],

  agricultura: [
    'agricultura',
    'tecnico agricola',
    'técnico agrícola'
  ],

  agronomia: [
    'agronomia',
    'engenharia agronomica',
    'engenharia agronómica'
  ],

  ambiente: [
    'ambiente',
    'gestao ambiental',
    'gestão ambiental',
    'engenharia ambiental'
  ],

  gestao: [
    'gestao',
    'gestão',
    'gestao de negocios',
    'gestão de negócios',
    'administracao',
    'administração'
  ],

  economia: [
    'economia',
    'economia e gestao',
    'economia e gestão'
  ],

  direito: [
    'direito',
    'ciencias juridicas',
    'ciências jurídicas'
  ],

  turismo: [
    'turismo',
    'gestao de turismo',
    'gestão de turismo'
  ],

  hotelaria: [
    'hotelaria',
    'gestao hoteleira',
    'gestão hoteleira'
  ],

  logistica: [
    'logistica',
    'logística',
    'gestao logistica',
    'gestão logística'
  ],

  recursos_humanos: [
    'recursos humanos',
    'gestao de recursos humanos',
    'gestão de recursos humanos'
  ],

  contabilidade_auditoria: [
    'contabilidade e auditoria',
    'contabilidade e auditoria'
  ],

  lingua_portuguesa: [
    'lingua portuguesa',
    'língua portuguesa',
    'portugues',
    'português'
  ],

  ingles: [
    'ingles',
    'inglês',
    'lingua inglesa',
    'língua inglesa'
  ],

  historia: [
    'historia',
    'história'
  ],

  geografia: [
    'geografia'
  ],

  sociologia: [
    'sociologia'
  ],

  psicologia: [
    'psicologia'
  ],

  educacao: [
    'educacao',
    'educação',
    'pedagogia',
    'ciencias da educacao',
    'ciências da educação'
  ],

  soldadura: [
    'soldadura',
    'soldagem',
    'tecnico de soldadura',
    'técnico de soldadura'
  ],

  transportes: [
    'transportes',
    'gestao de transportes',
    'gestão de transportes'
  ],

  generico: [
    'geral',
    'outro',
    'outros'
  ]
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
