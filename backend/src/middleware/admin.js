export const ensureAdmin = (req, res, next) => {
  const userType = req.user?.userType;
  if (userType !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  return next();
};
