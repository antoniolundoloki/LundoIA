// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'Este registo já existe.' });
  }

  const status = err.status || 500;
  const message = status === 500 ? 'Erro interno do servidor.' : err.message;
  res.status(status).json({ error: message });
}

module.exports = { errorHandler };
