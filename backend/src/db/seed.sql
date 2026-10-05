-- LundoIA — catálogo inicial de módulos (mesmas listas já usadas no onboarding do frontend)

INSERT IGNORE INTO modules (name, category) VALUES
  -- Informática / Engenharia Informática
  ('Programação', 'informatica'),
  ('Redes', 'informatica'),
  ('Banco de Dados', 'informatica'),
  ('Hardware', 'informatica'),
  ('Sistemas Operativos', 'informatica'),
  ('Desenvolvimento Web', 'informatica'),
  ('Inteligência Artificial', 'informatica'),
  ('Segurança Informática', 'informatica'),
  ('Computação em Nuvem', 'informatica'),

  -- Direito
  ('Introdução ao Direito', 'direito'),
  ('Direito Civil', 'direito'),
  ('Direito Penal', 'direito'),
  ('Direito Constitucional', 'direito'),
  ('Direito Administrativo', 'direito'),
  ('Direito Internacional', 'direito'),

  -- Medicina / Enfermagem
  ('Anatomia', 'medicina'),
  ('Fisiologia', 'medicina'),
  ('Bioquímica', 'medicina'),
  ('Farmacologia', 'medicina'),
  ('Semiologia', 'medicina'),
  ('Microbiologia', 'medicina'),

  -- Genérico (fallback para qualquer outro curso/área)
  ('Fundamentos da área', 'generico'),
  ('Exercícios práticos', 'generico'),
  ('Resumos guiados', 'generico'),
  ('Preparação para provas', 'generico'),
  ('Projetos práticos', 'generico');

-- LundoIA — catálogo inicial da Biblioteca (mesmas categorias dos módulos)

-- Recursos oficiais/abertos reais — ligamos à fonte, sem copiar o ficheiro
-- (evita cópias desatualizadas e respeita a fonte original).
INSERT IGNORE INTO library_resources (title, category, resource_type, source_url, source_label) VALUES
  ('Constituição da República de Angola', 'direito', 'livro',
   'https://governo.gov.ao/documentos/constitui%C3%A7%C3%A3o', 'Governo de Angola'),
  ('Relatório de Pobreza em Angola', 'economia', 'livro',
   'https://www.ine.gov.ao/Arquivos/arquivosCarregados/Carregados/Publicacao_637494431350652835.pdf', 'INE Angola'),
  ('Anuário Estatístico da Educação', 'generico', 'livro',
   'https://www.ine.gov.ao/Arquivos/arquivosCarregados/Carregados/Publicacao_638376077484660214.pdf', 'INE Angola'),
  ('Plano Nacional de Desenvolvimento Sanitário 2012-2025', 'medicina', 'livro',
   'https://extranet.who.int/countryplanningcycles/sites/default/files/planning_cycle_repository/angola/plano_nacional_de_desenvolvimento_sanitario_pnds_2012-2025.pdf', 'Ministério da Saúde de Angola');

-- Guias próprios (conteúdo original da LundoIA), servidos localmente.
INSERT IGNORE INTO library_resources (title, category, resource_type, pages, file_name) VALUES
  ('Introdução à Programação', 'informatica', 'sebenta', 4, 'introducao-programacao.pdf'),
  ('Matemática Financeira Aplicada', 'matematica', 'sebenta', 3, 'matematica-financeira.pdf'),
  ('Guia de Métodos de Estudo', 'generico', 'sebenta', 3, 'guia-metodos-estudo.pdf');




INSERT IGNORE INTO modules (name, category) VALUES

-- =========================================================
-- INFORMÁTICA
-- =========================================================
('Programação', 'informatica'),
('Redes de Computadores', 'informatica'),
('Banco de Dados', 'informatica'),
('Hardware e Software', 'informatica'),
('Sistemas Operativos', 'informatica'),
('Desenvolvimento Web', 'informatica'),
('Inteligência Artificial', 'informatica'),
('Segurança Informática', 'informatica'),
('Computação em Nuvem', 'informatica'),

