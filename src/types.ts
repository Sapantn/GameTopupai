export type UserRole = 'CUSTOMER' | 'SUPER_ADMIN' | 'ORDER_MANAGER' | 'CONTENT_MANAGER' | 'SUPPORT_AGENT';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  password?: string;
  photoUrl?: string;
  authProvider?: 'email' | 'phone' | 'google';
  role: UserRole;
  status: 'active' | 'suspended';
  emailVerified?: boolean;
  phoneVerified?: boolean;
  googleId?: string;
  createdAt: string;
  updatedAt: string;
}

// Google Identity Services (GSI) Typings
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string; select_by?: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              type?: 'standard' | 'icon';
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
              locale?: string;
            }
          ) => void;
          disableAutoSelect: () => void;
        };
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (tokenResponse: { access_token: string; error?: string }) => void;
          }) => {
            requestAccessToken: (overrideConfig?: { prompt?: string }) => void;
          };
        };
      };
    };
  }
}

export interface GameField {
  id: string;
  gameId: string;
  label: string;
  fieldName: string;
  fieldType: 'text' | 'number' | 'dropdown';
  options?: string[]; // for dropdown
  required: boolean;
  placeholder: string;
  helpText: string;
  validationRegex?: string;
  sortOrder: number;
}

export interface Package {
  id: string;
  gameId: string;
  name: string; // e.g. "60 UC" or "Weekly Diamond Pass"
  amount: string; // e.g. "60"
  originalPrice: number; // NPR original
  price: number; // NPR selling price
  discount?: number; // percentage
  discountTag?: string;
  isPopular?: boolean;
  isBestValue?: boolean;
  active: boolean;
  sortOrder: number;
  badge?: string; // e.g. "Popular", "Best Value", "Hot"
}

export type GamePackage = Package;

