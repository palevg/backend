const jwt = require('jsonwebtoken');

module.exports = function checkAuth (req, res, next) {
  const token = (req.headers.authorization || '').replace(/Bearer\s?/, '');

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_KEY);
      req.userId = decoded.id;
      req.userAccId = decoded.accId;
      req.userAcc = decoded.acc;
      next();
    } catch (e) {
      return res.status(403).json({
        message: 'Немає доступу',
      });
    }
  } else {
    return res.status(403).json({
      message: 'Немає доступу',
    });
  }
};