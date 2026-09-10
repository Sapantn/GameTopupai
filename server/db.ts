import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  Catalog,
  Game,
  Package,
  PaymentMethod,
  PromoCode,
  OfferBanner,
  WebsiteSettings,
  User,
  Order,
  OrderStatus,
  SupportTicket,
  AuditLog,
  NotificationItem,
  SupportMessage
} from '../src/types';
import {
  defaultCatalogs,
  defaultGames,
  defaultPackages,
  defaultPaymentMethods,
  defaultPromoCodes,
  defaultOffers,
  defaultSettings,
  defaultUsers,
  defaultOrders,
  defaultSupportTickets,
  defaultAuditLogs
} from './seedData';

export interface DatabaseSchema {
  catalogs: Catalog[];
  games: Game[];
  packages: Package[];
  paymentMethods: PaymentMethod[];
  promoCodes: PromoCode[];
  offers: OfferBanner[];
  settings: WebsiteSettings;
  users: User[];
  orders: Order[];
  supportTickets: SupportTicket[];
  auditLogs: AuditLog[];
  notifications: NotificationItem[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'database.json');

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
  }

  private load(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          catalogs: (parsed.catalogs && parsed.catalogs.length > 0) ? parsed.catalogs : defaultCatalogs,
          games: parsed.games || defaultGames,
          packages: parsed.packages || defaultPackages,
          paymentMethods: parsed.paymentMethods || defaultPaymentMethods,
          promoCodes: parsed.promoCodes || defaultPromoCodes,
          offers: parsed.offers || defaultOffers,
          settings: parsed.settings || defaultSettings,
          users: parsed.users || defaultUsers,
          orders: parsed.orders || defaultOrders,
          supportTickets: parsed.supportTickets || defaultSupportTickets,
          auditLogs: parsed.auditLogs || defaultAuditLogs,
          notifications: parsed.notifications || []
        };
      }
    } catch (err) {
      console.error('Error reading database file, using seeds', err);
    }

    const initial: DatabaseSchema = {
      catalogs: defaultCatalogs,
      games: defaultGames,
      packages: defaultPackages,
      paymentMethods: defaultPaymentMethods,
      promoCodes: defaultPromoCodes,
      offers: defaultOffers,
      settings: defaultSettings,
      users: defaultUsers,
      orders: defaultOrders,
      supportTickets: defaultSupportTickets,
      auditLogs: defaultAuditLogs,
      notifications: [
        {
          id: 'notif-1',
          userId: 'usr-demo-customer',
          title: 'Welcome to GamingZone Nepal!',
          message: 'Top up PUBG Mobile, Free Fire, MLBB with instant manual verification using eSewa and Khalti.',
          read: false,
          createdAt: new Date().toISOString(),
          type: 'system'
        },
        {
          id: 'notif-2',
          userId: 'usr-demo-customer',
          title: 'Order GZ-20260910-000101 Completed',
          message: 'Your 660 UC top-up has been dispatched to Character ID 5129384912.',
          orderId: 'ord-001',
          read: true,
          createdAt: new Date().toISOString(),
          type: 'order'
        }
      ]
    };

    this.saveDirect(initial);
    return initial;
  }

  private saveDirect(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file', e);
    }
  }

  private persist() {
    this.saveDirect(this.data);
  }

  // --- Catalogs ---
  getCatalogs(includeInactive = false, type?: string): Catalog[] {
    if (!this.data.catalogs || this.data.catalogs.length === 0) {
      this.data.catalogs = defaultCatalogs;
      this.persist();
    }
    let list = includeInactive ? this.data.catalogs : this.data.catalogs.filter(c => c.active);
    if (type) {
      list = list.filter(c => c.type === type);
    }
    return list
      .map(c => {
        const count = (this.data.games || []).filter(g =>
          g.active && (
            g.catalogSlug === c.slug ||
            g.catalogId === c.id ||
            (g.category && typeof g.category === 'string' && g.category.toLowerCase() === c.name.toLowerCase())
          )
        ).length;
        return { ...c, itemCount: count };
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getCatalogById(id: string): Catalog | undefined {
    return (this.data.catalogs || []).find(c => c.id === id);
  }

  getCatalogBySlug(slug: string): Catalog | undefined {
    return (this.data.catalogs || []).find(c => c.slug === slug);
  }

  createCatalog(catalog: Partial<Catalog>): Catalog {
    if (!this.data.catalogs) this.data.catalogs = [];
    const name = (catalog.name || 'New Catalog').trim();
    const slug = catalog.slug
      ? catalog.slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
      : name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const newCatalog: Catalog = {
      id: catalog.id || `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      slug,
      type: catalog.type || 'game',
      description: catalog.description || '',
      icon: catalog.icon || (catalog.type === 'card' ? 'CreditCard' : 'Gamepad2'),
      badge: catalog.badge || '',
      sortOrder: Number(catalog.sortOrder) || (this.data.catalogs.length + 1),
      active: catalog.active ?? true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.data.catalogs.push(newCatalog);
    this.persist();
    return newCatalog;
  }

  updateCatalog(id: string, updates: Partial<Catalog>): Catalog | null {
    if (!this.data.catalogs) this.data.catalogs = [];
    const idx = this.data.catalogs.findIndex(c => c.id === id);
    if (idx === -1) return null;

    if (updates.name && !updates.slug) {
      updates.slug = updates.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
    }

    this.data.catalogs[idx] = {
      ...this.data.catalogs[idx],
      ...updates,
      id, // Preserve ID
      updatedAt: new Date().toISOString()
    };

    this.persist();
    return this.data.catalogs[idx];
  }

  deleteCatalog(id: string): boolean {
    if (!this.data.catalogs) return false;
    const initialLen = this.data.catalogs.length;
    this.data.catalogs = this.data.catalogs.filter(c => c.id !== id);
    if (this.data.catalogs.length < initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  // --- Games ---
  getGames(includeInactive = false): Game[] {
    const list = includeInactive ? this.data.games : this.data.games.filter(g => g.active);
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getGameById(idOrSlug: string): Game | undefined {
    return this.data.games.find(g => g.id === idOrSlug || g.slug === idOrSlug);
  }

  createGame(game: Omit<Game, 'id'>): Game {
    const newGame: Game = {
      ...game,
      id: `game-${Date.now()}`
    };
    this.data.games.push(newGame);
    this.persist();
    return newGame;
  }

  updateGame(id: string, updates: Partial<Game>): Game | null {
    const idx = this.data.games.findIndex(g => g.id === id);
    if (idx === -1) return null;
    this.data.games[idx] = { ...this.data.games[idx], ...updates };
    this.persist();
    return this.data.games[idx];
  }

  deleteGame(id: string): boolean {
    const initialLen = this.data.games.length;
    this.data.games = this.data.games.filter(g => g.id !== id);
    // Also remove its packages
    this.data.packages = this.data.packages.filter(p => p.gameId !== id);
    this.persist();
    return this.data.games.length < initialLen;
  }

  // --- Packages ---
  getAllPackages(includeInactive = false): Package[] {
    const list = includeInactive ? this.data.packages : this.data.packages.filter(p => p.active);
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getPackages(includeInactive = false): Package[] {
    return this.getAllPackages(includeInactive);
  }

  getPackagesByGame(gameId: string, includeInactive = false): Package[] {
    const list = this.data.packages.filter(p => p.gameId === gameId && (includeInactive || p.active));
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getPackageById(id: string): Package | undefined {
    return this.data.packages.find(p => p.id === id);
  }

  createPackage(pkg: Omit<Package, 'id'>): Package {
    const newPkg: Package = {
      ...pkg,
      id: `pkg-${Date.now()}`
    };
    this.data.packages.push(newPkg);
    this.persist();
    return newPkg;
  }

  updatePackage(id: string, updates: Partial<Package>): Package | null {
    const idx = this.data.packages.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.packages[idx] = { ...this.data.packages[idx], ...updates };
    this.persist();
    return this.data.packages[idx];
  }

  deletePackage(id: string): boolean {
    const initialLen = this.data.packages.length;
    this.data.packages = this.data.packages.filter(p => p.id !== id);
    this.persist();
    return this.data.packages.length < initialLen;
  }

  // --- Payment Methods ---
  getPaymentMethods(includeInactive = false): PaymentMethod[] {
    const list = includeInactive ? this.data.paymentMethods : this.data.paymentMethods.filter(p => p.active);
    return list.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  getPaymentMethodById(id: string): PaymentMethod | undefined {
    return this.data.paymentMethods.find(p => p.id === id || p.code === id);
  }

  createPaymentMethod(method: Omit<PaymentMethod, 'id'>): PaymentMethod {
    const newMethod: PaymentMethod = {
      ...method,
      id: `pay-${Date.now()}`
    };
    this.data.paymentMethods.push(newMethod);
    this.persist();
    return newMethod;
  }

  updatePaymentMethod(id: string, updates: Partial<PaymentMethod>): PaymentMethod | null {
    const idx = this.data.paymentMethods.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.paymentMethods[idx] = { ...this.data.paymentMethods[idx], ...updates };
    this.persist();
    return this.data.paymentMethods[idx];
  }

  deletePaymentMethod(id: string): boolean {
    const initialLen = this.data.paymentMethods.length;
    this.data.paymentMethods = this.data.paymentMethods.filter(p => p.id !== id);
    this.persist();
    return this.data.paymentMethods.length < initialLen;
  }

  // --- Promo Codes ---
  getPromoCodes(): PromoCode[] {
    return this.data.promoCodes;
  }

  validatePromoCode(codeStr: string, orderAmount: number): { valid: boolean; discountAmount: number; message: string; promo?: PromoCode } {
    const clean = codeStr.trim().toUpperCase();
    const promo = this.data.promoCodes.find(p => p.code.toUpperCase() === clean);
    if (!promo || !promo.active) {
      return { valid: false, discountAmount: 0, message: 'Invalid or inactive promo code.' };
    }

    if (new Date(promo.expiresAt) < new Date()) {
      return { valid: false, discountAmount: 0, message: 'This promo code has expired.' };
    }

    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return { valid: false, discountAmount: 0, message: 'Promo code usage limit has been reached.' };
    }

    if (orderAmount < promo.minimumOrder) {
      return { valid: false, discountAmount: 0, message: `Minimum order amount of NPR ${promo.minimumOrder} required to apply this promo code.` };
    }

    let discount = 0;
    if (promo.type === 'percentage') {
      discount = Math.round((orderAmount * promo.value) / 100);
      if (promo.maximumDiscount && discount > promo.maximumDiscount) {
        discount = promo.maximumDiscount;
      }
    } else {
      discount = promo.value;
    }

    discount = Math.min(discount, orderAmount);
    return { valid: true, discountAmount: discount, message: `Promo code applied! Saved NPR ${discount}`, promo };
  }

  createPromoCode(promo: Omit<PromoCode, 'id' | 'usedCount'>): PromoCode {
    const newPromo: PromoCode = {
      ...promo,
      id: `promo-${Date.now()}`,
      usedCount: 0
    };
    this.data.promoCodes.push(newPromo);
    this.persist();
    return newPromo;
  }

  updatePromoCode(id: string, updates: Partial<PromoCode>): PromoCode | null {
    const idx = this.data.promoCodes.findIndex(p => p.id === id);
    if (idx === -1) return null;
    this.data.promoCodes[idx] = { ...this.data.promoCodes[idx], ...updates };
    this.persist();
    return this.data.promoCodes[idx];
  }

  deletePromoCode(id: string): boolean {
    const initialLen = this.data.promoCodes.length;
    this.data.promoCodes = this.data.promoCodes.filter(p => p.id !== id);
    this.persist();
    return this.data.promoCodes.length < initialLen;
  }

  // --- Offers & Banners ---
  getOffers(includeInactive = false): OfferBanner[] {
    const list = includeInactive ? this.data.offers : this.data.offers.filter(o => o.active);
    return list;
  }

  createOffer(offer: Omit<OfferBanner, 'id'>): OfferBanner {
    const newOffer: OfferBanner = {
      ...offer,
      id: `off-${Date.now()}`
    };
    this.data.offers.push(newOffer);
    this.persist();
    return newOffer;
  }

  updateOffer(id: string, updates: Partial<OfferBanner>): OfferBanner | null {
    const idx = this.data.offers.findIndex(o => o.id === id);
    if (idx === -1) return null;
    this.data.offers[idx] = { ...this.data.offers[idx], ...updates };
    this.persist();
    return this.data.offers[idx];
  }

  deleteOffer(id: string): boolean {
    const initial = this.data.offers.length;
    this.data.offers = this.data.offers.filter(o => o.id !== id);
    this.persist();
    return this.data.offers.length < initial;
  }

  // --- Orders & Manual Workflow ---
  generateOrderNumber(): string {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `GZ-${dateStr}-${rand}`;
  }

  getOrders(): Order[] {
    return [...this.data.orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrderById(idOrNumber: string): Order | undefined {
    return this.data.orders.find(o => o.id === idOrNumber || o.orderNumber.toUpperCase() === idOrNumber.toUpperCase());
  }

  getUserOrders(userIdOrEmail: string): Order[] {
    return this.data.orders.filter(o => o.userId === userIdOrEmail || o.customerEmail === userIdOrEmail || o.customerPhone === userIdOrEmail)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Strict anti-fraud duplicate transaction check
  isDuplicateTransaction(txnId: string, excludeOrderId?: string): boolean {
    const clean = txnId.trim().toUpperCase();
    return this.data.orders.some(o =>
      o.transactionId &&
      o.transactionId.trim().toUpperCase() === clean &&
      o.id !== excludeOrderId &&
      !['Rejected', 'Cancelled'].includes(o.status)
    );
  }

  // Create Order with server-side price validation
  createOrder(payload: {
    gameId: string;
    packageId: string;
    playerInformation: Record<string, string>;
    paymentMethodId: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    promoCode?: string;
    userId?: string;
  }): { success: boolean; order?: Order; error?: string } {
    const game = this.getGameById(payload.gameId);
    if (!game || !game.active) {
      return { success: false, error: 'Selected game is currently unavailable.' };
    }

    const pkg = this.getPackageById(payload.packageId);
    if (!pkg || !pkg.active || pkg.gameId !== game.id) {
      return { success: false, error: 'Selected package is invalid or inactive.' };
    }

    const payMethod = this.getPaymentMethodById(payload.paymentMethodId);
    if (!payMethod || !payMethod.active) {
      return { success: false, error: 'Selected payment method is invalid or inactive.' };
    }

    // Validate required fields
    for (const field of game.fields) {
      if (field.required && (!payload.playerInformation[field.fieldName] || payload.playerInformation[field.fieldName].trim() === '')) {
        return { success: false, error: `Required field missing: ${field.label}` };
      }
    }

    const originalAmount = pkg.price;
    let discountAmount = 0;
    let validatedPromo = payload.promoCode;

    if (payload.promoCode) {
      const pCheck = this.validatePromoCode(payload.promoCode, originalAmount);
      if (pCheck.valid && pCheck.promo) {
        discountAmount = pCheck.discountAmount;
        // Increment promo usage
        pCheck.promo.usedCount += 1;
      } else {
        validatedPromo = undefined;
      }
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount);
    const orderNumber = this.generateOrderNumber();
    const nowIso = new Date().toISOString();

    const order: Order = {
      id: `ord-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      orderNumber,
      userId: payload.userId,
      customerName: payload.customerName.trim(),
      customerEmail: payload.customerEmail.trim().toLowerCase(),
      customerPhone: payload.customerPhone.trim(),
      gameId: game.id,
      gameName: game.name,
      gameLogo: game.logoUrl,
      packageId: pkg.id,
      packageName: pkg.name,
      playerInformation: payload.playerInformation,
      originalAmount,
      discountAmount,
      promoCode: validatedPromo,
      finalAmount,
      paymentMethodId: payMethod.id,
      paymentMethodName: payMethod.name,
      status: 'Pending Payment',
      timeline: [
        {
          status: 'Pending Payment',
          timestamp: nowIso,
          note: `Order created for ${game.name} - ${pkg.name}. Awaiting manual payment transfer of NPR ${finalAmount}.`
        }
      ],
      createdAt: nowIso,
      updatedAt: nowIso
    };

    this.data.orders.push(order);

    // Add user notification
    if (payload.userId) {
      this.addNotification({
        userId: payload.userId,
        title: `Order Created (${order.orderNumber})`,
        message: `Your order for ${game.name} has been initiated. Please upload your payment proof to begin manual processing.`,
        orderId: order.id,
        type: 'order'
      });
    }

    this.persist();
    return { success: true, order };
  }

  // Submit payment proof
  submitPaymentProof(orderId: string, payload: {
    transactionId: string;
    paymentSubmittedAmount: number;
    paymentProofUrl: string;
    customerNote?: string;
  }): { success: boolean; order?: Order; error?: string; duplicateWarning?: boolean } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    const isDup = this.isDuplicateTransaction(payload.transactionId, order.id);
    if (isDup) {
      order.isFlaggedDuplicate = true;
      order.isNeedsReview = true;
      // We flag it for admin review and return error or warning
      return {
        success: false,
        error: 'This transaction reference has already been submitted for another order. If you believe this is an error, please contact support.'
      };
    }

    const nowIso = new Date().toISOString();
    order.transactionId = payload.transactionId.trim();
    order.paymentSubmittedAmount = payload.paymentSubmittedAmount;
    order.paymentProofUrl = payload.paymentProofUrl;
    if (payload.customerNote) {
      order.customerNote = payload.customerNote;
    }

    order.status = 'Payment Under Review';
    order.updatedAt = nowIso;
    order.timeline.push({
      status: 'Payment Submitted',
      timestamp: nowIso,
      note: `Payment proof submitted. Txn ID: ${order.transactionId}. Amount reported: NPR ${payload.paymentSubmittedAmount}`
    });
    order.timeline.push({
      status: 'Payment Under Review',
      timestamp: nowIso,
      note: 'Our admin team in Kathmandu is manually verifying this transaction in bank/wallet records.'
    });

    if (order.userId) {
      this.addNotification({
        userId: order.userId,
        title: `Payment Submitted: ${order.orderNumber}`,
        message: `We received your payment proof for ${order.gameName}. Admin manual verification in progress!`,
        orderId: order.id,
        type: 'order'
      });
    }

    this.persist();
    return { success: true, order };
  }

  // Admin order actions with complete audit logging
  adminUpdateOrderStatus(orderId: string, action: {
    status: OrderStatus;
    adminUser: User;
    adminNote?: string;
    customerFacingMessage?: string;
    isNeedsReview?: boolean;
  }): { success: boolean; order?: Order; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found.' };
    }

    const nowIso = new Date().toISOString();
    order.status = action.status;
    order.updatedAt = nowIso;

    if (action.adminNote !== undefined) order.adminNote = action.adminNote;
    if (action.customerFacingMessage !== undefined) order.customerFacingMessage = action.customerFacingMessage;
    if (action.isNeedsReview !== undefined) order.isNeedsReview = action.isNeedsReview;

    if (action.status === 'Completed') {
      order.completedAt = nowIso;
    }

    const timelineNote = action.customerFacingMessage || `Order status manually transitioned to ${action.status} by ${action.adminUser.name}`;
    order.timeline.push({
      status: action.status,
      timestamp: nowIso,
      note: timelineNote,
      actor: action.adminUser.name
    });

    // Record audit log
    this.addAuditLog({
      adminId: action.adminUser.id,
      adminName: action.adminUser.name,
      adminRole: action.adminUser.role,
      action: `ORDER_STATUS_${action.status.toUpperCase().replace(/\s+/g, '_')}`,
      targetType: 'order',
      targetId: order.id,
      details: `Transitioned order ${order.orderNumber} to "${action.status}". Note: ${action.adminNote || 'None'}`
    });

    // Notify customer
    if (order.userId) {
      let title = `Order Status: ${action.status}`;
      let msg = action.customerFacingMessage || `Your order ${order.orderNumber} is now marked as ${action.status}.`;
      if (action.status === 'Payment Verified') {
        title = `Payment Verified (${order.orderNumber})`;
        msg = `Your payment of NPR ${order.finalAmount} has been verified! We are preparing the top-up.`;
      } else if (action.status === 'Top-up Processing') {
        title = `Top-Up In Progress (${order.orderNumber})`;
        msg = `Admin is actively dispatching diamonds/UC/coins to player ID.`;
      } else if (action.status === 'Completed') {
        title = `Top-Up Completed! (${order.orderNumber})`;
        msg = `Congratulations! Top-up for ${order.gameName} has been delivered successfully.`;
      } else if (action.status === 'Rejected') {
        title = `Payment Rejected (${order.orderNumber})`;
        msg = action.customerFacingMessage || `Payment verification failed. Please check with support.`;
      }

      this.addNotification({
        userId: order.userId,
        title,
        message: msg,
        orderId: order.id,
        type: 'order'
      });
    }

    this.persist();
    return { success: true, order };
  }

  // Customer refund request
  requestRefund(orderId: string, reason: string, description: string): { success: boolean; order?: Order; error?: string } {
    const order = this.getOrderById(orderId);
    if (!order) return { success: false, error: 'Order not found.' };

    if (['Completed', 'Refunded'].includes(order.status)) {
      // Completed top-ups have in-game items already delivered
    }

    const nowIso = new Date().toISOString();
    order.status = 'Refund Requested';
    order.updatedAt = nowIso;
    order.customerNote = `[Refund Request - ${reason}]: ${description}`;

    order.timeline.push({
      status: 'Refund Requested',
      timestamp: nowIso,
      note: `Customer requested refund. Reason: ${reason} - ${description}`
    });

    this.persist();
    return { success: true, order };
  }

  // --- Notifications ---
  addNotification(notif: Omit<NotificationItem, 'id' | 'createdAt' | 'read'>): NotificationItem {
    const item: NotificationItem = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      read: false
    };
    this.data.notifications.push(item);
    this.persist();
    return item;
  }

  getUserNotifications(userId: string): NotificationItem[] {
    return this.data.notifications
      .filter(n => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  markNotificationAsRead(id: string): boolean {
    const notif = this.data.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.persist();
      return true;
    }
    return false;
  }

  markAllNotificationsRead(userId: string): void {
    this.data.notifications.filter(n => n.userId === userId).forEach(n => { n.read = true; });
    this.persist();
  }

  // --- Support Tickets ---
  getSupportTickets(userId?: string): SupportTicket[] {
    if (userId) {
      return this.data.supportTickets
        .filter(t => t.userId === userId)
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return [...this.data.supportTickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  getSupportTicketById(id: string): SupportTicket | undefined {
    return this.data.supportTickets.find(t => t.id === id || t.ticketNumber === id);
  }

  createSupportTicket(payload: {
    userId: string;
    userName: string;
    userEmail: string;
    userPhone?: string;
    orderId?: string;
    subject: string;
    message: string;
    priority?: 'low' | 'medium' | 'high';
  }): SupportTicket {
    const nowIso = new Date().toISOString();
    let orderNumber: string | undefined;
    if (payload.orderId) {
      const ord = this.getOrderById(payload.orderId);
      if (ord) orderNumber = ord.orderNumber;
    }

    const ticketNumber = `TKT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ticketId = `tkt-${Date.now()}`;

    const newTicket: SupportTicket = {
      id: ticketId,
      ticketNumber,
      userId: payload.userId,
      userName: payload.userName,
      userEmail: payload.userEmail,
      userPhone: payload.userPhone,
      orderId: payload.orderId,
      orderNumber,
      subject: payload.subject,
      status: 'Open',
      priority: payload.priority || 'medium',
      createdAt: nowIso,
      updatedAt: nowIso,
      messages: [
        {
          id: `msg-${Date.now()}`,
          ticketId,
          senderId: payload.userId,
          senderName: payload.userName,
          senderRole: 'customer',
          message: payload.message,
          createdAt: nowIso
        }
      ]
    };

    this.data.supportTickets.push(newTicket);
    this.persist();
    return newTicket;
  }

  addTicketMessage(ticketId: string, message: {
    senderId: string;
    senderName: string;
    senderRole: 'customer' | 'support' | 'admin';
    message: string;
  }): SupportMessage | null {
    const ticket = this.getSupportTicketById(ticketId);
    if (!ticket) return null;

    const nowIso = new Date().toISOString();
    const msg: SupportMessage = {
      id: `msg-${Date.now()}`,
      ticketId: ticket.id,
      senderId: message.senderId,
      senderName: message.senderName,
      senderRole: message.senderRole,
      message: message.message,
      createdAt: nowIso
    };

    ticket.messages.push(msg);
    ticket.updatedAt = nowIso;
    if (message.senderRole !== 'customer') {
      ticket.status = 'Waiting for Customer';
    } else {
      ticket.status = 'In Progress';
    }

    this.persist();
    return msg;
  }

  updateTicketStatus(ticketId: string, status: SupportTicket['status']): boolean {
    const ticket = this.getSupportTicketById(ticketId);
    if (!ticket) return false;
    ticket.status = status;
    ticket.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  // --- Settings & Audit ---
  getSettings(): WebsiteSettings {
    return this.data.settings;
  }

  updateSettings(updates: Partial<WebsiteSettings>, adminUser?: User): WebsiteSettings {
    this.data.settings = { ...this.data.settings, ...updates };
    if (adminUser) {
      this.addAuditLog({
        adminId: adminUser.id,
        adminName: adminUser.name,
        adminRole: adminUser.role,
        action: 'UPDATE_SETTINGS',
        targetType: 'setting',
        targetId: 'settings',
        details: `Updated website settings: ${Object.keys(updates).join(', ')}`
      });
    }
    this.persist();
    return this.data.settings;
  }

  getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): AuditLog {
    const item: AuditLog = {
      ...log,
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString()
    };
    this.data.auditLogs.push(item);
    this.persist();
    return item;
  }

  // --- Users & Auth ---
  getUsers(): User[] {
    return this.data.users;
  }

  getUserById(id: string): User | undefined {
    let user = this.data.users.find(u => u.id === id);
    if (!user) {
      const seedMatch = defaultUsers.find(u => u.id === id);
      if (seedMatch) {
        this.data.users.push(seedMatch);
        this.persist();
        return seedMatch;
      }
    }
    return user;
  }

  getUserByEmail(email: string): User | undefined {
    const clean = email.toLowerCase().trim();
    let user = this.data.users.find(u => u.email.toLowerCase().trim() === clean);
    if (!user) {
      const seedMatch = defaultUsers.find(u => u.email.toLowerCase().trim() === clean);
      if (seedMatch) {
        this.data.users.push(seedMatch);
        this.persist();
        return seedMatch;
      }
    }
    return user;
  }

  getUserByPhone(phone: string): User | undefined {
    return this.data.users.find(u => u.phone === phone);
  }

  createUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'status'>): User {
    const nowIso = new Date().toISOString();
    const newUser: User = {
      ...user,
      id: `usr-${Date.now()}`,
      status: 'active',
      createdAt: nowIso,
      updatedAt: nowIso
    };
    this.data.users.push(newUser);
    this.persist();
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | null {
    const idx = this.data.users.findIndex(u => u.id === id);
    if (idx === -1) return null;
    this.data.users[idx] = { ...this.data.users[idx], ...updates, updatedAt: new Date().toISOString() };
    this.persist();
    return this.data.users[idx];
  }

  // Analytics Stats for Admin Dashboard
  getStats() {
    const orders = this.data.orders;
    const totalOrders = orders.length;
    const completedOrders = orders.filter(o => o.status === 'Completed');
    const pendingOrders = orders.filter(o => o.status === 'Pending Payment' || o.status === 'Payment Submitted' || o.status === 'Payment Under Review');
    const reviewOrders = orders.filter(o => o.status === 'Payment Under Review' || o.isNeedsReview || o.isFlaggedDuplicate);
    const cancelledOrders = orders.filter(o => o.status === 'Cancelled' || o.status === 'Rejected');
    const refundOrders = orders.filter(o => o.status === 'Refund Requested' || o.status === 'Refunded');

    const totalSales = completedOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayOrders = completedOrders.filter(o => o.completedAt && o.completedAt.slice(0, 10) === todayStr);
    const todaySales = todayOrders.reduce((sum, o) => sum + o.finalAmount, 0);

    // Sales by game
    const gameSalesMap: Record<string, { name: string; sales: number; count: number }> = {};
    orders.forEach(o => {
      if (!gameSalesMap[o.gameName]) {
        gameSalesMap[o.gameName] = { name: o.gameName, sales: 0, count: 0 };
      }
      gameSalesMap[o.gameName].count += 1;
      if (o.status === 'Completed') {
        gameSalesMap[o.gameName].sales += o.finalAmount;
      }
    });

    // Orders by status
    const statusCountMap: Record<string, number> = {};
    orders.forEach(o => {
      statusCountMap[o.status] = (statusCountMap[o.status] || 0) + 1;
    });

    // Orders by payment method
    const paymentMethodMap: Record<string, number> = {};
    orders.forEach(o => {
      paymentMethodMap[o.paymentMethodName] = (paymentMethodMap[o.paymentMethodName] || 0) + 1;
    });

    const ordersByGameMap: Record<string, number> = {};
    orders.forEach(o => {
      ordersByGameMap[o.gameName] = (ordersByGameMap[o.gameName] || 0) + 1;
    });

    const ordersByPaymentMethodMap: Record<string, number> = {};
    orders.forEach(o => {
      ordersByPaymentMethodMap[o.paymentMethodName] = (ordersByPaymentMethodMap[o.paymentMethodName] || 0) + 1;
    });

    const processingOrders = orders.filter(o => o.status === 'Top-up Processing' || o.status === 'Payment Verified');

    return {
      totalCustomers: this.data.users.filter(u => u.role === 'CUSTOMER').length,
      totalOrders,
      pendingOrders: pendingOrders.length,
      pendingPaymentCount: pendingOrders.length,
      paymentReviews: reviewOrders.length,
      completedOrders: completedOrders.length,
      processingCount: processingOrders.length,
      refundRequestsCount: refundOrders.length,
      cancelledOrders: cancelledOrders.length,
      refundRequests: refundOrders.length,
      totalSales,
      totalRevenue: totalSales,
      todaySales,
      todayRevenue: todaySales,
      monthlySales: totalSales, // Sample active month
      salesByGame: Object.values(gameSalesMap),
      ordersByGame: ordersByGameMap,
      ordersByStatus: Object.entries(statusCountMap).map(([status, count]) => ({ status, count })),
      ordersByPaymentMethod: ordersByPaymentMethodMap
    };
  }
}

export const db = new Database();
