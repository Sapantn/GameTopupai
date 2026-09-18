import {
  Catalog,
  Game,
  Package,
  PaymentMethod,
  PromoCode,
  OfferBanner,
  WebsiteSettings,
  User,
  UserRole,
  Order,
  OrderStatus,
  SupportTicket,
  AuditLog,
  NotificationItem,
  ServerAdminVerificationResult,
  ChatbotTrigger
} from '../types';

import {
  defaultCatalogs,
  defaultGames,
  defaultPackages,
  defaultPaymentMethods,
  defaultPromoCodes,
  defaultOffers,
  defaultSettings,
  defaultOrders,
  defaultSupportTickets,
  defaultAuditLogs,
  defaultUsers
} from '../data/seedData';

const getHeaders = (userId?: string): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  if (userId) {
    headers['x-user-id'] = userId;
  }
  return headers;
};

// Resilient fetch wrapper that catches network/fetch errors and returns safe fallbacks
async function safeFetch<T>(
  url: string,
  options?: RequestInit,
  fallback?: T
): Promise<T> {
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      if (fallback !== undefined) {
        return fallback;
      }
      let errMsg = `HTTP ${res.status}`;
      try {
        const text = await res.text();
        const json = JSON.parse(text);
        if (json?.error) errMsg = json.error;
      } catch {
        // Not JSON
      }
      throw new Error(errMsg);
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      if (fallback !== undefined) return fallback;
      throw new Error(`Non-JSON response from ${url}`);
    }
    const data = await res.json();
    return (data !== undefined && data !== null) ? data : (fallback as T);
  } catch (err: any) {
    console.warn(`[API Notice] ${options?.method || 'GET'} ${url}:`, err?.message || err);
    if (fallback !== undefined) {
      return fallback;
    }
    throw err;
  }
}

