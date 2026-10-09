import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import AuditLog from '../../models/AuditLog.js';
import { config } from '../../config/environment.js';

export class AuthService {
  static generateToken(user) {
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  static async login(email, password, ipAddress = '', userAgent = '') {
    if (!email || !password) {
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      throw new Error('Invalid email or password credentials');
    }

    if (!user.isActive) {
      throw new Error('Account has been deactivated. Please contact administrator.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new Error('Invalid email or password credentials');
    }

    user.lastLogin = new Date();
    await user.save();

    await AuditLog.create({
      user: user._id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user._id.toString(),
      details: { email: user.email, role: user.role },
      ipAddress,
      userAgent
    });

    const token = this.generateToken(user);
    const userObj = user.toJSON();

    return { token, user: userObj };
  }

  static async seedInitialAdmin() {
    const adminCount = await User.countDocuments({ role: { $in: ['super_admin', 'admin'] } });
    if (adminCount === 0) {
      const admin = new User({
        name: 'Enterprise Admin',
        email: 'admin@kodbrand.com',
        phone: '+91 9995982324',
        password: 'Password@123',
        role: 'super_admin',
        department: 'Management',
        isActive: true
      });
      await admin.save();
      console.log('[Auth] Seeded default super_admin: admin@kodbrand.com / Password@123');
    }
  }
}