-- =========================================================
-- ELECTRICIDADE
-- =========================================================
('Fundamentos de Electricidade', 'electricidade'),
('Circuitos Elétricos', 'electricidade'),
('Instalações Elétricas', 'electricidade'),
('Máquinas Elétricas', 'electricidade'),
('Electrónica Básica', 'electricidade'),
('Comandos Elétricos', 'electricidade'),
('Sistemas de Proteção Elétrica', 'electricidade'),
('Desenho Elétrico', 'electricidade'),

-- =========================================================
-- FRIO E CLIMATIZAÇÃO
-- =========================================================
('Fundamentos de Refrigeração', 'frio_climatizacao'),
('Ciclo de Refrigeração', 'frio_climatizacao'),
('Sistemas de Ar Condicionado', 'frio_climatizacao'),
('Compressores', 'frio_climatizacao'),
('Manutenção de Sistemas de Frio', 'frio_climatizacao'),
('Instalação de Equipamentos de Climatização', 'frio_climatizacao'),
('Termodinâmica Aplicada', 'frio_climatizacao'),
('Segurança em Refrigeração', 'frio_climatizacao'),

-- =========================================================
-- DESENHADOR PROJECTISTA
-- =========================================================
('Desenho Técnico', 'desenhador_projectista'),
('Geometria Descritiva', 'desenhador_projectista'),
('Desenho Assistido por Computador', 'desenhador_projectista'),
('Leitura e Interpretação de Projetos', 'desenhador_projectista'),
('Plantas, Cortes e Alçados', 'desenhador_projectista'),
('Normas de Desenho Técnico', 'desenhador_projectista'),
('Projecto Arquitectónico', 'desenhador_projectista'),
('Representação Gráfica', 'desenhador_projectista'),

-- =========================================================
-- TECNOLOGIA DE MÓVEIS
-- =========================================================
('Tecnologia da Madeira', 'tecnologia_moveis'),
('Materiais para Mobiliário', 'tecnologia_moveis'),
('Desenho de Móveis', 'tecnologia_moveis'),
('Fabricação de Móveis', 'tecnologia_moveis'),
('Máquinas e Ferramentas', 'tecnologia_moveis'),
('Acabamento de Móveis', 'tecnologia_moveis'),
('Marcenaria', 'tecnologia_moveis'),
('Segurança na Oficina', 'tecnologia_moveis'),

-- =========================================================
-- MECÂNICA
-- =========================================================
('Mecânica Geral', 'mecanica'),
('Mecânica Automóvel', 'mecanica'),
('Motores', 'mecanica'),
('Sistemas de Transmissão', 'mecanica'),
('Sistemas de Travagem', 'mecanica'),
('Sistemas de Direção', 'mecanica'),
('Manutenção Mecânica', 'mecanica'),
('Desenho Mecânico', 'mecanica'),

-- =========================================================
-- MECÂNICA INDUSTRIAL
-- =========================================================
('Manutenção Industrial', 'mecanica_industrial'),
('Máquinas Industriais', 'mecanica_industrial'),
('Elementos de Máquinas', 'mecanica_industrial'),
('Mecânica Aplicada', 'mecanica_industrial'),
('Hidráulica', 'mecanica_industrial'),
('Pneumática', 'mecanica_industrial'),
('Lubrificação Industrial', 'mecanica_industrial'),
('Segurança Industrial', 'mecanica_industrial'),

-- =========================================================
-- GESTÃO EMPRESARIAL
-- =========================================================
('Fundamentos de Gestão', 'gestao_empresarial'),
('Gestão de Empresas', 'gestao_empresarial'),
('Planeamento Empresarial', 'gestao_empresarial'),
('Gestão de Recursos Humanos', 'gestao_empresarial'),
('Gestão Financeira', 'gestao_empresarial'),
('Empreendedorismo', 'gestao_empresarial'),
('Marketing', 'gestao_empresarial'),
('Plano de Negócios', 'gestao_empresarial'),