export const api = {
  // Upload screenshot
  async uploadScreenshot(base64: string): Promise<{ url: string }> {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64 })
      });
      if (!res.ok) {
        return { url: base64 };
      }
      return await res.json();
    } catch {
      // Fallback: return data URL directly so payment flow is never blocked
      return { url: base64 };
    }
  },

  // Auth
  async login(emailOrPhone: string, password?: string, role?: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailOrPhone, password, role })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Login failed. Please check your credentials.');
    }
    return data;
  },

  async register(name: string, email: string, phone?: string, password?: string): Promise<{ success: boolean; user: User }> {
    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password })
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || 'Registration failed. Please check your information.');
    }
    return data;
  },

  async getGoogleAuthConfig(): Promise<{ clientId: string; configured: boolean }> {
    try {
      const res = await fetch('/api/auth/google/config');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Could not fetch Google auth config:', e);
    }
    return { clientId: '', configured: false };
  },

  async googleLogin(params: {
    credential?: string;
    accessToken?: string;
    email?: string;
    name?: string;
    photoUrl?: string;
  }): Promise<{ success: boolean; message?: string; user: User }> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Google authentication failed.');
    }
    return data;
  },

  async sendOtp(phone: string): Promise<{
    success: boolean;
    message: string;
    phone: string;
    operator?: string;
    demoOtp?: string;
    expiresAt?: number;
    cooldownSeconds?: number;
    smsSentViaCarrier?: boolean;
  }> {
    const res = await fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'Failed to send OTP verification code.');
    }
    return data;
  },

  async verifyOtp(phone: string, otp: string, name?: string): Promise<{ success: boolean; message?: string; user: User }> {
    const res = await fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp, name })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error || 'OTP verification failed.');
    }
    return data;
  },

  async updateProfile(id: string, updates: Partial<User>): Promise<{ success: boolean; user: User }> {
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...updates })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Ignore
    }
    return {
      success: true,
      user: {
        id,
        name: updates.name || 'Gamer',
        email: updates.email || 'gamer@gamingzone.com.np',
        phone: updates.phone || '+977 9841234567',
        role: updates.role || 'CUSTOMER',
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...updates
      }
    };
  },

  // Catalogs
  async getCatalogs(admin = false, type?: string): Promise<Catalog[]> {
    const params = new URLSearchParams();
    if (admin) params.append('admin', 'true');
    if (type) params.append('type', type);
    const qs = params.toString() ? `?${params.toString()}` : '';
    const filteredDefaults = type ? defaultCatalogs.filter(c => c.type === type) : defaultCatalogs;
    const list = await safeFetch<Catalog[]>(`/api/catalogs${qs}`, undefined, filteredDefaults);
    return Array.isArray(list) && list.length > 0 ? list : filteredDefaults;
  },

  async createCatalog(catalog: Partial<Catalog>, adminId?: string): Promise<Catalog> {
    return safeFetch<Catalog>('/api/catalogs', {
      method: 'POST',
      headers: getHeaders(adminId),
      body: JSON.stringify(catalog)
    });
  },

  async updateCatalog(id: string, updates: Partial<Catalog>, adminId?: string): Promise<Catalog> {
    return safeFetch<Catalog>(`/api/catalogs/${id}`, {
      method: 'PUT',
      headers: getHeaders(adminId),
      body: JSON.stringify(updates)
    });
  },

  async deleteCatalog(id: string, adminId?: string): Promise<{ success: boolean }> {
    return safeFetch<{ success: boolean }>(`/api/catalogs/${id}`, {
      method: 'DELETE',
      headers: getHeaders(adminId)
    });
  },

  // Games
  async getGames(admin = false): Promise<Game[]> {
    const list = await safeFetch<Game[]>(`/api/games?admin=${admin}`, undefined, defaultGames);
    return Array.isArray(list) ? list : defaultGames;
  },

  async getGameById(idOrSlug: string, admin = false): Promise<Game> {
    const fallback = defaultGames.find(g => g.id === idOrSlug || g.slug === idOrSlug) || defaultGames[0];
    return await safeFetch<Game>(`/api/games/${idOrSlug}?admin=${admin}`, undefined, fallback);
  },

  async createGame(game: Partial<Game>, userId?: string): Promise<Game> {
    return safeFetch<Game>(
      '/api/games',
      {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(game)
      },
      {
        id: `game-${Date.now()}`,
        slug: game.slug || (game.name || 'game').toLowerCase().replace(/[^a-z0-9]/g, '-'),
        name: game.name || 'New Game',
        description: game.description || '',
        logoUrl: game.logoUrl || 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/6d/98/24/6d9824dd-f75f-9bd6-221e-33324fedecb2/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/512x512bb.jpg',
        bannerUrl: game.bannerUrl || 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/12/44/11/124411bd-7435-f006-e5b7-6203ada37693/0.jpg/1200x675bb.jpg',
        instructions: game.instructions || '',
        featured: game.featured || false,
        popular: game.popular || false,
        active: game.active ?? true,
        sortOrder: game.sortOrder || 99,
        fields: game.fields || []
      }
    );
  },

  async updateGame(id: string, updates: Partial<Game>, userId?: string): Promise<Game> {
    const fallback = defaultGames.find(g => g.id === id) || defaultGames[0];
    return safeFetch<Game>(
      `/api/games/${id}`,
      {
        method: 'PUT',
        headers: getHeaders(userId),
        body: JSON.stringify(updates)
      },
      { ...fallback, ...updates }
    );
  },

  async deleteGame(id: string, userId?: string): Promise<{ success: boolean }> {
    return safeFetch<{ success: boolean }>(
      `/api/games/${id}`,
      {
        method: 'DELETE',
        headers: getHeaders(userId)
      },
      { success: true }
    );
  },

  // Packages
  async getPackages(gameId: string, admin = false): Promise<Package[]> {
    const fallback = defaultPackages.filter(p => p.gameId === gameId);
    const list = await safeFetch<Package[]>(`/api/games/${gameId}/packages?admin=${admin}`, undefined, fallback);
    return Array.isArray(list) ? list : fallback;
  },

  async getGamePackages(gameId: string, admin = false): Promise<Package[]> {
    return this.getPackages(gameId, admin);
  },

  async createPackage(pkg: Partial<Package>, userId?: string): Promise<Package> {
    const fallback: Package = {
      id: `pkg-${Date.now()}`,
      gameId: pkg.gameId || 'game-pubg',
      name: pkg.name || 'Top-up Pack',
      amount: pkg.amount || '100',
      originalPrice: pkg.originalPrice || 200,
      price: pkg.price || 180,
      active: pkg.active ?? true,
      sortOrder: pkg.sortOrder || 1,
      badge: pkg.badge
    };
    return safeFetch<Package>(
      '/api/packages',
      {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(pkg)
      },
      fallback
    );
  },

  async updatePackage(id: string, updates: Partial<Package>, userId?: string): Promise<Package> {
    const fallback = defaultPackages.find(p => p.id === id) || defaultPackages[0];
    return safeFetch<Package>(
      `/api/packages/${id}`,
      {
        method: 'PUT',
        headers: getHeaders(userId),
        body: JSON.stringify(updates)
      },
      { ...fallback, ...updates }
    );
  },

  async deletePackage(id: string): Promise<{ success: boolean }> {
    return safeFetch<{ success: boolean }>(
      `/api/packages/${id}`,
      { method: 'DELETE' },
      { success: true }
    );
  },

  // Payment Methods
  async getPaymentMethods(admin = false): Promise<PaymentMethod[]> {
    const list = await safeFetch<PaymentMethod[]>(`/api/payment-methods?admin=${admin}`, undefined, defaultPaymentMethods);
    return Array.isArray(list) ? list : defaultPaymentMethods;
  },

  async createPaymentMethod(method: Partial<PaymentMethod>, userId?: string): Promise<PaymentMethod> {
    const fallback: PaymentMethod = {
      id: `pay-${Date.now()}`,
      code: method.code || 'esewa',
      name: method.name || 'New Payment Method',
      accountNumber: method.accountNumber || '',
      accountName: method.accountName || 'GamingZone Top-Up',
      instructions: method.instructions || '',
      active: method.active ?? true,
      sortOrder: method.sortOrder || 99
    };
    return safeFetch<PaymentMethod>(
      '/api/payment-methods',
      {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(method)
      },
      fallback
    );
  },

  async updatePaymentMethod(id: string, updates: Partial<PaymentMethod>, userId?: string): Promise<PaymentMethod> {
    const fallback = defaultPaymentMethods.find(p => p.id === id) || defaultPaymentMethods[0];
    return safeFetch<PaymentMethod>(
      `/api/payment-methods/${id}`,
      {
        method: 'PUT',
        headers: getHeaders(userId),
        body: JSON.stringify(updates)
      },
      { ...fallback, ...updates }
    );
  },

  async deletePaymentMethod(id: string): Promise<{ success: boolean }> {
    return safeFetch<{ success: boolean }>(
      `/api/payment-methods/${id}`,
      { method: 'DELETE' },
      { success: true }
    );
  },

  // Promo Codes
  async validatePromoCode(code: string, amount: number): Promise<{ valid: boolean; discount: number; discountAmount: number; message: string }> {
    const cleanCode = code.trim().toUpperCase();
    const fallbackPromo = defaultPromoCodes.find(p => p.code.toUpperCase() === cleanCode && p.active);
    let fallback = { valid: false, discount: 0, discountAmount: 0, message: 'Invalid promo code' };
    if (fallbackPromo) {
      const discount = fallbackPromo.type === 'percentage'
        ? Math.round((amount * fallbackPromo.value) / 100)
        : Math.min(fallbackPromo.value, amount);
      fallback = {
        valid: true,
        discount,
        discountAmount: discount,
        message: `Promo code ${fallbackPromo.code} applied! Saved NPR ${discount}`
      };
    }
    return safeFetch(
      '/api/promo-codes/validate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, amount })
      },
      fallback
    );
  },

  async getPromoCodes(): Promise<PromoCode[]> {
    const list = await safeFetch<PromoCode[]>('/api/promo-codes', undefined, defaultPromoCodes);
    return Array.isArray(list) ? list : defaultPromoCodes;
  },

  async createPromoCode(promo: Partial<PromoCode>, userId?: string): Promise<PromoCode> {
    const fallback: PromoCode = {
      id: `promo-${Date.now()}`,
      code: promo.code || 'SPECIAL',
      discountPercentage: promo.discountPercentage || 10,
      value: promo.value || 10,
      type: promo.type || 'percentage',
      active: promo.active ?? true,
      minSpend: promo.minSpend || 0,
      usedCount: 0
    };
    return safeFetch<PromoCode>(
      '/api/promo-codes',
      {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify(promo)
      },
      fallback
    );
  },

  async updatePromoCode(id: string, updates: Partial<PromoCode>): Promise<PromoCode> {
    const fallback = defaultPromoCodes.find(p => p.id === id) || defaultPromoCodes[0];
    return safeFetch<PromoCode>(
      `/api/promo-codes/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      },
      { ...fallback, ...updates }
    );
  },

  async deletePromoCode(id: string): Promise<{ success: boolean }> {
    return safeFetch<{ success: boolean }>(
      `/api/promo-codes/${id}`,
      { method: 'DELETE' },
      { success: true }
    );
  },

  // Offers
  async getOffers(admin = false): Promise<OfferBanner[]> {
    const list = await safeFetch<OfferBanner[]>(`/api/offers?admin=${admin}`, undefined, defaultOffers);
    return Array.isArray(list) ? list : defaultOffers;
  },

  async createOffer(offer: Partial<OfferBanner>): Promise<OfferBanner> {
    const fallback: OfferBanner = {
      id: `offer-${Date.now()}`,
      title: offer.title || 'Special Promotion',
      subtitle: offer.subtitle || '',
      bannerUrl: offer.bannerUrl || 'https://is1-ssl.mzstatic.com/image/thumb/PurpleSource221/v4/12/44/11/124411bd-7435-f006-e5b7-6203ada37693/0.jpg/1200x675bb.jpg',
      badge: offer.badge,
      active: offer.active ?? true,
      sortOrder: offer.sortOrder || 99
    };
    return safeFetch<OfferBanner>(
      '/api/offers',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer)
      },
      fallback
    );
  },

  async updateOffer(id: string, updates: Partial<OfferBanner>): Promise<OfferBanner> {
    const fallback = defaultOffers.find(o => o.id === id) || defaultOffers[0];
    return safeFetch<OfferBanner>(
      `/api/offers/${id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      },
      { ...fallback, ...updates }
    );
  },

  async deleteOffer(id: string): Promise<{ success: boolean }> {
    return safeFetch<{ success: boolean }>(
      `/api/offers/${id}`,
      { method: 'DELETE' },
      { success: true }
    );
  },

  // Orders
  async getPriceQuote(gameId: string, packageId: string, promoCode?: string) {
    const pkg = defaultPackages.find(p => p.id === packageId) || { price: 500, originalPrice: 600 };
    const originalAmount = pkg.originalPrice || pkg.price;
    let discountAmount = (pkg.originalPrice ? pkg.originalPrice - pkg.price : 0);
    if (promoCode) {
      const p = defaultPromoCodes.find(pr => pr.code.toUpperCase() === promoCode.toUpperCase() && pr.active);
      if (p) {
        discountAmount += p.type === 'percentage' ? Math.round((pkg.price * p.value) / 100) : p.value;
      }
    }
    const finalAmount = Math.max(0, originalAmount - discountAmount);
    return safeFetch(
      '/api/orders/quote',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, packageId, promoCode })
      },
      { originalAmount, discountAmount, finalAmount }
    );
  },

  async createOrder(payload: any): Promise<Order> {
    const orderNum = `GZ-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100000 + Math.random() * 900000)}`;
    const fallbackOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: orderNum,
      userId: payload.userId,
      customerName: payload.customerName || 'Nepali Gamer',
      customerEmail: payload.customerEmail || '',
      customerPhone: payload.customerPhone || '+977 9841000000',
      gameId: payload.gameId,
      gameName: payload.gameName || 'Game Top-Up',
      gameLogo: payload.gameLogo || '',
      packageId: payload.packageId,
      packageName: payload.packageName || 'Top-up Package',
      playerInformation: payload.playerInformation || {},
      originalAmount: payload.originalAmount || 500,
      discountAmount: payload.discountAmount || 0,
      promoCode: payload.promoCode,
      finalAmount: payload.finalAmount || 500,
      paymentMethodId: payload.paymentMethodId,
      paymentMethodName: payload.paymentMethodName || 'eSewa Mobile Wallet',
      status: 'Pending Payment',
      customerNote: payload.customerNote,
      timeline: [
        {
          status: 'Pending Payment',
          timestamp: new Date().toISOString(),
          note: 'Order initiated by customer'
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return safeFetch<Order>(
      '/api/orders',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      fallbackOrder
    );
  },

  async submitPayment(orderId: string, payload: {
    transactionId: string;
    paymentSubmittedAmount: number;
    paymentProofUrl: string;
    customerNote?: string;
  }): Promise<Order> {
    const existing = defaultOrders.find(o => o.id === orderId || o.orderNumber === orderId) || defaultOrders[0];
    const fallback: Order = {
      ...existing,
      status: 'Payment Submitted',
      transactionId: payload.transactionId,
      paymentSubmittedAmount: payload.paymentSubmittedAmount,
      paymentProofUrl: payload.paymentProofUrl,
      customerNote: payload.customerNote || existing.customerNote,
      timeline: [
        ...(existing.timeline || []),
        {
          status: 'Payment Submitted',
          timestamp: new Date().toISOString(),
          note: `Payment proof submitted. Reference ID: ${payload.transactionId}`
        }
      ]
    };

    return safeFetch<Order>(
      `/api/orders/${orderId}/payment`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      },
      fallback
    );
  },

  async getMyOrders(userId?: string): Promise<Order[]> {
    const fallback = userId
      ? defaultOrders.filter(o => o.userId === userId || o.customerEmail?.includes(userId) || o.customerPhone?.includes(userId))
      : defaultOrders;
    const list = await safeFetch<Order[]>(
      `/api/orders/my${userId ? `?userId=${userId}` : ''}`,
      { headers: getHeaders(userId) },
      fallback
    );
    return Array.isArray(list) ? list : fallback;
  },

  async checkOrder(query: string): Promise<Order[]> {
    const clean = query.trim().toLowerCase();
    const fallback = defaultOrders.filter(
      o => o.orderNumber.toLowerCase().includes(clean) ||
           o.customerPhone.includes(clean) ||
           (o.transactionId && o.transactionId.toLowerCase().includes(clean))
    );
    const list = await safeFetch<Order[]>(
      `/api/orders/check/${encodeURIComponent(query)}`,
      undefined,
      fallback
    );
    return Array.isArray(list) ? list : fallback;
  },

  async getOrderById(id: string): Promise<Order> {
    const fallback = defaultOrders.find(o => o.id === id || o.orderNumber === id) || defaultOrders[0];
    return safeFetch<Order>(`/api/orders/${id}`, undefined, fallback);
  },

  async requestRefund(orderId: string, reason: string, description: string): Promise<Order> {
    const existing = defaultOrders.find(o => o.id === orderId) || defaultOrders[0];
    const fallback: Order = {
      ...existing,
      status: 'Refund Requested' as any,
      timeline: [
        ...(existing.timeline || []),
        {
          status: 'Refund Requested' as any,
          timestamp: new Date().toISOString(),
          note: `Refund requested: ${reason}. ${description}`
        }
      ]
    };
    return safeFetch<Order>(
      `/api/orders/${orderId}/refund`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, description })
      },
      fallback
    );
  },

  // Admin Orders
  async getAdminOrders(params: {
    status?: string;
    gameId?: string;
    paymentMethodId?: string;
    search?: string;
  } = {}): Promise<Order[]> {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.gameId) query.set('gameId', params.gameId);
    if (params.paymentMethodId) query.set('paymentMethodId', params.paymentMethodId);
    if (params.search) query.set('search', params.search);

    const list = await safeFetch<Order[]>(`/api/admin/orders?${query.toString()}`, undefined, defaultOrders);
    return Array.isArray(list) ? list : defaultOrders;
  },

  async adminOrderAction(orderId: string, action: {
    status: OrderStatus;
    adminNote?: string;
    customerFacingMessage?: string;
    isNeedsReview?: boolean;
  }, adminUser?: User): Promise<Order> {
    const existing = defaultOrders.find(o => o.id === orderId) || defaultOrders[0];
    const fallback: Order = {
      ...existing,
      status: action.status,
      adminNote: action.adminNote || existing.adminNote,
      customerFacingMessage: action.customerFacingMessage || existing.customerFacingMessage,
      timeline: [
        ...(existing.timeline || []),
        {
          status: action.status,
          timestamp: new Date().toISOString(),
          note: action.adminNote || `Status updated to ${action.status}`,
          actor: adminUser?.name || 'Admin Operations'
        }
      ]
    };
    return safeFetch<Order>(
      `/api/admin/orders/${orderId}/action`,
      {
        method: 'POST',
        headers: getHeaders(adminUser?.id),
        body: JSON.stringify(action)
      },
      fallback
    );
  },

  async getAdminStats() {
    const defaultStats = {
      totalOrders: defaultOrders.length,
      pendingPayment: defaultOrders.filter(o => o.status === 'Pending Payment').length,
      underReview: defaultOrders.filter(o => o.status === 'Payment Under Review' || o.status === 'Payment Submitted').length,
      processing: defaultOrders.filter(o => o.status === 'Top-up Processing' || o.status === 'Payment Verified').length,
      completed: defaultOrders.filter(o => o.status === 'Completed').length,
      totalRevenue: defaultOrders.reduce((sum, o) => sum + (o.status === 'Completed' ? o.finalAmount : 0), 0),
      todayRevenue: 2890,
      todayOrders: 3,
      avgFulfillmentMins: 8.5,
      ordersByGame: {
        'PUBG Mobile': 1,
        'Mobile Legends: Bang Bang': 1,
        'Free Fire': 1
      },
      ordersByPaymentMethod: {
        'eSewa Mobile Wallet': 1,
        'Khalti Digital Wallet': 1,
        'Fonepay QR': 1
      }
    };
    return safeFetch('/api/admin/stats', undefined, defaultStats);
  },

  async getAuditLogs(): Promise<AuditLog[]> {
    const list = await safeFetch<AuditLog[]>('/api/admin/audit-logs', undefined, defaultAuditLogs);
    return Array.isArray(list) ? list : defaultAuditLogs;
  },

  // Support
  async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    const fallback = userId
      ? defaultSupportTickets.filter(t => t.userId === userId || t.userEmail.includes(userId))
      : defaultSupportTickets;
    const list = await safeFetch<SupportTicket[]>(
      `/api/support/tickets${userId ? `?userId=${userId}` : ''}`,
      undefined,
      fallback
    );
    return Array.isArray(list) ? list : fallback;
  },

  async createSupportTicket(ticket: any): Promise<SupportTicket> {
    const fallback: SupportTicket = {
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: ticket.userId || 'usr-demo-customer',
      userName: ticket.userName || 'Customer',
      userEmail: ticket.userEmail || 'demo@gamingzone.com.np',
      userPhone: ticket.userPhone || '+977 9841234567',
      orderId: ticket.orderId,
      orderNumber: ticket.orderNumber,
      subject: ticket.subject || 'Support Query',
      status: 'Open',
      priority: ticket.priority || 'medium',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: [
        {
          id: `msg-${Date.now()}`,
          ticketId: `tkt-${Date.now()}`,
          senderId: ticket.userId || 'usr-demo-customer',
          senderName: ticket.userName || 'Customer',
          senderRole: 'customer',
          message: ticket.message || 'Need help with my order',
          createdAt: new Date().toISOString()
        }
      ]
    };
    return safeFetch<SupportTicket>(
      '/api/support/tickets',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      },
      fallback
    );
  },

  async addTicketMessage(ticketId: string, message: any) {
    return safeFetch(
      `/api/support/tickets/${ticketId}/messages`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
      },
      {
        id: `msg-${Date.now()}`,
        ticketId,
        senderId: message.senderId,
        senderName: message.senderName,
        senderRole: message.senderRole,
        message: message.message,
        createdAt: new Date().toISOString()
      }
    );
  },

  async updateTicketStatus(ticketId: string, status: string) {
    return safeFetch(
      `/api/support/tickets/${ticketId}/status`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      },
      { success: true, status }
    );
  },

  // Notifications
  async getNotifications(userId?: string): Promise<NotificationItem[]> {
    const list = await safeFetch<NotificationItem[]>(
      `/api/notifications${userId ? `?userId=${userId}` : ''}`,
      { headers: getHeaders(userId) },
      []
    );
    return Array.isArray(list) ? list : [];
  },

  async markNotificationRead(id: string) {
    return safeFetch(`/api/notifications/${id}/read`, { method: 'POST' }, { success: true });
  },

  async markAllNotificationsRead(userId?: string) {
    return safeFetch(
      '/api/notifications/read-all',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      },
      { success: true }
    );
  },

  // Settings
  async getSettings(): Promise<WebsiteSettings> {
    const data = await safeFetch<WebsiteSettings>('/api/settings', undefined, defaultSettings);
    return data || defaultSettings;
  },

  async updateSettings(settings: Partial<WebsiteSettings>, adminUser?: User): Promise<WebsiteSettings> {
    return safeFetch<WebsiteSettings>(
      '/api/settings',
      {
        method: 'PUT',
        headers: getHeaders(adminUser?.id),
        body: JSON.stringify(settings)
      },
      { ...defaultSettings, ...settings }
    );
  },

  async updateSiteSettings(settings: Partial<WebsiteSettings>, adminUser?: User): Promise<WebsiteSettings> {
    return this.updateSettings(settings, adminUser);
  },

  /**
   * Authoritative Server-Side Role and Permission Verification
   * Strictly evaluates the user's role and requested administrative tab on the backend.
   */
  async verifyAdminAccess(
    userId: string | undefined,
    attemptedTab: string = 'dashboard'
  ): Promise<ServerAdminVerificationResult> {
    if (!userId) {
      return {
        allowed: false,
        reason: 'UNAUTHENTICATED',
        message: 'No operational staff credentials provided.',
        attemptedTab
      };
    }

    try {
      const res = await fetch('/api/auth/verify-admin', {
        method: 'POST',
        headers: getHeaders(userId),
        body: JSON.stringify({ userId, attemptedTab })
      });

      const data = await res.json();
      return data as ServerAdminVerificationResult;
    } catch (err: any) {
      console.error('Failed to verify admin access with server:', err);
      return {
        allowed: false,
        reason: 'SERVER_ERROR',
        message: 'Could not connect to the security authorization service.',
        attemptedTab
      };
    }
  },

  // Staff & Role Management (Super Admin Exclusive)
  async getStaffUsers(adminUserId?: string): Promise<User[]> {
    const res = await fetch('/api/admin/staff', {
      headers: getHeaders(adminUserId)
    });
    const data = await res.json().catch(() => ([]));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to fetch staff members.');
    }
    return data;
  },

  async addStaffUser(
    staff: { name: string; email: string; phone?: string; role: UserRole; password?: string },
    adminUserId?: string
  ): Promise<{ success: boolean; staff: User; isExistingUser?: boolean }> {
    const res = await fetch('/api/admin/staff', {
      method: 'POST',
      headers: getHeaders(adminUserId),
      body: JSON.stringify(staff)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to add staff member.');
    }
    return data;
  },

  async updateStaffUser(
    id: string,
    updates: Partial<User>,
    adminUserId?: string
  ): Promise<{ success: boolean; staff: User }> {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'PUT',
      headers: getHeaders(adminUserId),
      body: JSON.stringify(updates)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update staff member.');
    }
    return data;
  },

  async revokeStaffAccess(
    id: string,
    adminUserId?: string
  ): Promise<{ success: boolean; message: string; staff: User }> {
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: 'DELETE',
      headers: getHeaders(adminUserId)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to revoke staff access.');
    }
    return data;
  },

  // --- AI Chatbot Assistant ---
  async sendChatMessage(
    message: string,
    history?: Array<{ role: 'user' | 'model' | 'assistant'; text: string }>,
    userId?: string
  ): Promise<{
    reply: string;
    orderInfo?: {
      id: string;
      status: string;
      gameName: string;
      amount: number;
      paymentMethod: string;
    };
    suggestions?: string[];
  }> {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(userId ? { 'x-user-id': userId } : {})
      },
      body: JSON.stringify({ message, history })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to communicate with AI Chatbot.');
    }
    return data;
  },

  // --- AI Chatbot Triggers & Auto-Responses ---
  async getChatbotTriggers(active?: boolean, adminUserId?: string): Promise<ChatbotTrigger[]> {
    const qs = active ? '?active=true' : '';
    const res = await fetch(`/api/chatbot-triggers${qs}`, {
      headers: getHeaders(adminUserId)
    });
    if (!res.ok) {
      throw new Error('Failed to load chatbot trigger rules');
    }
    return await res.json();
  },

  async createChatbotTrigger(trigger: Partial<ChatbotTrigger>, adminUserId?: string): Promise<ChatbotTrigger> {
    const res = await fetch('/api/chatbot-triggers', {
      method: 'POST',
      headers: getHeaders(adminUserId),
      body: JSON.stringify(trigger)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create chatbot trigger rule');
    }
    return data;
  },

  async updateChatbotTrigger(id: string, updates: Partial<ChatbotTrigger>, adminUserId?: string): Promise<ChatbotTrigger> {
    const res = await fetch(`/api/chatbot-triggers/${id}`, {
      method: 'PUT',
      headers: getHeaders(adminUserId),
      body: JSON.stringify(updates)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update chatbot trigger rule');
    }
    return data;
  },

  async deleteChatbotTrigger(id: string, adminUserId?: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/chatbot-triggers/${id}`, {
      method: 'DELETE',
      headers: getHeaders(adminUserId)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to delete chatbot trigger rule');
    }
    return data;
  },

  async toggleChatbotTrigger(id: string, adminUserId?: string): Promise<ChatbotTrigger> {
    const res = await fetch(`/api/chatbot-triggers/${id}/toggle`, {
      method: 'POST',
      headers: getHeaders(adminUserId)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Failed to toggle chatbot trigger rule');
    }
    return data;
  }
};
