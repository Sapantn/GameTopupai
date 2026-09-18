import { GoogleGenAI } from '@google/genai';
import { db } from './db';

let aiClient: GoogleGenAI | null = null;

function getAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export interface ChatMessageParam {
  role: 'user' | 'model' | 'assistant';
  text: string;
}

export interface ChatBotResponse {
  reply: string;
  orderInfo?: {
    id: string;
    status: string;
    gameName: string;
    amount: number;
    paymentMethod: string;
  };
  suggestions?: string[];
}

/**
 * Intelligent fallback generator when GEMINI_API_KEY is not configured
 * or when the remote Gemini API endpoint encounters a transient issue.
 */
function generateFallbackResponse(
  message: string,
  games: any[],
  paymentMethods: any[],
  settings: any,
  foundOrder?: any
): ChatBotResponse {
  const lower = message.toLowerCase().trim();

  // 1. Order Status Query
  if (foundOrder) {
    return {
      reply: `📦 **Order Found: #${foundOrder.id}**\n\n` +
        `• **Game/Item:** ${foundOrder.gameName} - ${foundOrder.packageName}\n` +
        `• **Status:** **${foundOrder.status.toUpperCase()}**\n` +
        `• **Amount:** NPR ${foundOrder.finalAmount}\n` +
        `• **Payment Gateway:** ${foundOrder.paymentMethodName}\n` +
        `• **Submitted:** ${new Date(foundOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}\n\n` +
        (foundOrder.status?.toLowerCase() === 'completed'
          ? '✅ Your top-up has been successfully delivered to your in-game account! Check your in-game mail/inventory.'
          : foundOrder.status?.toLowerCase() === 'processing'
          ? '⚡ Our Kathmandu operations team is actively delivering your order right now. Expected delivery in 2–5 minutes.'
          : '⏳ Your payment proof is queued for verification. Standard delivery is 5–15 minutes during operating hours (8:00 AM – 11:30 PM NST).'),
      orderInfo: {
        id: foundOrder.id,
        status: foundOrder.status,
        gameName: foundOrder.gameName,
        amount: foundOrder.finalAmount,
        paymentMethod: foundOrder.paymentMethodName,
      },
      suggestions: ['Check another order', 'Popular games', 'Contact human support']
    };
  }

  // 2. PUBG Mobile / UC
  if (lower.includes('pubg') || lower.includes('uc') || lower.includes('unknown cash')) {
    return {
      reply: `🎯 **PUBG Mobile UC Top-Up in Nepal (NPR)**\n\n` +
        `We provide instant Player ID top-ups for PUBG Mobile Unknown Cash (UC):\n\n` +
        `• **Available Bundles:** 60 UC, 325 UC, 660 UC, 1800 UC, 3850 UC & Royale Pass.\n` +
        `• **Required Details:** Only your numeric **Player ID** and **In-game Character Name** (no password required!).\n` +
        `• **Payment:** Pay in NPR via eSewa, Khalti, Fonepay QR, or IME Pay.\n` +
        `• **Delivery Speed:** Verified & credited directly to your account in **5 to 15 minutes**!\n\n` +
        `👉 Visit the **PUBG Mobile** store card on our homepage to select your UC bundle.`,
      suggestions: ['Show PUBG packages', 'Payment methods', 'Track an order']
    };
  }

  // 3. Free Fire / Diamonds
  if (lower.includes('free fire') || lower.includes('ff') || lower.includes('diamond')) {
    return {
      reply: `💎 **Garena Free Fire Diamonds Top-Up**\n\n` +
        `Get direct in-game diamonds at official Nepal rates:\n\n` +
        `• **Packages:** 100 💎, 310 💎, 520 💎, 1060 💎, Weekly Membership & Monthly VIP Membership.\n` +
        `• **Requirements:** Your **Player ID / UID**.\n` +
        `• **Delivery:** Within **5–10 minutes** of payment verification.\n\n` +
        `Select Free Fire from our Games catalog to place your order!`,
      suggestions: ['Free Fire packages', 'How to pay via eSewa', 'Track order']
    };
  }

  // 4. Mobile Legends (MLBB)
  if (lower.includes('mlbb') || lower.includes('mobile legends')) {
    return {
      reply: `⚔️ **Mobile Legends: Bang Bang (MLBB)**\n\n` +
        `Top up MLBB Diamonds and Twilight Pass instantly in Nepal:\n\n` +
        `• **Required:** Your **User ID** and 4-digit **Zone ID** (found in your MLBB avatar profile).\n` +
        `• **Packages:** 86 to 6000+ Diamonds, Weekly Diamond Pass.\n` +
        `• **Delivery:** Processed in 5–15 minutes.`,
      suggestions: ['MLBB Packages', 'Payment options', 'Order help']
    };
  }

  // 5. Payment Methods
  if (lower.includes('payment') || lower.includes('pay') || lower.includes('esewa') || lower.includes('khalti') || lower.includes('fonepay') || lower.includes('bank') || lower.includes('ime')) {
    const activeGateways = paymentMethods.map(p => `• **${p.name}** (${p.accountIdentifier})`).join('\n');
    return {
      reply: `💳 **Accepted Payment Gateways in Nepal**\n\n` +
        `We accept 100% genuine local Nepal payments in **NPR**:\n\n` +
        activeGateways + '\n\n' +
        `**How to Pay:**\n` +
        `1. Choose your game & package.\n` +
        `2. Scan the displayed official Merchant QR or send money to our verified wallet.\n` +
        `3. Take a screenshot of the completed transfer.\n` +
        `4. Attach the screenshot and enter the 16-digit Reference Code in checkout.\n\n` +
        `*Note: We do not accept cryptocurrency.*`,
      suggestions: ['How does delivery work?', 'PUBG Mobile UC', 'Track an order']
    };
  }

  // 6. How it works / Delivery Time
  if (lower.includes('how') || lower.includes('work') || lower.includes('delivery') || lower.includes('time') || lower.includes('safe') || lower.includes('legit')) {
    return {
      reply: `⚡ **How GamingZone Nepal Works & Delivery Speed**\n\n` +
        `1. **Choose Product:** Select your game (PUBG, Free Fire, MLBB, Roblox, Steam, etc.).\n` +
        `2. **Enter Game ID:** Provide your numeric Player ID or Username (we **never** ask for your password).\n` +
        `3. **Pay in NPR:** Send exact NPR via eSewa, Khalti, Fonepay QR, or Mobile Banking.\n` +
        `4. **Submit Proof:** Upload the transaction receipt screenshot and Reference ID.\n` +
        `5. **Instant Delivery:** Our Kathmandu operations team verifies and credits your account within **5 to 15 minutes**!\n\n` +
        `🕒 **Operating Hours:** ${settings.operatingHours || '8:00 AM – 11:30 PM NST (7 Days a Week)'}`,
      suggestions: ['Check payment methods', 'Check my order', 'Browse all games']
    };
  }

  // 7. Track Order / Status
  if (lower.includes('track') || lower.includes('status') || lower.includes('where is my order') || lower.includes('ord-')) {
    return {
      reply: `🔍 **Looking for your order status?**\n\n` +
        `Please share your **Order ID** (for example: \`ORD-1001\` or the 12-digit code received upon checkout) or your registered Nepal phone number.\n\n` +
        `You can also click the **"Track Order"** button in the top navigation bar at any time to inspect your live status timeline and receipt.`,
      suggestions: ['Track order now', 'Delivery times', 'Customer support']
    };
  }

  // 8. Contact human support
  if (lower.includes('human') || lower.includes('agent') || lower.includes('support') || lower.includes('contact') || lower.includes('phone') || lower.includes('email') || lower.includes('help')) {
    return {
      reply: `📞 **Need Human Assistance?**\n\n` +
        `Our Kathmandu support team is standing by:\n\n` +
        `• **Phone / WhatsApp:** ${settings.supportPhone || '+977 9841000001'}\n` +
        `• **Support Email:** ${settings.supportEmail || 'support@gamingzone.np'}\n` +
        `• **Support Ticket:** You can open an official ticket in the **Support** page.\n` +
        `• **Operating Hours:** ${settings.operatingHours || '8:00 AM – 11:30 PM NST'}\n\n` +
        `How can I assist you in the meantime?`,
      suggestions: ['Browse games', 'Payment methods', 'Check order status']
    };
  }

  // 9. Greeting / General
  return {
    reply: `👋 **Namaste! Welcome to GamingZone Nepal AI Assistant.**\n\n` +
      `I can help you with:\n` +
      `• **Top-up Packages & Prices:** PUBG UC, Free Fire Diamonds, MLBB, Roblox, Genshin Impact\n` +
      `• **Nepal Payment Gateways:** eSewa, Khalti, Fonepay QR, IME Pay & Bank Transfer\n` +
      `• **Order Tracking:** Check the live status of any order with your Order ID\n` +
      `• **Store Policies & Delivery Times:** (Average delivery 5–15 minutes)\n\n` +
      `What would you like assistance with today?`,
    suggestions: ['🔥 Buy PUBG UC', '💎 Free Fire Diamonds', '💳 Payment Methods', '📦 Track an Order']
  };
}

