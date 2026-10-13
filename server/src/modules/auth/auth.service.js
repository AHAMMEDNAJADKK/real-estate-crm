import jwt from 'jsonwebtoken';
import User from '../../models/User.js';
import AuditLog from '../../models/AuditLog.js';
import { config, validateJwtSecret } from '../../config/environment.js';

export class AuthService {
  static generateToken(user) {
    const secret = validateJwtSecret(config.jwtSecret, { nodeEnv: config.nodeEnv });
    return jwt.sign(
      {
        id: user._id,
        email: user.email,
        role: user.role
      },
      secret,
      { expiresIn: config.jwtExpiresIn }
    );
  }

  static async login(email, password, ipAddress = '', userAgent = '') {
    if (!email || !password) {
      const err = new Error('Email and password are required');
      err.statusCode = 400;
      throw err;
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      const err = new Error('Invalid email or password credentials');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('Account has been deactivated. Please contact administrator.');
      err.statusCode = 403;
      throw err;
    }

    const isMatch = await user.comparePassword(String(password));
    if (!isMatch) {
      const err = new Error('Invalid email or password credentials');
      err.statusCode = 401;
      throw err;
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
    const superAdminEmail = 'superadmin@gmail.com';
    const existingSuperAdmin = await User.findOne({ email: superAdminEmail });

    if (!existingSuperAdmin) {
      const superAdmin = new User({
        name: 'Super Admin',
        email: superAdminEmail,
        phone: '+91 9995982324',
        password: 'superadmin@111',
        role: 'superadmin',
        department: 'Executive Management',
        isActive: true
      });
      await superAdmin.save();
      console.log(`[Auth] Seeded initial superadmin account (${superAdmin.email})`);
    } else if (!['superadmin', 'super_admin'].includes(existingSuperAdmin.role)) {
      console.warn(
        `[Auth] Account ${superAdminEmail} already exists with role '${existingSuperAdmin.role}'. Existing credentials preserved.`
      );
    }

    const defaultAdminEmail = 'admin@kodbrand.com';
    const existingAdmin = await User.findOne({ email: defaultAdminEmail });

    if (!existingAdmin) {
      const admin = new User({
        name: 'Enterprise Admin',
        email: defaultAdminEmail,
        phone: '+91 9995982324',
        password: 'Password@123',
        role: 'admin',
        department: 'Management',
        isActive: true
      });
      await admin.save();
      console.log(`[Auth] Seeded default admin account (${admin.email})`);
    }
  }
}