-- =========================================================
-- CONTABILIDADE
-- =========================================================
('Contabilidade Geral', 'contabilidade'),
('Contabilidade Financeira', 'contabilidade'),
('Contabilidade de Custos', 'contabilidade'),
('Princípios de Contabilidade', 'contabilidade'),
('Balanço Patrimonial', 'contabilidade'),
('Demonstrações Financeiras', 'contabilidade'),
('Fiscalidade', 'contabilidade'),
('Auditoria', 'contabilidade'),

-- =========================================================
-- MEDICINA
-- =========================================================
('Anatomia', 'medicina'),
('Fisiologia', 'medicina'),
('Bioquímica', 'medicina'),
('Farmacologia', 'medicina'),
('Microbiologia', 'medicina'),
('Patologia', 'medicina'),
('Semiologia Médica', 'medicina'),
('Saúde Pública', 'medicina'),

-- =========================================================
-- ENFERMAGEM
-- =========================================================
('Fundamentos de Enfermagem', 'enfermagem'),
('Anatomia e Fisiologia', 'enfermagem'),
('Cuidados de Enfermagem', 'enfermagem'),
('Enfermagem Médico-Cirúrgica', 'enfermagem'),
('Saúde Materno-Infantil', 'enfermagem'),
('Saúde Comunitária', 'enfermagem'),
('Farmacologia em Enfermagem', 'enfermagem'),
('Primeiros Socorros', 'enfermagem'),

-- =========================================================
-- FARMÁCIA
-- =========================================================
('Farmacologia', 'farmacia'),
('Farmacognosia', 'farmacia'),
('Tecnologia Farmacêutica', 'farmacia'),
('Química Farmacêutica', 'farmacia'),
('Microbiologia Farmacêutica', 'farmacia'),
('Dispensação de Medicamentos', 'farmacia'),
('Gestão Farmacêutica', 'farmacia'),
('Toxicologia', 'farmacia'),

-- =========================================================
-- TOPOGRAFIA
-- =========================================================
('Fundamentos de Topografia', 'topografia'),
('Topografia Geral', 'topografia'),
('Levantamentos Topográficos', 'topografia'),
('Nivelamento', 'topografia'),
('Cartografia', 'topografia'),
('Geodesia', 'topografia'),
('Estação Total', 'topografia'),
('GPS e Sistemas de Posicionamento', 'topografia'),

-- =========================================================
-- CONSTRUÇÃO CIVIL
-- =========================================================
('Materiais de Construção', 'construcao_civil'),
('Tecnologia da Construção', 'construcao_civil'),
('Betão Armado', 'construcao_civil'),
('Fundações', 'construcao_civil'),
('Estruturas', 'construcao_civil'),
('Instalações Prediais', 'construcao_civil'),
('Orçamentação de Obras', 'construcao_civil'),
('Segurança na Construção', 'construcao_civil'),

-- =========================================================
-- ENGENHARIA CIVIL
-- =========================================================
('Resistência dos Materiais', 'engenharia_civil'),
('Mecânica dos Solos', 'engenharia_civil'),
('Estruturas de Betão', 'engenharia_civil'),
('Hidráulica', 'engenharia_civil'),
('Geotecnia', 'engenharia_civil'),
('Construção Civil', 'engenharia_civil'),
('Estradas e Pavimentos', 'engenharia_civil'),
('Gestão de Obras', 'engenharia_civil'),

-- =========================================================
-- ARQUITECTURA
-- =========================================================
('Projecto Arquitectónico', 'arquitectura'),
('Desenho Arquitectónico', 'arquitectura'),
('História da Arquitectura', 'arquitectura'),
('Teoria da Arquitectura', 'arquitectura'),
('Urbanismo', 'arquitectura'),
('Materiais de Construção', 'arquitectura'),
('Representação Gráfica', 'arquitectura'),
('CAD e Modelação 3D', 'arquitectura'),

-- =========================================================
-- ELECTRÓNICA
-- =========================================================
('Electrónica Analógica', 'electronica'),
('Electrónica Digital', 'electronica'),
('Circuitos Electrónicos', 'electronica'),
('Díodos e Transístores', 'electronica'),
('Microcontroladores', 'electronica'),
('Sistemas Digitais', 'electronica'),
('Instrumentação Electrónica', 'electronica'),
('Automação', 'electronica'),

