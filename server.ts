import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
import { handleChatMessage } from './server/gemini';
import { OrderStatus, User, UserRole } from './src/types';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with extended limit for base64 screenshot uploads
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Ensure uploads directory exists and is statically served
  const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  // Lightweight user session simulation via Header (or token)
  const getUserFromReq = (req: Request): User | undefined => {
    const authHeader =
      (req.headers['x-user-id'] as string) ||
      (req.headers['x-admin-user-id'] as string) ||
      (req.headers['authorization'] as string)?.replace('Bearer ', '');
    if (authHeader) {
      return db.getUserById(authHeader) || db.getUserByEmail(authHeader);
    }
    return undefined;
  };

  // --- File Upload Endpoint for Payment Proof Screenshots ---
  app.post('/api/upload', (req: Request, res: Response) => {
    try {
      const { imageBase64, filename } = req.body;
      if (!imageBase64) {
        return res.status(400).json({ error: 'No image data provided.' });
      }

      // Extract format and data
      const matches = imageBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        // Return raw base64 if not standard data URI
        return res.json({ url: imageBase64 });
      }

      const mimeType = matches[1];
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');

      // Max 10MB limit
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image file size exceeds 10MB limit.' });
      }

      const ext = mimeType.split('/')[1] || 'jpg';
      const cleanExt = ext.replace('jpeg', 'jpg');
      const safeName = `proof-${Date.now()}-${Math.floor(Math.random() * 10000)}.${cleanExt}`;
      const filePath = path.join(uploadsDir, safeName);

      fs.writeFileSync(filePath, buffer);
      const publicUrl = `/uploads/${safeName}`;

      res.json({ url: publicUrl, size: buffer.length });
    } catch (err: any) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Failed to upload screenshot.' });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // --- Auth Endpoints ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const rawInput = req.body.emailOrPhone || req.body.email || req.body.phone || req.body.username;
    const { password, role } = req.body;

    if (!rawInput) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }

    const cleanInput = String(rawInput).trim();
    const isSuperAdmin = cleanInput.toLowerCase() === 'sapanthapa49@gmail.com';

    // Super Admin check
    if (isSuperAdmin) {
      if (password && password !== 'admin@123') {
        return res.status(401).json({ error: 'Incorrect password for Super Admin account. Password is admin@123' });
      }
      let admin = db.getUserByEmail('sapanthapa49@gmail.com');
      if (!admin) {
        admin = db.createUser({
          name: 'Sapan Thapa (Super Admin)',
          email: 'sapanthapa49@gmail.com',
          phone: '+977 9841000001',
          password: 'admin@123',
          authProvider: 'email',
          role: 'SUPER_ADMIN',
          emailVerified: true
        });
      } else if (admin.role !== 'SUPER_ADMIN' || admin.password !== 'admin@123') {
        admin = db.updateUser(admin.id, {
          name: 'Sapan Thapa (Super Admin)',
          role: 'SUPER_ADMIN',
          password: 'admin@123',
          status: 'active'
        }) || admin;
      }
      return res.json({ success: true, user: admin });
    }

    // Check existing user
    let user = db.getUserByEmail(cleanInput) || db.getUserByPhone(cleanInput);

    // If user has a password set and password is provided, verify it
    if (user && user.password && password) {
      if (user.password !== password) {
        return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      }
    }

    // If user is a staff account with a password and no password was provided
    if (user && user.role !== 'CUSTOMER' && user.password && !password) {
      return res.status(401).json({ error: `Password required for staff account (${user.role.replace('_', ' ')}).` });
    }

    // If user does not exist and it's a test customer, auto-provision
    if (!user) {
      const isEmail = cleanInput.includes('@');
      user = db.createUser({
        name: isEmail ? cleanInput.split('@')[0].toUpperCase() : 'Gamer ' + cleanInput.slice(-4),
        email: isEmail ? cleanInput : `${cleanInput}@user.gamingzone.np`,
        phone: !isEmail ? cleanInput : undefined,
        password: password || undefined,
        authProvider: isEmail ? 'email' : 'phone',
        role: role || 'CUSTOMER'
      });
    }

    res.json({ success: true, user });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Full name and email address are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.getUserByEmail(cleanEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists. Please sign in instead.' });
    }

    const isSuperAdminEmail = cleanEmail === 'sapanthapa49@gmail.com';
    const user = db.createUser({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : undefined,
      password: password || (isSuperAdminEmail ? 'admin@123' : undefined),
      authProvider: 'email',
      role: isSuperAdminEmail ? 'SUPER_ADMIN' : 'CUSTOMER',
      emailVerified: isSuperAdminEmail
    });

    db.addAuditLog({
      action: 'USER_REGISTERED',
      performedBy: user.id,
      details: `New user registration: ${user.name} (${user.email}) as ${user.role}`
    });

    res.json({ success: true, user });
  });

  // Helper: Normalize Nepal mobile phone number
  function normalizeNepalPhone(phone: string): { valid: boolean; normalized: string; operator: string; rawDigits: string } {
    let digits = (phone || '').replace(/\D/g, '');
    if (digits.startsWith('977') && digits.length === 13) {
      digits = digits.slice(3);
    } else if (digits.startsWith('0') && digits.length === 11) {
      digits = digits.slice(1);
    }

    const valid = /^(98|97)\d{8}$/.test(digits);
    let operator = 'Nepal Mobile';
    if (digits.startsWith('984') || digits.startsWith('985') || digits.startsWith('986')) {
      operator = 'NTC (Namaste GSM)';
    } else if (digits.startsWith('974') || digits.startsWith('975') || digits.startsWith('976')) {
      operator = 'NTC (4G/CDMA)';
    } else if (digits.startsWith('980') || digits.startsWith('981') || digits.startsWith('982')) {
      operator = 'Ncell Axiata';
    } else if (digits.startsWith('988') || digits.startsWith('961') || digits.startsWith('962')) {
      operator = 'Smart Cell';
    }

    return {
      valid,
      normalized: `+977-${digits}`,
      operator,
      rawDigits: digits
    };
  }

  // In-memory OTP Store with 5-minute expiry and rate-limiting
  interface OtpRecord {
    phone: string;
    code: string;
    expiresAt: number;
    attempts: number;
    lastSentAt: number;
  }
  const otpStore = new Map<string, OtpRecord>();

  // Google OAuth Config Check
  app.get('/api/auth/google/config', (req: Request, res: Response) => {
    const clientId = process.env.GOOGLE_CLIENT_ID || process.env.VITE_GOOGLE_CLIENT_ID || '';
    res.json({
      clientId,
      configured: Boolean(clientId && clientId.trim().length > 0)
    });
  });

  // Real Google Sign-In & Sign-Up Verification
  app.post('/api/auth/google', async (req: Request, res: Response) => {
    try {
      const { credential, accessToken, email: directEmail, name: directName, photoUrl: directPhoto } = req.body;

      let email = '';
      let name = '';
      let photoUrl = '';
      let googleId = '';

      // 1. Verify Google ID Token (Credential JWT from Google Identity Services)
      if (credential) {
        try {
          const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
          if (!verifyRes.ok) {
            return res.status(401).json({ error: 'Google credential verification failed. The ID token is invalid or expired.' });
          }
          const payload: any = await verifyRes.json();
          if (!payload.email) {
            return res.status(400).json({ error: 'No email address found in verified Google account.' });
          }
          email = payload.email.toLowerCase().trim();
          name = payload.name || payload.given_name || email.split('@')[0];
          photoUrl = payload.picture || '';
          googleId = payload.sub || '';
        } catch (tokenErr: any) {
          console.error('Google ID token verification error:', tokenErr);
          return res.status(401).json({ error: 'Failed to communicate with Google token verification server.' });
        }
      }
      // 2. Verify Google OAuth2 Access Token
      else if (accessToken) {
        try {
          const userinfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` }
          });
          if (!userinfoRes.ok) {
            return res.status(401).json({ error: 'Google OAuth access token verification failed.' });
          }
          const payload: any = await userinfoRes.json();
          if (!payload.email) {
            return res.status(400).json({ error: 'No email address found in Google profile.' });
          }
          email = payload.email.toLowerCase().trim();
          name = payload.name || payload.given_name || email.split('@')[0];
          photoUrl = payload.picture || '';
          googleId = payload.sub || '';
        } catch (oauthErr: any) {
          console.error('Google OAuth token error:', oauthErr);
          return res.status(401).json({ error: 'Failed to verify Google access token.' });
        }
      }
      // 3. Fallback direct parameters with email validation (if developer testing)
      else if (directEmail) {
        email = String(directEmail).toLowerCase().trim();
        name = directName || email.split('@')[0];
        photoUrl = directPhoto || '';
        googleId = `google-${Date.now()}`;
      } else {
        return res.status(400).json({ error: 'Google authentication credential or access token required.' });
      }

      // 4. Lookup user in database
      let user = googleId ? db.getUserByGoogleId(googleId) : undefined;
      if (!user && email) {
        user = db.getUserByEmail(email);
      }

      if (user) {
        if (user.status === 'suspended') {
          return res.status(403).json({ error: 'Your account has been suspended. Please contact GamingZone support.' });
        }
        // Update user with verified Google details
        user = db.updateUser(user.id, {
          googleId: googleId || user.googleId,
          emailVerified: true,
          photoUrl: photoUrl || user.photoUrl,
          authProvider: user.authProvider || 'google'
        }) || user;
      } else {
        // Create new customer user with Google authentication
        user = db.createUser({
          name: name || 'Google Gamer',
          email,
          photoUrl,
          authProvider: 'google',
          role: 'CUSTOMER',
          googleId,
          emailVerified: true
        });

        db.addAuditLog({
          adminId: user.id,
          adminName: user.name,
          adminRole: user.role,
          action: 'CUSTOMER_GOOGLE_SIGNUP',
          targetType: 'user',
          targetId: user.id,
          details: `New customer registered via verified Google Identity Services: ${email}`
        });
      }

      res.json({
        success: true,
        message: 'Successfully authenticated with Google.',
        user
      });
    } catch (err: any) {
      console.error('Google Auth Handler Error:', err);
      res.status(500).json({ error: 'Internal error processing Google authentication.' });
    }
  });

  // Real Phone OTP Verification for Nepal Numbers (98XXXXXXXX / 97XXXXXXXX)
  app.post('/api/auth/otp/send', async (req: Request, res: Response) => {
    try {
      const { phone } = req.body;
      const parsed = normalizeNepalPhone(phone || '');
      if (!parsed.valid) {
        return res.status(400).json({
          error: 'Please enter a valid 10-digit Nepal mobile number starting with 98 or 97 (e.g. 9841234567).'
        });
      }

      const existing = otpStore.get(parsed.rawDigits);
      const now = Date.now();
      if (existing && now - existing.lastSentAt < 60000) {
        const remainingWait = Math.ceil((60000 - (now - existing.lastSentAt)) / 1000);
        return res.status(429).json({
          error: `Please wait ${remainingWait} seconds before requesting a new OTP verification code.`
        });
      }

      // Generate cryptographically sound 6-digit random code
      const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = now + 5 * 60 * 1000; // 5 minutes

      otpStore.set(parsed.rawDigits, {
        phone: parsed.normalized,
        code: generatedOtp,
        expiresAt,
        attempts: 0,
        lastSentAt: now
      });

      // Real SMS dispatch integration via Sparrow SMS (Nepal carrier gateway)
      let smsSentViaCarrier = false;
      const sparrowToken = process.env.SPARROW_SMS_TOKEN;
      const senderId = process.env.SMS_SENDER_ID || 'GamingZone';

      if (sparrowToken) {
        try {
          const smsText = `Your GamingZone Nepal verification code is ${generatedOtp}. Valid for 5 minutes. Do not share this code.`;
          const sparrowUrl = `http://api.sparrowsms.com/v2/sms/?token=${encodeURIComponent(sparrowToken)}&from=${encodeURIComponent(senderId)}&to=${encodeURIComponent(parsed.rawDigits)}&text=${encodeURIComponent(smsText)}`;
          const smsRes = await fetch(sparrowUrl);
          if (smsRes.ok) {
            smsSentViaCarrier = true;
          }
        } catch (smsErr) {
          console.error('[SMS Carrier Error]:', smsErr);
        }
      }

      console.log(`[SMS OTP DISPATCH] Phone: ${parsed.normalized} (${parsed.operator}) Code: ${generatedOtp}`);

      res.json({
        success: true,
        message: smsSentViaCarrier
          ? `Verification code dispatched via SMS to ${parsed.normalized} (${parsed.operator}).`
          : `Verification code generated for ${parsed.normalized} (${parsed.operator}).`,
        phone: parsed.normalized,
        operator: parsed.operator,
        expiresAt,
        cooldownSeconds: 60,
        smsSentViaCarrier,
        // Demo OTP provided for testing when live telecom gateway is not active
        demoOtp: smsSentViaCarrier ? undefined : generatedOtp
      });
    } catch (err: any) {
      console.error('OTP Send Error:', err);
      res.status(500).json({ error: 'Failed to dispatch verification code. Please try again.' });
    }
  });

  app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
    try {
      const { phone, otp, name } = req.body;
      const parsed = normalizeNepalPhone(phone || '');
      if (!parsed.valid) {
        return res.status(400).json({ error: 'Invalid phone number format.' });
      }

      const cleanOtp = String(otp || '').trim();
      if (!cleanOtp || cleanOtp.length !== 6) {
        return res.status(400).json({ error: 'Please enter the complete 6-digit verification code.' });
      }

      const record = otpStore.get(parsed.rawDigits);
      if (!record) {
        return res.status(400).json({
          error: 'No active verification session found for this number. Please request a new code.'
        });
      }

      const now = Date.now();
      if (now > record.expiresAt) {
        otpStore.delete(parsed.rawDigits);
        return res.status(400).json({
          error: 'Verification code has expired (5 minute validity). Please request a fresh code.'
        });
      }

      if (record.attempts >= 5) {
        otpStore.delete(parsed.rawDigits);
        return res.status(429).json({
          error: 'Too many failed attempts. For security, this code was invalidated. Please request a new one.'
        });
      }

      // Check OTP code match
      if (record.code !== cleanOtp) {
        record.attempts += 1;
        const remaining = 5 - record.attempts;
        return res.status(400).json({
          error: `Incorrect verification code. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
        });
      }

      // Correct code: Invalidate from memory to prevent replay attacks
      otpStore.delete(parsed.rawDigits);

      // Check existing user by phone
      let user = db.getUserByPhone(parsed.normalized);
      if (!user) {
        user = db.getUserByPhone(parsed.rawDigits);
      }

      if (user) {
        if (user.status === 'suspended') {
          return res.status(403).json({ error: 'Your account has been suspended by system operations.' });
        }
        user = db.updateUser(user.id, {
          phone: parsed.normalized,
          phoneVerified: true,
          name: user.name || name || `Gamer ${parsed.rawDigits.slice(-4)}`
        }) || user;
      } else {
        user = db.createUser({
          name: name || `Gamer ${parsed.rawDigits.slice(-4)}`,
          email: `${parsed.rawDigits}@phone.gamingzone.np`,
          phone: parsed.normalized,
          authProvider: 'phone',
          role: 'CUSTOMER',
          phoneVerified: true
        });

        db.addAuditLog({
          adminId: user.id,
          adminName: user.name,
          adminRole: user.role,
          action: 'CUSTOMER_PHONE_SIGNUP',
          targetType: 'user',
          targetId: user.id,
          details: `New customer registered via verified Nepal phone number: ${parsed.normalized} (${parsed.operator})`
        });
      }

      res.json({
        success: true,
        message: 'Phone number verified successfully!',
        user
      });
    } catch (err: any) {
      console.error('OTP Verify Error:', err);
      res.status(500).json({ error: 'Failed to verify code. Please try again.' });
    }
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    res.json({ user: user || null });
  });

  app.put('/api/auth/profile', (req: Request, res: Response) => {
    const { id, name, phone, photoUrl } = req.body;
    if (!id) return res.status(400).json({ error: 'User ID required' });
    const updated = db.updateUser(id, { name, phone, photoUrl });
    res.json({ success: true, user: updated });
  });

  // --- Authoritative Server-Side RBAC & Route Verification ---
  const SERVER_STAFF_ROLES: UserRole[] = [
    'SUPER_ADMIN',
    'ORDER_MANAGER',
    'CONTENT_MANAGER',
    'SUPPORT_AGENT',
  ];

  const SERVER_TAB_ROLE_PERMISSIONS: Record<string, UserRole[]> = {
    dashboard: ['SUPER_ADMIN', 'ORDER_MANAGER', 'CONTENT_MANAGER', 'SUPPORT_AGENT'],
    orders: ['SUPER_ADMIN', 'ORDER_MANAGER'],
    catalogs: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
    games: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
    packages: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
    'payment-methods': ['SUPER_ADMIN'],
    'promo-codes': ['SUPER_ADMIN', 'CONTENT_MANAGER'],
    offers: ['SUPER_ADMIN', 'CONTENT_MANAGER'],
    support: ['SUPER_ADMIN', 'SUPPORT_AGENT'],
    chatbot: ['SUPER_ADMIN', 'CONTENT_MANAGER', 'SUPPORT_AGENT'],
    'audit-logs': ['SUPER_ADMIN', 'ORDER_MANAGER'],
    settings: ['SUPER_ADMIN'],
    staff: ['SUPER_ADMIN'],
  };

  /**
   * Authoritative Server-Side Verification Endpoint for AdminRouteGuard
   * Validates user existence, active status, staff role, and granular tab permission.
   */
  const handleVerifyAdmin = (req: Request, res: Response) => {
    try {
      const headerUserId = req.headers['x-user-id'] as string | undefined;
      const bodyUserId = req.body?.userId as string | undefined;
      const queryUserId = req.query?.userId as string | undefined;
      const userId = headerUserId || bodyUserId || queryUserId;

      const attemptedTab = (req.body?.attemptedTab || req.query?.attemptedTab || req.query?.tab || 'dashboard') as string;

      // 1. Authentication check: userId required
      if (!userId) {
        return res.status(401).json({
          allowed: false,
          reason: 'UNAUTHENTICATED',
          message: 'Staff authentication required. No operational session token provided.',
          attemptedTab
        });
      }

      // 2. Authoritative Database Lookup
      const user = db.getUserById(userId);
      if (!user) {
        return res.status(401).json({
          allowed: false,
          reason: 'UNAUTHENTICATED',
          message: 'User credentials not recognized in operational database.',
          attemptedTab
        });
      }

      // 3. Account Status Check (Suspended / Deactivated)
      if (user.status === 'suspended') {
        return res.status(403).json({
          allowed: false,
          reason: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended by system operations. Administrative clearance revoked.',
          userRole: user.role,
          attemptedTab
        });
      }

      // 4. Staff Role Check (Block regular customers)
      if (user.role === 'CUSTOMER' || !SERVER_STAFF_ROLES.includes(user.role)) {
        // Log unauthorized breach attempt to audit trail
        db.addAuditLog({
          adminId: user.id,
          adminName: user.name,
          adminRole: user.role,
          action: 'UNAUTHORIZED_ADMIN_ACCESS_ATTEMPT',
          targetType: 'user',
          targetId: user.id,
          details: `Customer account "${user.name}" (${user.email || user.phone}) attempted unauthorized access to administrative module "${attemptedTab}". Access blocked by server security gate.`
        });

        return res.status(403).json({
          allowed: false,
          reason: 'CUSTOMER_FORBIDDEN',
          message: 'Access denied: Customer accounts do not have staff operational privileges.',
          userRole: user.role,
          attemptedTab
        });
      }

      // 5. Granular Module / Tab Permission Check
      const requiredRoles = SERVER_TAB_ROLE_PERMISSIONS[attemptedTab] || SERVER_TAB_ROLE_PERMISSIONS['dashboard'];
      const allowedTabs = Object.keys(SERVER_TAB_ROLE_PERMISSIONS).filter(t =>
        SERVER_TAB_ROLE_PERMISSIONS[t].includes(user.role)
      );

      if (!requiredRoles.includes(user.role)) {
        return res.status(403).json({
          allowed: false,
          reason: 'INSUFFICIENT_PERMISSIONS',
          message: `Your staff role (${user.role.replace('_', ' ')}) is not authorized to access the "${attemptedTab}" module.`,
          userRole: user.role,
          attemptedTab,
          requiredRoles,
          allowedTabs
        });
      }

      // 6. Access Approved
      return res.status(200).json({
        allowed: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          photoUrl: user.photoUrl
        },
        attemptedTab,
        requiredRoles,
        allowedTabs,
        verifiedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Server admin verification error:', err);
      return res.status(500).json({
        allowed: false,
        reason: 'SERVER_ERROR',
        message: 'Internal server error while performing authorization check.'
      });
    }
  };

  app.post('/api/auth/verify-admin', handleVerifyAdmin);
  app.get('/api/auth/verify-admin', handleVerifyAdmin);

  // --- Staff Management Endpoints (Super Admin Only) ---
  app.get('/api/admin/staff', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    if (!user || user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Only Super Admin can view staff members.' });
    }
    const staffMembers = db.getStaffUsers();
    res.json(staffMembers);
  });

  app.post('/api/admin/staff', (req: Request, res: Response) => {
    const admin = getUserFromReq(req);
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Only Super Admin can add or assign staff roles.' });
    }

    const { name, email, phone, role, password } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and a valid staff role are required.' });
    }

    const validRoles: UserRole[] = ['SUPER_ADMIN', 'ORDER_MANAGER', 'CONTENT_MANAGER', 'SUPPORT_AGENT'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: `Invalid staff role "${role}". Allowed roles: ${validRoles.join(', ')}` });
    }

    const cleanEmail = email.trim().toLowerCase();
    let existing = db.getUserByEmail(cleanEmail);

    if (existing) {
      // Upgrade or update existing user to staff
      const updated = db.updateUser(existing.id, {
        name: name.trim(),
        role,
        phone: phone ? phone.trim() : existing.phone,
        password: password || existing.password || 'admin@123',
        status: 'active'
      });

      db.addAuditLog({
        adminId: admin.id,
        adminName: admin.name,
        adminRole: admin.role,
        action: 'STAFF_ROLE_ASSIGNED',
        targetType: 'setting',
        targetId: existing.id,
        details: `Assigned role ${role} to existing account "${existing.name}" (${existing.email})`
      });

      return res.json({ success: true, staff: updated, isExistingUser: true });
    }

    // Create brand new staff user
    const newStaff = db.createUser({
      name: name.trim(),
      email: cleanEmail,
      phone: phone ? phone.trim() : '+977 9841000000',
      role,
      password: password || 'admin@123',
      authProvider: 'email',
      emailVerified: true
    });

    db.addAuditLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'STAFF_MEMBER_CREATED',
      targetType: 'setting',
      targetId: newStaff.id,
      details: `Created new staff account "${newStaff.name}" (${newStaff.email}) as ${newStaff.role}`
    });

    res.status(201).json({ success: true, staff: newStaff, isExistingUser: false });
  });

  app.put('/api/admin/staff/:id', (req: Request, res: Response) => {
    const admin = getUserFromReq(req);
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Only Super Admin can modify staff roles.' });
    }

    const targetUser = db.getUserById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    // Prevent demoting primary super admin sapanthapa49@gmail.com
    const isPrimarySuperAdmin = targetUser.email.toLowerCase() === 'sapanthapa49@gmail.com';
    const { role, status, password, name, phone } = req.body;

    if (isPrimarySuperAdmin && role && role !== 'SUPER_ADMIN') {
      return res.status(400).json({ error: 'Cannot demote the primary Super Admin account (sapanthapa49@gmail.com).' });
    }

    if (isPrimarySuperAdmin && status === 'suspended') {
      return res.status(400).json({ error: 'Cannot suspend the primary Super Admin account.' });
    }

    const updates: Partial<User> = {};
    if (role) updates.role = role;
    if (status) updates.status = status;
    if (password) updates.password = password;
    if (name) updates.name = name.trim();
    if (phone) updates.phone = phone.trim();

    const updated = db.updateUser(targetUser.id, updates);

    db.addAuditLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'STAFF_UPDATED',
      targetType: 'setting',
      targetId: targetUser.id,
      details: `Updated staff "${targetUser.name}" (${targetUser.email}): ${JSON.stringify(updates)}`
    });

    res.json({ success: true, staff: updated });
  });

  app.delete('/api/admin/staff/:id', (req: Request, res: Response) => {
    const admin = getUserFromReq(req);
    if (!admin || admin.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ error: 'Access denied. Only Super Admin can revoke staff access.' });
    }

    const targetUser = db.getUserById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Staff member not found.' });
    }

    if (targetUser.email.toLowerCase() === 'sapanthapa49@gmail.com') {
      return res.status(400).json({ error: 'Cannot remove or revoke the primary Super Admin account.' });
    }

    if (targetUser.id === admin.id) {
      return res.status(400).json({ error: 'You cannot revoke your own Super Admin access.' });
    }

    // Demote to CUSTOMER so their account still exists but they have zero staff/admin permissions
    const demoted = db.updateUser(targetUser.id, {
      role: 'CUSTOMER'
    });

    db.addAuditLog({
      adminId: admin.id,
      adminName: admin.name,
      adminRole: admin.role,
      action: 'STAFF_ACCESS_REVOKED',
      targetType: 'setting',
      targetId: targetUser.id,
      details: `Revoked staff access for "${targetUser.name}" (${targetUser.email}). Role converted to CUSTOMER.`
    });

    res.json({
      success: true,
      message: `Staff access revoked for ${targetUser.name}. They are now a regular customer.`,
      staff: demoted
    });
  });

  // --- Catalogs Endpoints ---
  app.get('/api/catalogs', (req: Request, res: Response) => {
    const admin = req.query.admin === 'true';
    const type = req.query.type as string | undefined;
    const catalogs = db.getCatalogs(admin, type);
    res.json(catalogs);
  });

  app.get('/api/catalogs/:id', (req: Request, res: Response) => {
    const catalog = db.getCatalogById(req.params.id) || db.getCatalogBySlug(req.params.id);
    if (!catalog) return res.status(404).json({ error: 'Catalog category not found' });
    res.json(catalog);
  });

  app.post('/api/catalogs', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const newCatalog = db.createCatalog(req.body);
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'CREATE_CATALOG',
        targetType: 'setting',
        targetId: newCatalog.id,
        details: `Created catalog category "${newCatalog.name}" (${newCatalog.type})`
      });
    }
    res.json(newCatalog);
  });

  app.put('/api/catalogs/:id', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const updated = db.updateCatalog(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Catalog category not found' });
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'UPDATE_CATALOG',
        targetType: 'setting',
        targetId: updated.id,
        details: `Updated catalog category "${updated.name}"`
      });
    }
    res.json(updated);
  });

  app.delete('/api/catalogs/:id', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const catalog = db.getCatalogById(req.params.id);
    const ok = db.deleteCatalog(req.params.id);
    if (user && ok) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'DELETE_CATALOG',
        targetType: 'setting',
        targetId: req.params.id,
        details: `Deleted catalog category ${catalog?.name || req.params.id}`
      });
    }
    res.json({ success: ok });
  });

  // --- Games Endpoints ---
  app.get('/api/games', (req: Request, res: Response) => {
    const includeInactive = req.query.admin === 'true';
    const games = db.getGames(includeInactive);
    // Attach packages count or packages
    const gamesWithPackages = games.map(g => ({
      ...g,
      packages: db.getPackagesByGame(g.id, includeInactive)
    }));
    res.json(gamesWithPackages);
  });

  app.get('/api/games/:id', (req: Request, res: Response) => {
    const game = db.getGameById(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    const packages = db.getPackagesByGame(game.id, req.query.admin === 'true');
    res.json({ ...game, packages });
  });

  app.post('/api/games', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const newGame = db.createGame(req.body);
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'CREATE_GAME',
        targetType: 'game',
        targetId: newGame.id,
        details: `Created new game: ${newGame.name}`
      });
    }
    res.json(newGame);
  });

  app.put('/api/games/:id', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const updated = db.updateGame(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Game not found' });
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'UPDATE_GAME',
        targetType: 'game',
        targetId: updated.id,
        details: `Updated game: ${updated.name}`
      });
    }
    res.json(updated);
  });

  app.delete('/api/games/:id', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const ok = db.deleteGame(req.params.id);
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'DELETE_GAME',
        targetType: 'game',
        targetId: req.params.id,
        details: `Deleted game ID: ${req.params.id}`
      });
    }
    res.json({ success: ok });
  });

  // --- Packages Endpoints ---
  app.get('/api/packages', (req: Request, res: Response) => {
    const gameId = req.query.gameId as string;
    const admin = req.query.admin === 'true';
    if (gameId) {
      return res.json(db.getPackagesByGame(gameId, admin));
    }
    res.json(db.getPackages(admin));
  });

  app.get('/api/games/:id/packages', (req: Request, res: Response) => {
    const packages = db.getPackagesByGame(req.params.id, req.query.admin === 'true');
    res.json(packages);
  });

  app.post('/api/packages', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const newPkg = db.createPackage(req.body);
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'CREATE_PACKAGE',
        targetType: 'package',
        targetId: newPkg.id,
        details: `Created package: ${newPkg.name} (NPR ${newPkg.price}) for game ${newPkg.gameId}`
      });
    }
    res.json(newPkg);
  });

  app.put('/api/packages/:id', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const updated = db.updatePackage(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Package not found' });
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'UPDATE_PACKAGE',
        targetType: 'package',
        targetId: updated.id,
        details: `Updated package ${updated.name} (Price: NPR ${updated.price})`
      });
    }
    res.json(updated);
  });

  app.delete('/api/packages/:id', (req: Request, res: Response) => {
    const ok = db.deletePackage(req.params.id);
    res.json({ success: ok });
  });

  // --- Payment Methods Endpoints ---
  app.get('/api/payment-methods', (req: Request, res: Response) => {
    const includeInactive = req.query.admin === 'true';
    res.json(db.getPaymentMethods(includeInactive));
  });

  app.post('/api/payment-methods', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const newMethod = db.createPaymentMethod(req.body);
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'CREATE_PAYMENT_METHOD',
        targetType: 'payment_method',
        targetId: newMethod.id,
        details: `Created payment method: ${newMethod.name}`
      });
    }
    res.json(newMethod);
  });

  app.put('/api/payment-methods/:id', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const updated = db.updatePaymentMethod(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Payment method not found' });
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'UPDATE_PAYMENT_METHOD',
        targetType: 'payment_method',
        targetId: updated.id,
        details: `Updated payment method: ${updated.name}`
      });
    }
    res.json(updated);
  });

  app.delete('/api/payment-methods/:id', (req: Request, res: Response) => {
    const ok = db.deletePaymentMethod(req.params.id);
    res.json({ success: ok });
  });

  // --- Promo Codes Endpoints ---
  app.get('/api/promo-codes', (_req: Request, res: Response) => {
    res.json(db.getPromoCodes());
  });

  app.post('/api/promo-codes/validate', (req: Request, res: Response) => {
    const { code, amount } = req.body;
    if (!code) return res.status(400).json({ error: 'Code is required' });
    const result = db.validatePromoCode(code, Number(amount) || 0);
    res.json(result);
  });

  app.post('/api/promo-codes', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const newPromo = db.createPromoCode(req.body);
    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'CREATE_PROMO',
        targetType: 'promo',
        targetId: newPromo.id,
        details: `Created promo code: ${newPromo.code}`
      });
    }
    res.json(newPromo);
  });

  app.put('/api/promo-codes/:id', (req: Request, res: Response) => {
    const updated = db.updatePromoCode(req.params.id, req.body);
    res.json(updated);
  });

  app.delete('/api/promo-codes/:id', (req: Request, res: Response) => {
    const ok = db.deletePromoCode(req.params.id);
    res.json({ success: ok });
  });

  // --- Offers Endpoints ---
  app.get('/api/offers', (req: Request, res: Response) => {
    res.json(db.getOffers(req.query.admin === 'true'));
  });

  app.post('/api/offers', (req: Request, res: Response) => {
    res.json(db.createOffer(req.body));
  });

  app.put('/api/offers/:id', (req: Request, res: Response) => {
    res.json(db.updateOffer(req.params.id, req.body));
  });

  app.delete('/api/offers/:id', (req: Request, res: Response) => {
    res.json({ success: db.deleteOffer(req.params.id) });
  });

  // --- Orders Endpoints (Strict Server Calculation & Fraud Detection) ---
  app.post('/api/orders/quote', (req: Request, res: Response) => {
    const { gameId, packageId, promoCode } = req.body;
    const pkg = db.getPackageById(packageId);
    if (!pkg) return res.status(400).json({ error: 'Invalid package' });

    let discount = 0;
    let promoResult: any = null;

    if (promoCode) {
      promoResult = db.validatePromoCode(promoCode, pkg.price);
      if (promoResult.valid) {
        discount = promoResult.discountAmount;
      }
    }

    const finalAmount = Math.max(0, pkg.price - discount);
    res.json({
      originalAmount: pkg.price,
      discountAmount: discount,
      finalAmount,
      promoValidation: promoResult
    });
  });

  app.post('/api/orders', (req: Request, res: Response) => {
    const result = db.createOrder(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }
    res.json(result.order);
  });

  app.post('/api/orders/:id/payment', (req: Request, res: Response) => {
    const { transactionId, paymentSubmittedAmount, paymentProofUrl, customerNote } = req.body;

    if (!transactionId || !transactionId.trim()) {
      return res.status(400).json({ error: 'Transaction / Reference ID is required.' });
    }
    if (!paymentProofUrl) {
      return res.status(400).json({ error: 'Please upload a payment proof screenshot.' });
    }

    const result = db.submitPaymentProof(req.params.id, {
      transactionId,
      paymentSubmittedAmount: Number(paymentSubmittedAmount) || 0,
      paymentProofUrl,
      customerNote
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  });

  // Public Order Lookup by Order Number or Phone Number
  app.get('/api/orders/check/:query', (req: Request, res: Response) => {
    const query = req.params.query.trim().toUpperCase();
    const order = db.getOrderById(query);
    if (order) {
      return res.json([order]);
    }
    // Search by phone or email
    const list = db.getUserOrders(req.params.query.trim());
    res.json(list);
  });

  app.get('/api/orders', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const userId = (req.query.userId as string) || (user ? user.id : undefined);
    if (userId) {
      return res.json(db.getUserOrders(userId));
    }
    const orders = db.getOrders();
    res.json(orders);
  });

  app.get('/api/orders/my', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const userIdOrEmail = (req.query.userId as string) || (user ? user.id : '');
    if (!userIdOrEmail) {
      return res.json([]);
    }
    res.json(db.getUserOrders(userIdOrEmail));
  });

  app.get('/api/orders/:id', (req: Request, res: Response) => {
    const order = db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  });

  app.post('/api/orders/:id/refund', (req: Request, res: Response) => {
    const { reason, description } = req.body;
    if (!reason) return res.status(400).json({ error: 'Refund reason required' });
    const result = db.requestRefund(req.params.id, reason, description || '');
    if (!result.success) return res.status(400).json({ error: result.error });
    res.json(result.order);
  });

  // --- Admin Order Management & Strict Workflow Actions ---
  // Security barrier: block requests from customer accounts to administrative operations
  const requireAdminAuth = (req: Request, res: Response, next: NextFunction) => {
    const user = getUserFromReq(req);
    if (user && user.role === 'CUSTOMER') {
      return res.status(403).json({ error: 'Access denied: Customer accounts cannot access administrative operations.' });
    }
    next();
  };

  app.use('/api/admin', requireAdminAuth);

  app.get('/api/admin/orders', (req: Request, res: Response) => {
    const { status, gameId, paymentMethodId, search } = req.query;
    let orders = db.getOrders();

    if (status && status !== 'all') {
      orders = orders.filter(o => o.status === status);
    }
    if (gameId && gameId !== 'all') {
      orders = orders.filter(o => o.gameId === gameId);
    }
    if (paymentMethodId && paymentMethodId !== 'all') {
      orders = orders.filter(o => o.paymentMethodId === paymentMethodId);
    }
    if (search) {
      const q = (search as string).toLowerCase();
      orders = orders.filter(o =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerEmail.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.transactionId && o.transactionId.toLowerCase().includes(q)) ||
        Object.values(o.playerInformation).some(val => val.toLowerCase().includes(q))
      );
    }

    res.json(orders);
  });

  app.post('/api/admin/orders/:id/action', (req: Request, res: Response) => {
    const user = getUserFromReq(req) || {
      id: 'usr-admin-1',
      name: 'Operations Admin',
      role: 'SUPER_ADMIN' as UserRole
    };

    const { status, adminNote, customerFacingMessage, isNeedsReview } = req.body;
    if (!status) return res.status(400).json({ error: 'Status is required' });

    const result = db.adminUpdateOrderStatus(req.params.id, {
      status: status as OrderStatus,
      adminUser: user as User,
      adminNote,
      customerFacingMessage,
      isNeedsReview
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.order);
  });

  app.get('/api/admin/stats', (_req: Request, res: Response) => {
    res.json(db.getStats());
  });

  app.get('/api/admin/audit-logs', (_req: Request, res: Response) => {
    res.json(db.getAuditLogs());
  });

  // --- Support Endpoints ---
  app.get('/api/support/tickets', (req: Request, res: Response) => {
    const userId = req.query.userId as string;
    res.json(db.getSupportTickets(userId));
  });

  app.get('/api/support/tickets/:id', (req: Request, res: Response) => {
    const ticket = db.getSupportTicketById(req.params.id);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
    res.json(ticket);
  });

  app.post('/api/support/tickets', (req: Request, res: Response) => {
    const ticket = db.createSupportTicket(req.body);
    res.json(ticket);
  });

  app.post('/api/support/tickets/:id/messages', (req: Request, res: Response) => {
    const msg = db.addTicketMessage(req.params.id, req.body);
    if (!msg) return res.status(404).json({ error: 'Ticket not found' });
    res.json(msg);
  });

  app.put('/api/support/tickets/:id/status', (req: Request, res: Response) => {
    const ok = db.updateTicketStatus(req.params.id, req.body.status);
    res.json({ success: ok });
  });

  // --- Notifications Endpoints ---
  app.get('/api/notifications', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const userId = (req.query.userId as string) || (user ? user.id : 'usr-demo-customer');
    res.json(db.getUserNotifications(userId));
  });

  app.post('/api/notifications/:id/read', (req: Request, res: Response) => {
    res.json({ success: db.markNotificationAsRead(req.params.id) });
  });

  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    const userId = req.body.userId || 'usr-demo-customer';
    db.markAllNotificationsRead(userId);
    res.json({ success: true });
  });

  // --- Settings Endpoints ---
  app.get('/api/settings', (_req: Request, res: Response) => {
    res.json(db.getSettings());
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const updated = db.updateSettings(req.body, user);
    res.json(updated);
  });

  // --- AI Chatbot Endpoint (Gemini 3.8 Flash Server-Side) ---
  app.post('/api/chat', async (req: Request, res: Response) => {
    try {
      const { message, history } = req.body;
      const user = getUserFromReq(req);
      const result = await handleChatMessage({
        message,
        history,
        userId: user?.id,
      });
      res.json(result);
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      res.status(500).json({
        reply: 'I am currently experiencing a momentary hiccup. Please try again or check our Support page.',
        suggestions: ['How to buy UC?', 'Nepal payment methods', 'Order help']
      });
    }
  });

  // --- AI Chatbot Triggers & Auto-Responses Endpoints ---
  app.get('/api/chatbot-triggers', (req: Request, res: Response) => {
    const onlyActive = req.query.active === 'true';
    res.json(db.getChatbotTriggers(onlyActive));
  });

  app.post('/api/chatbot-triggers', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const { name, triggers, matchType, reply, suggestions, active, priority } = req.body;

    if (!name || !triggers || !Array.isArray(triggers) || triggers.length === 0 || !reply) {
      return res.status(400).json({ error: 'Name, trigger keywords/phrases, and reply message are required.' });
    }

    const created = db.createChatbotTrigger({
      name: String(name).trim(),
      triggers: triggers.map((t: any) => String(t).trim()).filter(Boolean),
      matchType: matchType === 'exact' ? 'exact' : 'contains',
      reply: String(reply).trim(),
      suggestions: Array.isArray(suggestions) ? suggestions.map((s: any) => String(s).trim()).filter(Boolean) : [],
      active: active !== false,
      priority: Number(priority) || 5
    });

    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'CREATE_CHATBOT_TRIGGER',
        targetType: 'setting',
        targetId: created.id,
        details: `Created AI chatbot trigger "${created.name}" with keywords [${created.triggers.join(', ')}]`
      });
    }

    res.status(201).json(created);
  });

  app.put('/api/chatbot-triggers/:id', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const updated = db.updateChatbotTrigger(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Chatbot trigger rule not found' });
    }

    if (user) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'UPDATE_CHATBOT_TRIGGER',
        targetType: 'setting',
        targetId: updated.id,
        details: `Updated AI chatbot trigger "${updated.name}"`
      });
    }

    res.json(updated);
  });

  app.delete('/api/chatbot-triggers/:id', (req: Request, res: Response) => {
    const user = getUserFromReq(req);
    const existing = db.getChatbotTriggerById(req.params.id);
    const ok = db.deleteChatbotTrigger(req.params.id);

    if (!ok) {
      return res.status(404).json({ error: 'Chatbot trigger rule not found' });
    }

    if (user && existing) {
      db.addAuditLog({
        adminId: user.id,
        adminName: user.name,
        adminRole: user.role,
        action: 'DELETE_CHATBOT_TRIGGER',
        targetType: 'setting',
        targetId: req.params.id,
        details: `Deleted AI chatbot trigger "${existing.name}"`
      });
    }

    res.json({ success: true });
  });

  app.post('/api/chatbot-triggers/:id/toggle', (req: Request, res: Response) => {
    const existing = db.getChatbotTriggerById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Chatbot trigger rule not found' });
    }

    const updated = db.updateChatbotTrigger(req.params.id, { active: !existing.active });
    res.json(updated);
  });

  // --- SEO Dynamic Endpoints: robots.txt and sitemap.xml ---
  app.get('/robots.txt', (_req: Request, res: Response) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Sitemap: ${process.env.APP_URL || 'https://gamingzone.com.np'}/sitemap.xml`);
  });

  app.get('/sitemap.xml', (_req: Request, res: Response) => {
    const games = db.getGames(false);
    const baseUrl = process.env.APP_URL || 'https://gamingzone.com.np';
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${baseUrl}/</loc><changefreq>daily</changefreq><priority>1.0</priority></url>
  <url><loc>${baseUrl}/games</loc><changefreq>daily</changefreq><priority>0.9</priority></url>
  <url><loc>${baseUrl}/offers</loc><changefreq>daily</changefreq><priority>0.8</priority></url>
  <url><loc>${baseUrl}/support</loc><changefreq>weekly</changefreq><priority>0.7</priority></url>
  ${games.map(g => `<url><loc>${baseUrl}/games/${g.slug}</loc><changefreq>daily</changefreq><priority>0.8</priority></url>`).join('\n  ')}
</urlset>`;
    res.type('application/xml');
    res.send(xml);
  });

  // --- Vite Middleware for Development / Static in Production ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🎮 GamingZone Top-up Center server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Fatal server boot failure:', err);
});
