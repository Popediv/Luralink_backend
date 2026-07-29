import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db.js';
import config from '../config/env.js';
import { successResponse, errorResponse } from '../utils/responseFormatter.js';

export async function signup(req, res, next) {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return errorResponse(res, 409, 'Email already in use', 'AUTH_EMAIL_TAKEN');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userRole = role || 'worker';

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: userRole
        }
      });

      if (userRole === 'worker') {
        await tx.worker.create({
          data: { userId: newUser.id }
        });
      } else if (userRole === 'facility_admin') {
        await tx.facility.create({
          data: {
            userId: newUser.id,
            name: name,
            type: 'unspecified',
            address: 'unspecified'
          }
        });
      }

      return newUser;
    });

    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1d' });

    return successResponse(res, 201, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return errorResponse(res, 401, 'Invalid credentials', 'AUTH_INVALID');
    }

    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      return errorResponse(res, 401, 'Invalid credentials', 'AUTH_INVALID');
    }

    const token = jwt.sign({ id: user.id, role: user.role }, config.jwtSecret, { expiresIn: '1d' });

    return successResponse(res, 200, {
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    next(err);
  }
}