/**
 * Handle incoming chat queries with Gemini 3.8 Flash (server-side),
 * enriched with live store data and graceful fallbacks.
 */
export async function handleChatMessage(params: {
  message: string;
  history?: ChatMessageParam[];
  userId?: string;
}): Promise<ChatBotResponse> {
  const { message, history = [] } = params;
  const cleanMessage = (message || '').trim();

  if (!cleanMessage) {
    return {
      reply: 'Please provide a question or message so I can assist you!',
      suggestions: ['How to buy UC?', 'Payment methods', 'Track order']
    };
  }

  // Fetch real store context from database
  const games = db.getGames(false);
  const paymentMethods = db.getPaymentMethods(false);
  const settings = db.getSettings();

  // Check if message contains an Order ID reference (e.g. ORD-1001, ord-1789...)
  let foundOrder: any = undefined;
  const orderIdMatch = cleanMessage.match(/ORD-[\w-]+/i);
  if (orderIdMatch) {
    const rawOrderId = orderIdMatch[0].toUpperCase();
    const orders = db.getOrders();
    foundOrder = orders.find(
      o => o.id.toUpperCase() === rawOrderId || o.id.toUpperCase().includes(rawOrderId)
    );
  }

  // 1. Check if message triggers any Admin-configured custom response rule
  const matchedTrigger = db.findMatchingTrigger(cleanMessage);
  if (matchedTrigger && !foundOrder) {
    db.recordTriggerHit(matchedTrigger.id);
    return {
      reply: matchedTrigger.reply,
      suggestions: matchedTrigger.suggestions && matchedTrigger.suggestions.length > 0
        ? matchedTrigger.suggestions
        : ['Browse Games', 'Nepal Payment Methods', 'Track Order']
    };
  }

  const ai = getAIClient();

  // If no Gemini client is available, use our high-accuracy fallback
  if (!ai) {
    return generateFallbackResponse(cleanMessage, games, paymentMethods, settings, foundOrder);
  }

  try {
    // Build context-rich system prompt for Gemini
    const gamesSummary = games
      .slice(0, 12)
      .map(g => `${g.name} (${g.category}) - ${g.description || 'Instant top-up'}`)
      .join('\n');

    const paymentSummary = paymentMethods
      .map(p => `${p.name}: ${p.accountIdentifier || p.accountName}`)
      .join('\n');

    const orderContext = foundOrder
      ? `\nCURRENT ORDER MATCHED:
ID: ${foundOrder.id}
Game: ${foundOrder.gameName} (${foundOrder.packageName})
Status: ${foundOrder.status}
Final Amount: NPR ${foundOrder.finalAmount}
Payment Gateway: ${foundOrder.paymentMethodName}
Created At: ${foundOrder.createdAt}`
      : '';

    const activeRules = db.getChatbotTriggers(true);
    const customRulesContext = activeRules.length > 0
      ? `\nADMIN CONFIGURED STORE POLICIES & SPECIAL RESPONSES:\n` +
        activeRules.slice(0, 10).map(r => `• Trigger [${r.triggers.join(', ')}]: "${r.reply.replace(/\n/g, ' ')}"`).join('\n')
      : '';

    const systemInstruction = `You are "ZoneBot", the friendly, expert AI gaming assistant for GamingZone Top-up Center (gamingzone.np) in Nepal.
Your role is to help gamers with top-ups, game currency packages, local Nepal payment methods, and order tracking.

STORE KNOWLEDGE:
- Store Name: GamingZone Nepal
- Operating Hours: ${settings.operatingHours || '8:00 AM – 11:30 PM NST (Kathmandu time, 7 days a week)'}
- Delivery SLA: 5 to 15 minutes manual delivery by the Kathmandu operations team after payment receipt verification.
- Currency: All prices and transactions are strictly in Nepalese Rupee (NPR).
- Accepted Payment Gateways:
${paymentSummary}
- Cryptocurrencies (USDT, Bitcoin, etc.) are STRICTLY NOT accepted.
- Available Games & Products:
${gamesSummary}
${orderContext}
${customRulesContext}

HOW ORDERING WORKS:
1. Customer selects a game and chooses a currency/item package.
2. Customer enters their Player ID / In-Game ID / Zone ID (we NEVER ask for passwords!).
3. Customer transfers exact NPR via eSewa, Khalti, Fonepay QR, or Mobile Banking.
4. Customer uploads screenshot proof and enters the Reference ID / Transaction code.
5. Our staff verifies and delivers the currency directly to their game within 5–15 minutes.

GUIDELINES:
- Keep answers concise, gamer-friendly, clear, and structured with bullet points and bold text where helpful.
- If asked about an order, reference the order details if provided in the context above.
- Never make up fake payment account numbers; tell them to view the official checkout page for current QR codes.
- Speak enthusiastically and respectfully. Nepali gamers frequently say "Namaste", "Bro", or ask in simple English/Nepali. Respond helpfully in English (with occasional polite Nepali greetings like "Namaste").`;

    // Map conversation history
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    // Limit history to last 6 turns to keep context fast and focused
    const recentHistory = history.slice(-6);
    for (const item of recentHistory) {
      const role = item.role === 'model' || item.role === 'assistant' ? 'model' : 'user';
      if (item.text && item.text.trim()) {
        contents.push({
          role,
          parts: [{ text: item.text.trim() }],
        });
      }
    }

    // Append current user message
    contents.push({
      role: 'user',
      parts: [{ text: cleanMessage }],
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AI generation timed out')), 5000)
    );

    const response = await Promise.race([
      ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      }),
      timeoutPromise
    ]);

    const text = response.text || '';
    if (!text.trim()) {
      return generateFallbackResponse(cleanMessage, games, paymentMethods, settings, foundOrder);
    }

    return {
      reply: text.trim(),
      orderInfo: foundOrder
        ? {
            id: foundOrder.id,
            status: foundOrder.status,
            gameName: foundOrder.gameName,
            amount: foundOrder.finalAmount,
            paymentMethod: foundOrder.paymentMethodName,
          }
        : undefined,
      suggestions: [
        'How do I pay with eSewa?',
        'PUBG Mobile UC prices',
        'Track my order',
        'Delivery time guarantee'
      ]
    };
  } catch (error) {
    console.error('Gemini Chatbot API error, falling back to local responder:', error);
    return generateFallbackResponse(cleanMessage, games, paymentMethods, settings, foundOrder);
  }
}
