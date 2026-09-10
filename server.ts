import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db';
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
    const authHeader = req.headers['x-user-id'] as string;
    if (authHeader) {
      return db.getUserById(authHeader);
    }
    // Default fallback to demo customer if not specified, or allow unauthenticated
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

  // --- Auth Endpoints ---
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { emailOrPhone, password, role } = req.body;

    if (!emailOrPhone) {
      return res.status(400).json({ error: 'Email or phone number is required.' });
    }

    // Check existing
    let user = db.getUserByEmail(emailOrPhone) || db.getUserByPhone(emailOrPhone);

    // If user does not exist and it's a test customer, auto-provision
    if (!user) {
      const isEmail = emailOrPhone.includes('@');
      user = db.createUser({
        name: isEmail ? emailOrPhone.split('@')[0].toUpperCase() : 'Gamer ' + emailOrPhone.slice(-4),
        email: isEmail ? emailOrPhone : `${emailOrPhone}@user.gamingzone.np`,
        phone: !isEmail ? emailOrPhone : undefined,
        authProvider: isEmail ? 'email' : 'phone',
        role: role || 'CUSTOMER'
      });
    }

    res.json({ success: true, user });
  });

  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, email, phone, password } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required.' });
    }

    const existing = db.getUserByEmail(email);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists.' });
    }

    const user = db.createUser({
      name,
      email,
      phone,
      authProvider: 'email',
      role: 'CUSTOMER'
    });

    res.json({ success: true, user });
  });

  app.post('/api/auth/google', (req: Request, res: Response) => {
    const { email, name, photoUrl } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Google account email required.' });
    }

    let user = db.getUserByEmail(email);
    if (!user) {
      user = db.createUser({
        name: name || 'Google Gamer',
        email,
        photoUrl,
        authProvider: 'google',
        role: 'CUSTOMER'
      });
    }

    res.json({ success: true, user });
  });

  // Phone OTP Simulation for Nepal Numbers (98XXXXXXXX / 97XXXXXXXX)
  app.post('/api/auth/otp/send', (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone || phone.length < 10) {
      return res.status(400).json({ error: 'Please enter a valid 10-digit Nepal mobile number.' });
    }
    // Return sample OTP for testing/verification
    const sampleOtp = '123456';
    res.json({
      success: true,
      message: `Verification code sent to ${phone}. (For demo testing, code is 123456)`,
      demoOtp: sampleOtp
    });
  });

  app.post('/api/auth/otp/verify', (req: Request, res: Response) => {
    const { phone, otp, name } = req.body;
    if (!otp || otp !== '123456') {
      return res.status(400).json({ error: 'Invalid verification code. Please enter 123456.' });
    }

    let user = db.getUserByPhone(phone);
    if (!user) {
      user = db.createUser({
        name: name || `Gamer ${phone.slice(-4)}`,
        email: `${phone.replace(/\D/g, '')}@phone.gamingzone.np`,
        phone,
        authProvider: 'phone',
        role: 'CUSTOMER'
      });
    }

    res.json({ success: true, user });
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
    'audit-logs': ['SUPER_ADMIN', 'ORDER_MANAGER'],
    settings: ['SUPER_ADMIN'],
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