export interface Catalog {
  id: string;
  name: string; // e.g. "PC", "Mobile", "Xbox", "Mobile Game Cards", "Gift Cards"
  slug: string; // e.g. "pc", "mobile", "xbox", "mobile-game-cards"
  type: 'game' | 'card' | string; // Catalog domain: "game" or "card"
  description?: string;
  icon?: string;
  badge?: string; // e.g. "HOT", "POPULAR", "NEW"
  sortOrder: number;
  active: boolean;
  itemCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Game {
  id: string;
  slug: string;
  name: string;
  description: string;
  logoUrl: string;
  bannerUrl: string;
  instructions: string;
  featured: boolean;
  popular: boolean;
  active: boolean;
  sortOrder: number;
  fields: GameField[];
  inputFields?: any[];
  packages?: Package[];
  category?: any;
  catalogId?: string;
  catalogType?: 'game' | 'card' | string;
  catalogSlug?: string;
  deliveryTime?: string;
}

export interface PaymentMethod {
  id: string;
  code: 'esewa' | 'khalti' | 'fonepay' | 'imepay' | 'connectips' | 'bank' | 'card' | string;
  name: string;
  logoUrl?: string;
  accountName: string;
  accountIdentifier?: string; // wallet number, merchant id, bank acc
  accountNumber?: string;
  qrUrl?: string;
  qrCodeUrl?: string;
  instructions: string;
  active: boolean;
  sortOrder: number;
  badge?: string;
}

export type OrderStatus =
  | 'Pending Payment'
  | 'Payment Submitted'
  | 'Payment Under Review'
  | 'Payment Verified'
  | 'Top-up Processing'
  | 'Completed'
  | 'Rejected'
  | 'Cancelled'
  | 'Refund Requested'
  | 'Refunded'
  | 'Needs Manual Review';

export interface OrderTimelineEvent {
  status: OrderStatus;
  timestamp: string;
  note?: string;
  actor?: string;
}

export interface Order {
  id: string;
  orderNumber: string; // e.g. GZ-20260910-00123
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  gameId: string;
  gameName: string;
  gameLogo: string;
  packageId: string;
  packageName: string;
  playerInformation: Record<string, string>; // e.g. { playerId: "51239129" }
  originalAmount: number;
  discountAmount: number;
  promoCode?: string;
  finalAmount: number;
  paymentMethodId: string;
  paymentMethodName: string;
  status: OrderStatus;
  paymentProofUrl?: string;
  transactionId?: string;
  paymentSubmittedAmount?: number;
  customerNote?: string;
  adminNote?: string;
  customerFacingMessage?: string;
  isFlaggedDuplicate?: boolean;
  isNeedsReview?: boolean;
  timeline: OrderTimelineEvent[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number; // e.g. 10 (%) or 100 (NPR)
  discountPercentage?: number;
  minimumOrder?: number;
  minOrderAmount?: number;
  minSpend?: number;
  maximumDiscount?: number;
  maxDiscount?: number;
  description?: string;
  expiresAt?: string;
  usageLimit?: number;
  usedCount?: number;
  active: boolean;
}

export interface OfferBanner {
  id: string;
  title: string;
  description?: string;
  subtitle?: string;
  imageUrl?: string;
  bannerUrl?: string;
  link?: string;
  targetGameId?: string;
  discountText?: string;
  badge?: string;
  startDate?: string;
  endDate?: string;
  active: boolean;
  sortOrder?: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  orderId?: string;
  read: boolean;
  createdAt: string;
  type: 'order' | 'promo' | 'system';
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName?: string;
  customerName?: string;
  userEmail?: string;
  customerEmail?: string;
  userPhone?: string;
  customerPhone?: string;
  orderId?: string;
  orderNumber?: string;
  gameName?: string;
  subject: string;
  status: any;
  priority?: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  messages: any[];
}

export interface SupportMessage {
  id?: string;
  ticketId?: string;
  senderId?: string;
  senderName: string;
  senderRole: any;
  message: string;
  createdAt?: string;
  timestamp?: string;
}

export interface AuditLog {
  id: string;
  adminId?: string;
  adminName?: string;
  performedBy?: string;
  performedByName?: string;
  adminRole?: string;
  role?: string;
  action: string;
  targetType?: 'order' | 'game' | 'package' | 'payment_method' | 'promo' | 'setting' | 'user';
  targetId?: string;
  details: any;
  createdAt?: string;
  timestamp?: string;
}

export interface WebsiteSettings {
  websiteName?: string;
  siteName?: string;
  siteSubtitle?: string;
  contactEmail?: string;
  supportEmail?: string;
  supportPhone?: string;
  whatsappNumber?: string;
  supportWhatsApp?: string;
  whatsappLink?: string;
  telegramLink?: string;
  facebookLink?: string;
  currency?: string;
  currencySymbol?: string;
  orderProcessingNotice?: string;
  announcementBanner?: string;
  maintenanceMode?: boolean;
  minOrderAmount?: number;
  supportHours?: string;
  operatingHours?: string;
}

export type SiteSettings = WebsiteSettings;

export interface ChatbotTrigger {
  id: string;
  name: string; // Descriptive name (e.g. "Community Discord & WhatsApp", "Refund Policy")
  triggers: string[]; // Keywords or phrases that activate this trigger
  matchType: 'contains' | 'exact'; // Whether message must contain any trigger or exactly match
  reply: string; // The response message to send (supports bold and linebreaks)
  suggestions?: string[]; // Quick-reply suggestion chips offered to customer
  active: boolean; // Enable or disable this trigger rule
  priority: number; // Execution order (higher evaluated first)
  hitCount?: number; // Statistics on how many times this trigger fired
  createdAt: string;
  updatedAt: string;
}

export type ThemeMode = 'dark' | 'light' | 'system';
export type ResolvedTheme = 'dark' | 'light';

export interface ServerAdminVerificationResult {
  allowed: boolean;
  reason?: 'UNAUTHENTICATED' | 'CUSTOMER_FORBIDDEN' | 'INSUFFICIENT_PERMISSIONS' | 'ACCOUNT_SUSPENDED' | 'SERVER_ERROR';
  message: string;
  userRole?: UserRole;
  user?: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    status: string;
    photoUrl?: string;
  };
  attemptedTab?: string;
  requiredRoles?: UserRole[];
  allowedTabs?: string[];
  verifiedAt?: string;
}