-- =========================================================
-- TELECOMUNICAÇÕES
-- =========================================================
('Fundamentos de Telecomunicações', 'telecomunicacoes'),
('Sistemas de Comunicação', 'telecomunicacoes'),
('Fibra Óptica', 'telecomunicacoes'),
('Antenas', 'telecomunicacoes'),
('Comunicações Móveis', 'telecomunicacoes'),
('Transmissão de Dados', 'telecomunicacoes'),
('Redes de Telecomunicações', 'telecomunicacoes'),
('Sistemas de Rádio', 'telecomunicacoes'),

-- =========================================================
-- PROGRAMAÇÃO
-- =========================================================
('Algoritmos e Lógica', 'programacao'),
('Programação Web', 'programacao'),
('Programação Orientada a Objetos', 'programacao'),
('Estruturas de Dados', 'programacao'),
('JavaScript', 'programacao'),
('Java', 'programacao'),
('C#', 'programacao'),
('Desenvolvimento de Aplicações', 'programacao'),

-- =========================================================
-- REDES DE COMPUTADORES
-- =========================================================
('Fundamentos de Redes', 'redes_computadores'),
('Modelo OSI', 'redes_computadores'),
('TCP/IP', 'redes_computadores'),
('Endereçamento IP', 'redes_computadores'),
('Subnetting', 'redes_computadores'),
('Roteamento', 'redes_computadores'),
('Switching', 'redes_computadores'),
('Administração de Redes', 'redes_computadores'),

-- =========================================================
-- CIBERSEGURANÇA
-- =========================================================
('Fundamentos de Cibersegurança', 'ciberseguranca'),
('Segurança de Redes', 'ciberseguranca'),
('Criptografia', 'ciberseguranca'),
('Malware e Ameaças Digitais', 'ciberseguranca'),
('Segurança de Sistemas', 'ciberseguranca'),
('Segurança Web', 'ciberseguranca'),
('Ethical Hacking', 'ciberseguranca'),
('Proteção de Dados', 'ciberseguranca'),

-- =========================================================
-- INTELIGÊNCIA ARTIFICIAL
-- =========================================================
('Fundamentos de Inteligência Artificial', 'inteligencia_artificial'),
('Machine Learning', 'inteligencia_artificial'),
('Deep Learning', 'inteligencia_artificial'),
('Redes Neuronais', 'inteligencia_artificial'),
('Processamento de Linguagem Natural', 'inteligencia_artificial'),
('Visão Computacional', 'inteligencia_artificial'),
('Modelos de Linguagem', 'inteligencia_artificial'),
('Aplicações de IA', 'inteligencia_artificial'),

-- =========================================================
-- MATEMÁTICA
-- =========================================================
('Álgebra', 'matematica'),
('Geometria', 'matematica'),
('Trigonometria', 'matematica'),
('Funções', 'matematica'),
('Equações', 'matematica'),
('Probabilidade', 'matematica'),
('Matemática Aplicada', 'matematica'),
('Lógica Matemática', 'matematica'),

-- =========================================================
-- FÍSICA
-- =========================================================
('Mecânica', 'fisica'),
('Cinemática', 'fisica'),
('Dinâmica', 'fisica'),
('Termodinâmica', 'fisica'),
('Electricidade e Magnetismo', 'fisica'),
('Óptica', 'fisica'),
('Ondas', 'fisica'),
('Física Moderna', 'fisica'),

-- =========================================================
-- QUÍMICA
-- =========================================================
('Química Geral', 'quimica'),
('Química Orgânica', 'quimica'),
('Química Inorgânica', 'quimica'),
('Química Analítica', 'quimica'),
('Estrutura Atómica', 'quimica'),
('Ligações Químicas', 'quimica'),
('Reações Químicas', 'quimica'),
('Estequiometria', 'quimica'),

-- =========================================================
-- BIOLOGIA
-- =========================================================
('Biologia Celular', 'biologia'),
('Genética', 'biologia'),
('Microbiologia', 'biologia'),
('Ecologia', 'biologia'),
('Anatomia', 'biologia'),
('Fisiologia', 'biologia'),
('Evolução', 'biologia'),
('Botânica', 'biologia'),

