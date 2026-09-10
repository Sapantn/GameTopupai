import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { Game, Package, PaymentMethod, PromoCode } from '../types';
import {
  Gamepad2,
  HelpCircle,
  CheckCircle2,
  QrCode,
  Copy,
  Upload,
  AlertCircle,
  Clock,
  ShieldCheck,
  Zap,
  ArrowRight,
  Sparkles,
  Flame,
  Check,
  Tag,
  Info,
  ChevronLeft
} from 'lucide-react';

export const GameDetailPage: React.FC = () => {
  const { selectedGame, setView, user, addToast, navigateToOrder } = useApp();

  const [game, setGame] = useState<Game | null>(selectedGame);
  const [packages, setPackages] = useState<Package[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);

  // Dynamic player input fields
  const [playerInfo, setPlayerInfo] = useState<Record<string, string>>({});
  const [customerPhone, setCustomerPhone] = useState(user?.phone || '');
  const [customerEmail, setCustomerEmail] = useState(user?.email || '');

  // Promo Code
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [validatingPromo, setValidatingPromo] = useState(false);

  // Payment Proof
  const [transactionId, setTransactionId] = useState('');
  const [paymentProofBase64, setPaymentProofBase64] = useState<string>('');
  const [customerNote, setCustomerNote] = useState('');
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [copiedAccount, setCopiedAccount] = useState(false);

  // Helper Guide Accordion
  const [showIdGuide, setShowIdGuide] = useState(false);

  // Completed Order Modal
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  useEffect(() => {
    if (!game) {
      setView('games');
      return;
    }

    const loadData = async () => {
      try {
        const [pkgs, pmMethods] = await Promise.all([
          api.getPackages(game.id),
          api.getPaymentMethods()
        ]);
        setPackages(pkgs);
        if (pkgs.length > 0) {
          setSelectedPackage(pkgs[0]);
        }
        setPaymentMethods(pmMethods);
        if (pmMethods.length > 0) {
          setSelectedPaymentMethod(pmMethods[0]);
        }

        // Initialize empty player fields
        const initialInfo: Record<string, string> = {};
        const fieldsToInit = (game.fields || (game as any).playerFields || (game as any).inputFields || []);
        fieldsToInit.forEach((f: any) => {
          const key = f.fieldName || f.name || 'playerId';
          initialInfo[key] = '';
        });
        setPlayerInfo(initialInfo);
      } catch (err) {
        console.error(err);
      }
    };
    loadData();
  }, [game]);

  if (!game) return null;

  // Pricing calculations
  const basePrice = selectedPackage ? selectedPackage.price : 0;
  const discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
  const finalAmount = Math.max(0, basePrice - discountAmount);

  // Handle promo code
  const handleApplyPromo = async () => {
    if (!promoCodeInput.trim() || !selectedPackage) return;
    setValidatingPromo(true);
    setPromoError(null);
    try {
      const res = await api.validatePromoCode(promoCodeInput.trim(), basePrice);
      if (res.valid) {
        setAppliedPromo(res);
        addToast(`Promo code applied! Saved NPR ${res.discountAmount}`, 'success');
      } else {
        setPromoError(res.message);
        setAppliedPromo(null);
      }
    } catch (err: any) {
      setPromoError('Failed to validate promo code');
    } finally {
      setValidatingPromo(false);
    }
  };

  const handleCopyAccount = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAccount(true);
    addToast('Account number copied to clipboard', 'info');
    setTimeout(() => setCopiedAccount(false), 2500);
  };

  // Screenshot image handler
  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      addToast('File too large. Please upload an image under 8MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPaymentProofBase64(reader.result as string);
      addToast('Payment proof screenshot attached', 'info');
    };
    reader.readAsDataURL(file);
  };

  // Order Submission
  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPackage) {
      addToast('Please select a top-up package', 'error');
      return;
    }

    // Validate player fields
    const fieldsToValidate = (game.fields || (game as any).playerFields || (game as any).inputFields || []);
    for (const field of fieldsToValidate as any[]) {
      const key = field.fieldName || field.name || 'playerId';
      if (field.required && !playerInfo[key]?.trim()) {
        addToast(`Please fill out ${field.label}`, 'error');
        return;
      }
    }

    if (!selectedPaymentMethod) {
      addToast('Please choose a payment method', 'error');
      return;
    }

    if (!transactionId.trim()) {
      addToast('Please enter the Transaction Code / Reference ID from your payment app', 'error');
      return;
    }

    if (!paymentProofBase64) {
      addToast('Please attach the payment screenshot proof', 'error');
      return;
    }

    setSubmittingOrder(true);
    try {
      // 1. Create order
      const newOrder = await api.createOrder({
        userId: user?.id || 'usr-guest-' + Date.now(),
        customerName: user?.name || 'Nepal Gamer',
        customerPhone: customerPhone || '+977 9800000000',
        customerEmail: customerEmail || 'guest@gamingzone.com.np',
        gameId: game.id,
        gameName: game.name,
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        packagePrice: selectedPackage.price,
        promoCode: appliedPromo ? appliedPromo.promoCode.code : undefined,
        discountAmount: discountAmount,
        finalAmount: finalAmount,
        playerInformation: playerInfo,
        paymentMethodId: selectedPaymentMethod.id,
        paymentMethodName: selectedPaymentMethod.name
      });

      // 2. Submit payment screenshot and reference
      const finalizedOrder = await api.submitPayment(newOrder.id, {
        transactionId: transactionId.trim(),
        paymentSubmittedAmount: finalAmount,
        paymentProofUrl: paymentProofBase64,
        customerNote: customerNote.trim() || undefined
      });

      setCreatedOrder(finalizedOrder);
      addToast('Top-up order submitted! Our team will verify it in 5-15 mins.', 'success');
    } catch (err: any) {
      addToast(err.message || 'Failed to submit order', 'error');
    } finally {
      setSubmittingOrder(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Back button */}
      <div>
        <button
          onClick={() => setView('games')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Back to All Games</span>
        </button>
      </div>

      {/* Game Header Banner */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-[#0f1220] shadow-2xl">
        <div className="h-44 sm:h-64 w-full relative overflow-hidden">
          <img
            src={game.bannerUrl}
            alt={game.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0f1220] via-[#0f1220]/60 to-transparent" />
        </div>

        <div className="p-6 sm:p-8 -mt-16 sm:-mt-20 relative z-10 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-6">
          <div className="flex items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-cyan-500/70 bg-[#0a0c14] overflow-hidden shadow-xl p-1 shrink-0">
              <img
                src={game.logoUrl}
                alt={game.name}
                className="w-full h-full object-cover rounded-xl"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-500/40 text-[10px] font-bold uppercase tracking-wider">
                  {game.category}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-cyan-400" />
                  100% Safe Top-Up
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-heading font-extrabold text-white">
                {game.name}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                {game.description}
              </p>
            </div>
          </div>

          <div className="bg-[#141829] border border-slate-700/80 rounded-2xl p-4 text-right shrink-0 w-full sm:w-auto">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest block">
              Average Delivery Time
            </span>
            <p className="font-heading font-bold text-lg text-emerald-400 flex items-center justify-end gap-1.5">
              <Clock className="w-4 h-4" />
              <span>5 – 15 Minutes</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Order Workflow Form */}
      <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Steps 1, 2, 3 */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* STEP 1: Select Package */}
          <div className="bg-[#111424] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-cyan-500 text-black font-heading font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <h3 className="text-lg font-heading font-bold text-white">
                  Select Top-Up Package
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                {packages.length} Packages available
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {packages.map((pkg) => {
                const isSelected = selectedPackage?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      if (appliedPromo) {
                        setAppliedPromo(null);
                        setPromoCodeInput('');
                      }
                    }}
                    className={`relative p-3.5 rounded-xl cursor-pointer transition-all border flex flex-col justify-between ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500 shadow-lg shadow-cyan-500/15'
                        : 'bg-[#141829] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {/* Badge */}
                    {pkg.badge && (
                      <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-red-500 text-black text-[9px] font-bold uppercase tracking-wider shadow">
                        {pkg.badge}
                      </span>
                    )}

                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {pkg.name}
                        </h4>
                        {isSelected && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {pkg.amount}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-baseline justify-between">
                      <div>
                        {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                          <span className="text-[10px] text-slate-500 line-through mr-1 font-gaming">
                            NPR {pkg.originalPrice}
                          </span>
                        )}
                        <span className="font-gaming font-bold text-sm text-cyan-400">
                          NPR {pkg.price}
                        </span>
                      </div>
                      {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                        <span className="text-[9px] text-emerald-400 font-semibold">
                          -{Math.round(((pkg.originalPrice - pkg.price) / pkg.originalPrice) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* STEP 2: Player Information */}
          <div className="bg-[#111424] rounded-2xl border border-slate-800 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-lg bg-cyan-500 text-black font-heading font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <h3 className="text-lg font-heading font-bold text-white">
                  Enter Player Information
                </h3>
              </div>
              
              <button
                type="button"
                onClick={() => setShowIdGuide(!showIdGuide)}
                className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>How to find ID?</span>
              </button>
            </div>

            {/* Helper Guide Accordion */}
            {showIdGuide && (
              <div className="p-4 rounded-xl bg-cyan-950/20 border border-cyan-500/30 text-xs text-slate-300 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
                  <Info className="w-4 h-4" />
                  <span>Where to find your {game.name} Player ID:</span>
                </div>
                <p className="leading-relaxed">
                  {game.instructions ||
                    'Launch the game, tap on your profile avatar in the top-left or top-right corner. Look for your Character ID / UID and copy it directly. Never enter your account password!'}
                </p>
              </div>
            )}

            {/* Dynamic Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {((game.fields || (game as any).playerFields || (game as any).inputFields || []) as any[]).map((field: any) => {
                const key = field.fieldName || field.name || 'playerId';
                const fType = field.fieldType || field.type || 'text';
                return (
                  <div key={field.id || key}>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      {field.label} {field.required && <span className="text-rose-400">*</span>}
                    </label>

                    {fType === 'dropdown' && field.options ? (
                      <select
                        value={playerInfo[key] || ''}
                        onChange={(e) =>
                          setPlayerInfo({ ...playerInfo, [key]: e.target.value })
                        }
                        required={field.required}
                        className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">Select {field.label}</option>
                        {field.options.map((opt: string) => (
                          <option key={opt} value={opt}>
                            {opt}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={fType === 'number' ? 'number' : 'text'}
                        value={playerInfo[key] || ''}
                        onChange={(e) =>
                          setPlayerInfo({ ...playerInfo, [key]: e.target.value })
                        }
                        placeholder={field.placeholder || `Enter ${field.label}`}
                        required={field.required}
                        className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Contact Phone for Order Updates */}
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Nepal Mobile Number (For SMS &amp; WhatsApp status)
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="+977 98XXXXXXXX"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Email Receipt Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="your.email@gmail.com"
                  className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
          </div>

          {/* STEP 3: Payment Method & QR Instructions */}
          <div className="bg-[#111424] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-lg">
            <div className="flex items-center gap-3">
              <span className="w-7 h-7 rounded-lg bg-cyan-500 text-black font-heading font-bold text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="text-lg font-heading font-bold text-white">
                  Manual Nepal Payment Transfer
                </h3>
                <p className="text-xs text-slate-400">
                  Scan QR code or transfer to our account, then submit your transaction code.
                </p>
              </div>
            </div>

            {/* Payment Method Selector Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {paymentMethods.map((pm) => {
                const isSelected = selectedPaymentMethod?.id === pm.id;
                return (
                  <div
                    key={pm.id}
                    onClick={() => setSelectedPaymentMethod(pm)}
                    className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center gap-3 ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-[#141829] border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-lg bg-black/50 p-1 flex items-center justify-center shrink-0 border border-slate-800">
                      <img
                        src={pm.logoUrl}
                        alt={pm.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-xs font-bold text-white truncate">
                        {pm.name}
                      </h4>
                      <p className="text-[10px] text-slate-400">Manual Verification</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Method Details & QR Code */}
            {selectedPaymentMethod && (
              <div className="rounded-2xl bg-[#0c0e1a] border border-cyan-500/30 p-5 space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* QR Code Container */}
                  <div className="w-40 h-40 rounded-2xl bg-white p-2.5 shadow-2xl shrink-0 flex items-center justify-center">
                    <img
                      src={selectedPaymentMethod.qrCodeUrl}
                      alt={`${selectedPaymentMethod.name} QR Code`}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  {/* Account Information */}
                  <div className="space-y-3 flex-1 text-center sm:text-left">
                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        Account Holder / Merchant Name
                      </span>
                      <p className="font-heading font-bold text-sm text-white">
                        {selectedPaymentMethod.accountName}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                        Wallet / Account Number
                      </span>
                      <div className="flex items-center justify-center sm:justify-start gap-2 mt-0.5">
                        <span className="font-mono font-bold text-base text-cyan-300 bg-cyan-950/60 px-2.5 py-1 rounded-lg border border-cyan-500/30">
                          {selectedPaymentMethod.accountNumber}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyAccount(selectedPaymentMethod.accountNumber)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
                          title="Copy Account Number"
                        >
                          {copiedAccount ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <strong className="text-cyan-400">Transfer Instructions:</strong> {selectedPaymentMethod.instructions}
                    </div>
                  </div>
                </div>

                {/* Amount to transfer banner */}
                <div className="p-3 rounded-xl bg-gradient-to-r from-cyan-950 to-blue-950 border border-cyan-500/40 flex items-center justify-between">
                  <span className="text-xs text-slate-200">
                    Exact Amount to Transfer:
                  </span>
                  <span className="font-gaming font-bold text-lg text-white">
                    NPR {finalAmount}
                  </span>
                </div>
              </div>
            )}

            {/* STEP 4: Submit Payment Proof & Transaction ID */}
            <div className="pt-2 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-gaming">
                Submit Payment Details &amp; Screenshot
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Transaction ID */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Transaction Code / Reference ID <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 78249012 or REF-981245"
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                    required
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Found in your payment receipt from eSewa, Khalti, or Bank.
                  </p>
                </div>

                {/* Customer Note */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Customer Note (Optional)
                  </label>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder="e.g. Please process quickly before match"
                    className="w-full bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              {/* Upload Screenshot */}
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Upload Payment Confirmation Screenshot <span className="text-rose-400">*</span>
                </label>
                
                <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500/50 rounded-2xl p-4 text-center cursor-pointer bg-[#141829] relative transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleScreenshotChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {paymentProofBase64 ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={paymentProofBase64}
                        alt="Proof preview"
                        className="w-16 h-16 object-cover rounded-xl border border-cyan-500/40"
                      />
                      <div className="text-left">
                        <p className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Screenshot Attached Successfully
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Click to replace image if needed
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-cyan-400 mx-auto" />
                      <p className="text-xs font-medium text-slate-200">
                        Drop payment screenshot here, or <span className="text-cyan-400 underline">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Supports PNG, JPG, or WEBP from your phone (Max 8MB)
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>

        {/* Right Column: Order Summary & Checkout Card */}
        <div className="space-y-6">
          <div className="sticky top-24 bg-[#111424] rounded-2xl border border-slate-800 p-6 space-y-6 shadow-2xl">
            <h3 className="font-heading font-bold text-white text-lg pb-3 border-b border-slate-800">
              Order Summary
            </h3>

            {/* Selected Game and Package */}
            <div className="flex items-center gap-3">
              <img
                src={game.logoUrl}
                alt={game.name}
                className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                referrerPolicy="no-referrer"
              />
              <div>
                <h4 className="text-xs font-bold text-white">{game.name}</h4>
                <p className="text-xs text-cyan-400 font-medium">
                  {selectedPackage ? selectedPackage.name : 'No package selected'}
                </p>
              </div>
            </div>

            {/* Player details overview */}
            <div className="p-3 rounded-xl bg-black/40 border border-slate-800/80 space-y-1.5 text-xs">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                Player Account
              </span>
              {((game.fields || (game as any).playerFields || (game as any).inputFields || []) as any[]).map((f: any) => {
                const key = f.fieldName || f.name || 'playerId';
                return (
                  <div key={f.id || key} className="flex justify-between text-slate-300">
                    <span className="text-slate-400">{f.label}:</span>
                    <span className="font-mono text-white font-medium">
                      {playerInfo[key] || '—'}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Promo Code Input */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Have a Promo Code?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. WELCOME50"
                  value={promoCodeInput}
                  onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#141829] border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 uppercase font-mono focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={validatingPromo || !promoCodeInput}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 disabled:opacity-50"
                >
                  {validatingPromo ? 'Checking...' : 'Apply'}
                </button>
              </div>
              {appliedPromo && (
                <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  Code {appliedPromo.promoCode.code} applied! Saved NPR {appliedPromo.discountAmount}
                </p>
              )}
              {promoError && (
                <p className="text-[11px] text-rose-400">{promoError}</p>
              )}
            </div>

            {/* Pricing Breakdown */}
            <div className="space-y-2 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span className="font-gaming font-semibold text-white">
                  NPR {basePrice}
                </span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount</span>
                  <span className="font-gaming font-semibold">
                    - NPR {discountAmount}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Payment Method</span>
                <span className="text-slate-200">
                  {selectedPaymentMethod?.name || 'eSewa'}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="font-heading font-bold text-white text-sm">
                  Total (NPR)
                </span>
                <span className="font-gaming font-extrabold text-xl text-cyan-400">
                  NPR {finalAmount}
                </span>
              </div>
            </div>

            {/* Anti-Fraud Disclaimer */}
            <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-[11px] text-amber-300/90 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Manual Verification:</strong> Submitting fake or duplicate transaction IDs will cause immediate order rejection.
              </span>
            </div>

            {/* Submit Order CTA */}
            <button
              type="submit"
              disabled={submittingOrder}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 text-black font-heading font-extrabold text-sm uppercase tracking-wider hover:brightness-110 shadow-lg shadow-cyan-500/25 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {submittingOrder ? (
                <>
                  <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Submitting Order...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Submit Top-Up Order</span>
                </>
              )}
            </button>
          </div>
        </div>

      </form>

      {/* Post-Submission Success Modal */}
      {createdOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-lg bg-[#0f121e] border border-cyan-500/40 rounded-3xl p-6 sm:p-8 space-y-6 text-center shadow-2xl animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <span className="text-xs uppercase font-bold tracking-widest text-cyan-400 font-gaming">
                Order Placed Successfully
              </span>
              <h3 className="text-2xl font-heading font-extrabold text-white">
                Payment Submitted!
              </h3>
              <p className="text-xs text-slate-300">
                Your order is now queued for manual verification by our team in Kathmandu.
              </p>
            </div>

            <div className="bg-[#141829] border border-slate-800 rounded-2xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-cyan-300">
                  {createdOrder.orderNumber}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Game &amp; Item:</span>
                <span className="text-white font-medium">
                  {createdOrder.gameName} • {createdOrder.packageName}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount Paid:</span>
                <span className="font-gaming font-bold text-white">
                  NPR {createdOrder.finalAmount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Reference Code:</span>
                <span className="font-mono text-purple-300">
                  {createdOrder.transactionId}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">Estimated Delivery:</span>
                <span className="text-emerald-400 font-bold">5 – 15 Mins</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => {
                  const id = createdOrder.id;
                  setCreatedOrder(null);
                  navigateToOrder(id);
                }}
                className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs uppercase tracking-wider transition-colors"
              >
                View Live Receipt &amp; Timeline
              </button>
              <button
                onClick={() => {
                  setCreatedOrder(null);
                  setView('home');
                }}
                className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
