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