-- =========================================================
-- AGRICULTURA
-- =========================================================
('Fundamentos de Agricultura', 'agricultura'),
('Ciência do Solo', 'agricultura'),
('Produção Vegetal', 'agricultura'),
('Irrigação', 'agricultura'),
('Fitotecnia', 'agricultura'),
('Agropecuária', 'agricultura'),
('Gestão Agrícola', 'agricultura'),
('Máquinas Agrícolas', 'agricultura'),

-- =========================================================
-- AGRONOMIA
-- =========================================================
('Ciência do Solo', 'agronomia'),
('Fitotecnia', 'agronomia'),
('Zootecnia', 'agronomia'),
('Entomologia Agrícola', 'agronomia'),
('Fitopatologia', 'agronomia'),
('Irrigação e Drenagem', 'agronomia'),
('Melhoramento Vegetal', 'agronomia'),
('Gestão de Produção Agrícola', 'agronomia'),

-- =========================================================
-- GESTÃO / ADMINISTRAÇÃO
-- =========================================================
('Teoria da Administração', 'gestao'),
('Gestão Estratégica', 'gestao'),
('Gestão Financeira', 'gestao'),
('Gestão de Pessoas', 'gestao'),
('Gestão de Projectos', 'gestao'),
('Empreendedorismo', 'gestao'),
('Marketing', 'gestao'),
('Comportamento Organizacional', 'gestao'),

-- =========================================================
-- ECONOMIA
-- =========================================================
('Introdução à Economia', 'economia'),
('Microeconomia', 'economia'),
('Macroeconomia', 'economia'),
('Economia de Angola', 'economia'),
('Inflação e Desemprego', 'economia'),
('Política Económica', 'economia'),
('Economia Internacional', 'economia'),
('Finanças Públicas', 'economia'),

-- =========================================================
-- DIREITO
-- =========================================================
('Introdução ao Direito', 'direito'),
('Direito Constitucional', 'direito'),
('Direito Civil', 'direito'),
('Direito Penal', 'direito'),
('Direito Administrativo', 'direito'),
('Direito Comercial', 'direito'),
('Direito do Trabalho', 'direito'),
('Direito Internacional', 'direito'),

-- =========================================================
-- TURISMO
-- =========================================================
('Fundamentos de Turismo', 'turismo'),
('Geografia do Turismo', 'turismo'),
('Gestão de Turismo', 'turismo'),
('Agências de Viagens', 'turismo'),
('Animação Turística', 'turismo'),
('Marketing Turístico', 'turismo'),
('Turismo em Angola', 'turismo'),
('Planeamento Turístico', 'turismo'),

-- =========================================================
-- HOTELARIA
-- =========================================================
('Fundamentos de Hotelaria', 'hotelaria'),
('Gestão Hoteleira', 'hotelaria'),
('Recepção e Atendimento', 'hotelaria'),
('Alimentos e Bebidas', 'hotelaria'),
('Gestão de Reservas', 'hotelaria'),
('Higiene e Segurança Alimentar', 'hotelaria'),
('Housekeeping', 'hotelaria'),
('Marketing Hoteleiro', 'hotelaria'),

-- =========================================================
-- LOGÍSTICA
-- =========================================================
('Fundamentos de Logística', 'logistica'),
('Gestão de Stocks', 'logistica'),
('Cadeia de Abastecimento', 'logistica'),
('Armazenagem', 'logistica'),
('Transportes e Distribuição', 'logistica'),
('Compras e Aprovisionamento', 'logistica'),
('Logística Empresarial', 'logistica'),
('Gestão de Inventário', 'logistica'),

-- =========================================================
-- RECURSOS HUMANOS
-- =========================================================
('Gestão de Recursos Humanos', 'recursos_humanos'),
('Recrutamento e Seleção', 'recursos_humanos'),
('Gestão de Pessoas', 'recursos_humanos'),
('Formação Profissional', 'recursos_humanos'),
('Avaliação de Desempenho', 'recursos_humanos'),
('Legislação Laboral', 'recursos_humanos'),
('Motivação no Trabalho', 'recursos_humanos'),
('Gestão de Conflitos', 'recursos_humanos'),

