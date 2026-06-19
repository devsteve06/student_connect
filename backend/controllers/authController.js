// controllers/authController.js
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { findAccountByEmail, createAccount } from '../data/accounts.js';

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '30d' });

// POST /auth/register — create a student, firm, or university account
export const registerUser = async (req, res, next) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'name, email, password and role are required.' });
  }
  if (!['student', 'firm', 'university'].includes(role)) {
    return res.status(400).json({ message: `Unsupported role: ${role}` });
  }

  try {
    const existing = await findAccountByEmail(email);
    if (existing) {
      return res.status(400).json({ message: 'A profile with this email already exists.' });
    }

    const account = await createAccount(req.body);
    res.status(201).json({
      _id: account.id,
      name: account.name,
      email: account.email,
      role: account.role,
      token: generateToken(account.id, account.role)
    });
  } catch (error) {
    next(error);
  }
};

// POST /auth/login — authenticate against any role table and issue a JWT
export const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const account = await findAccountByEmail(email);
    if (account && (await bcrypt.compare(password || '', account.password_hash))) {
      return res.json({
        _id: account.id,
        name: account.name,
        email: account.email,
        role: account.role,
        token: generateToken(account.id, account.role)
      });
    }
    res.status(401).json({ message: 'Invalid credentials provided.' });
  } catch (error) {
    next(error);
  }
};
