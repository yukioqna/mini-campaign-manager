import jwt from 'jsonwebtoken';
import { User } from '../models';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  async register(email: string, password: string, name: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ where: { email: normalizedEmail } });
    if (existing) throw new AppError(409, 'Email already in use');

    const user = await User.create({ email: normalizedEmail, password_hash: password, name });
    const token = this.signToken(user.id);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  async login(email: string, password: string): Promise<{ token: string; user: { id: string; email: string; name: string } }> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ where: { email: normalizedEmail } });
    if (!user || !(await user.checkPassword(password))) {
      throw new AppError(401, 'Invalid email or password');
    }
    const token = this.signToken(user.id);
    return { token, user: { id: user.id, email: user.email, name: user.name } };
  }

  private signToken(userId: string): string {
    return jwt.sign({ userId }, process.env.JWT_SECRET!, { expiresIn: '7d' });
  }
}

export const authService = new AuthService();