-- =========================================================
-- LÍNGUA PORTUGUESA
-- =========================================================
('Gramática', 'lingua_portuguesa'),
('Literatura', 'lingua_portuguesa'),
('Redação', 'lingua_portuguesa'),
('Interpretação de Texto', 'lingua_portuguesa'),
('Ortografia', 'lingua_portuguesa'),
('Sintaxe', 'lingua_portuguesa'),
('Morfologia', 'lingua_portuguesa'),
('Comunicação Oral', 'lingua_portuguesa'),

-- =========================================================
-- INGLÊS
-- =========================================================
('English Grammar', 'ingles'),
('Vocabulary', 'ingles'),
('Reading', 'ingles'),
('Writing', 'ingles'),
('Listening', 'ingles'),
('Speaking', 'ingles'),
('English Conversation', 'ingles'),
('Technical English', 'ingles'),

-- =========================================================
-- HISTÓRIA
-- =========================================================
('História de Angola', 'historia'),
('História de África', 'historia'),
('História Universal', 'historia'),
('Colonialismo em África', 'historia'),
('Independência de Angola', 'historia'),
('Pós-Independência de Angola', 'historia'),
('Civilizações Africanas', 'historia'),
('História Contemporânea', 'historia'),

-- =========================================================
-- GEOGRAFIA
-- =========================================================
('Geografia de Angola', 'geografia'),
('Geografia de África', 'geografia'),
('Cartografia', 'geografia'),
('Climatologia', 'geografia'),
('Geografia Económica', 'geografia'),
('Geografia Física', 'geografia'),
('Geografia Humana', 'geografia'),
('População e Território', 'geografia'),

-- =========================================================
-- EDUCAÇÃO / PEDAGOGIA
-- =========================================================
('Fundamentos da Educação', 'educacao'),
('Pedagogia', 'educacao'),
('Didática', 'educacao'),
('Psicologia da Educação', 'educacao'),
('Planificação de Aulas', 'educacao'),
('Avaliação da Aprendizagem', 'educacao'),
('Metodologias de Ensino', 'educacao'),
('Gestão Escolar', 'educacao'),

-- =========================================================
-- AMBIENTE
-- =========================================================
('Gestão Ambiental', 'ambiente'),
('Educação Ambiental', 'ambiente'),
('Poluição Ambiental', 'ambiente'),
('Alterações Climáticas', 'ambiente'),
('Gestão de Resíduos', 'ambiente'),
('Conservação da Biodiversidade', 'ambiente'),
('Recursos Naturais', 'ambiente'),
('Impacto Ambiental', 'ambiente'),

-- =========================================================
-- SOLDADURA
-- =========================================================
('Fundamentos de Soldadura', 'soldadura'),
('Soldadura MIG', 'soldadura'),
('Soldadura MAG', 'soldadura'),
('Soldadura TIG', 'soldadura'),
('Soldadura Eléctrica', 'soldadura'),
('Materiais e Consumíveis', 'soldadura'),
('Segurança na Soldadura', 'soldadura'),
('Leitura de Desenho de Soldadura', 'soldadura'),

-- =========================================================
-- TRANSPORTES
-- =========================================================
('Gestão de Transportes', 'transportes'),
('Logística de Transportes', 'transportes'),
('Segurança Rodoviária', 'transportes'),
('Planeamento de Transportes', 'transportes'),
('Transportes Terrestres', 'transportes'),
('Transportes Marítimos', 'transportes'),
('Transportes Aéreos', 'transportes'),
('Manutenção de Veículos', 'transportes'),

-- =========================================================
-- FALLBACK
-- =========================================================
('Fundamentos da área', 'generico'),
('Exercícios práticos', 'generico'),
('Resumos guiados', 'generico'),
('Preparação para provas', 'generico'),
('Projetos práticos', 'generico');