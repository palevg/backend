const { body } = require('express-validator');

const loginValidation = [
  body('email', 'Невірний формат e-mail').isEmail(),
  body('password', 'Пароль повинен бути мінімум 5 символів').isLength({ min: 5 }),
];

const registerValidation = [
  body('email', 'Невірний формат e-mail').isEmail(),
  body('password', 'Пароль повинен бути мінімум 5 символів').isLength({ min: 5 }),
  body('fullName', "Вкажіть ім'я").isLength({ min: 3 }),
  body('avatarUrl', 'Невірне посилання на аватарку').optional().isURL(),
];

const postCreateValidation = [
  body('title', 'Введіть заголовок статті').isLength({ min: 3 }).isString(),
  body('text', 'Введіть текст статті').isLength({ min: 10 }).isString(),
  body('tags', 'Невірний формат тегів').optional().isString(),
  body('imageUrl', 'Невірне посилання на зображення').optional().isString(),
];

module.exports = { loginValidation, registerValidation, postCreateValidation };