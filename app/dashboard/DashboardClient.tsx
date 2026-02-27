"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";

// 👇 IMPORT YOUR LOCAL IMAGES FROM THE APP/CARD FOLDER
import card1 from "../card/1.jpeg";
import card2 from "../card/2.jpeg";
import card3 from "../card/3.jpeg";
import card4 from "../card/4.jpeg";

import { 
  buyCardAction, 
  logoutAction, 
  submitDepositProof, 
  fetchUserCards,
  fetchSecureInventory 
} from "./actions";

const MARKET_NAME = "American Market"; 

// ────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────
export type CardCategory = "visa" | "mastercard" | "american-express" | "discover" | "diners-club" | "jcb" | "maestro" | "unionpay";
export type VBVStatus = "vbv" | "non-vbv";
export type CardType = "credit" | "debit";

export interface Card {
  id: string;
  brand: CardCategory;
  bin: string;
  country: string;
  type: CardType;
  vbv: VBVStatus;
  balance: number;
  price: number;
  currency: string;
  status: "live" | "dead" | "sold";
  fullPan?: string;
  exp?: string;
  cvv?: string;
}

type Filters = {
  search: string;
  brand: CardCategory | "";
  country: string;
  vbv: VBVStatus | "";
  type: CardType | "";
  balance: string;
};

type SortConfig = {
  key: keyof Card;
  direction: "asc" | "desc";
};

// --- Icons & Assets ---
const BrandIcons: Record<string, JSX.Element> = {
  visa: <svg className="h-6 w-auto" viewBox="0 0 48 16" fill="none"><path d="M15.2 0L11.6 15.2H7.2L10.8 0H15.2Z" fill="#fff" /><path d="M30.4 0L26.8 15.2H22.4L25.9999 0H30.4Z" fill="#fff" /><path d="M44.8 0L41.2 15.2H36.8L40.4 0H44.8Z" fill="#fff" /><path d="M4 0L0.4 15.2H-4L-0.599976 0H4Z" fill="#fff" /></svg>,
  mastercard: <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><circle cx="18" cy="15" r="15" fill="#EB001B" /><circle cx="30" cy="15" r="15" fill="#F79E1B" /><circle cx="24" cy="15" r="15" fill="#FF5F00" opacity="0.7" /></svg>,
  "american-express": <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#0077CC" /><path d="M6 8H12M6 22H12M6 15H10" stroke="white" strokeWidth="2" /><text x="14" y="20" fill="white" fontSize="10" fontWeight="bold">AMEX</text></svg>,
  discover: <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#FF6600" /><text x="5" y="19" fill="white" fontSize="9" fontWeight="bold">DISCOVER</text></svg>,
};

// 4 Hardcoded Front-End Cards
const HARDCODED_CARDS = [
  { id: "tier-50", price: 50, balance: 250 },
  { id: "tier-100", price: 100, balance: 400 },
  { id: "tier-250", price: 250, balance: 800 },
  { id: "tier-500", price: 500, balance: 1250 },
];

const LOCAL_IMAGES = [card1, card2, card3, card4];

export default function DashboardClient({ initialBalance }: { initialBalance: number }) {
  const router = useRouter();
  const [userBalance, setUserBalance] = useState(initialBalance);
  
  // UI State
  const [activeTab, setActiveTab] = useState<"market" | "my_cards">("market");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedCardForPurchase, setSelectedCardForPurchase] = useState<Card | null>(null);
  
  const [notification, setNotification] = useState<{ message: string, type: 'success' | 'error' | 'info' } | null>(null);
  const [revealedCards, setRevealedCards] = useState<{ [key: string]: boolean }>({});
  const [selectedTierPrice, setSelectedTierPrice] = useState<number | null>(null);

  // Data State
  const [marketCards, setMarketCards] = useState<Card[]>([]);
  const [myCards, setMyCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Sorting
  const [page, setPage] = useState(1);
  const ITEMS_PER_PAGE = 10; 
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [filters, setFilters] = useState<Filters>({ search: "", brand: "", country: "", vbv: "", type: "", balance: "" });
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: "price", direction: "asc" });

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000); 
  };

  const loadMarket = useCallback(async () => {
    if (selectedTierPrice === null) return;
    setLoading(true);
    const activeFilters: Record<string, any> = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
    );
    activeFilters.price = selectedTierPrice;

    const result = await fetchSecureInventory({ 
        page, 
        pageSize: ITEMS_PER_PAGE, 
        filters: activeFilters,
        sort: sortConfig 
    });

    if (result.success && result.data) {
      setMarketCards(result.data as Card[]);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.totalItems || 0);
    } else {
      setMarketCards([]);
      setTotalPages(1);
      setTotalItems(0);
    }
    setLoading(false);
  }, [page, filters, sortConfig, selectedTierPrice]);

  const loadMyCards = useCallback(async () => {
    const result = await fetchUserCards();
    if (result.success && result.data) {
      setMyCards(result.data as Card[]);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "market" && selectedTierPrice !== null) {
        loadMarket();
    }
    if (activeTab === "my_cards") {
        loadMyCards();
    }
  }, [activeTab, selectedTierPrice, loadMarket, loadMyCards]);

  const handleGetStartedClick = (price: number) => {
      setSelectedTierPrice(price);
      setPage(1); 
  };

  const handleBuyClick = (card: Card) => {
    if (userBalance < card.price) {
        showNotification("Insufficient Balance. Please Deposit.", "error"); 
        setShowDepositModal(true);
        return;
    }
    setSelectedCardForPurchase(card);
  };

  const confirmPurchase = async () => {
    if (!selectedCardForPurchase) return;
    setLoading(true);
    const result = await buyCardAction(selectedCardForPurchase.id);
    setLoading(false);

    if (result.success) {
        showNotification("Purchase Successful! Card added to your inventory.", "success"); 
        if (typeof result.newBalance === 'number') setUserBalance(result.newBalance);
        setSelectedCardForPurchase(null);
        setSelectedTierPrice(null); 
        setActiveTab("my_cards");
        loadMyCards();
    } else {
        showNotification(result.error || "Failed to purchase.", "error"); 
    }
  };

  const handleLogout = async () => { await logoutAction(); };
  const resetFilters = () => { setFilters({ search: "", brand: "", country: "", vbv: "", type: "", balance: "" }); setPage(1); };
  const handleSort = (key: keyof Card) => setSortConfig((curr) => ({ key, direction: curr.key === key && curr.direction === "asc" ? "desc" : "asc" }));

  const toggleReveal = (id: string) => {
    setRevealedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    showNotification("Copied to clipboard!", "success"); 
  };

  const maskPan = (pan: string | undefined, bin: string) => {
    if (!pan || pan === "N/A" || pan === "DECRYPTION_ERROR" || pan === "CONFIG_ERROR") {
      return `${bin} **** **** ****`;
    }
    return `${pan.substring(0, 6)} ****** ${pan.slice(-4)}`;
  };

  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 pb-20">
      
      {/* 🟢 CUSTOM NOTIFICATION COMPONENT */}
      {notification && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
            <div className={`flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl border backdrop-blur-md font-medium text-sm ${
                notification.type === 'error' ? 'bg-red-950/80 border-red-500/30 text-red-200' : 
                notification.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200' : 
                'bg-indigo-950/80 border-indigo-500/30 text-indigo-200'
            }`}>
                {notification.type === 'error' && <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
                {notification.type === 'success' && <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {notification.type === 'info' && <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                {notification.message}
            </div>
        </div>
      )}

      {/* Dark Theme Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070')] bg-cover opacity-10 mix-blend-overlay" />
         <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 to-[#020617]" />
      </div>

      <div className="relative z-10">
        <Navbar balance={userBalance} onOpenDeposit={() => setShowDepositModal(true)} onLogout={handleLogout} />

        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-slate-800 pb-6">
            <div className="flex gap-4">
                <button onClick={() => { setActiveTab("market"); setSelectedTierPrice(null); }} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'market' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Marketplace</button>
                <button onClick={() => setActiveTab("my_cards")} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'my_cards' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>My Cards ({myCards.length})</button>
            </div>
          </div>

          {activeTab === "market" && (
            <div className="animate-in fade-in zoom-in-95 duration-500">
              
              {/* === VIEW 1: THE TIER CARDS (Images) === */}
              {selectedTierPrice === null ? (
                <>
                  <div className="text-center mb-12">
                      <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">Choose Your Card</h2>
                      <p className="text-slate-400 text-sm md:text-base">Select the perfect card tier to browse our verified inventory.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center max-w-6xl mx-auto">
                    {HARDCODED_CARDS.map((tier, index) => (
                        <div key={tier.id} className="flex flex-col w-full max-w-[280px] bg-[#0B101B] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl group transition-transform duration-300 hover:-translate-y-2">
                            
                            <div className="w-full text-center py-4 border-b border-slate-800/80 bg-slate-900/30">
                                <h3 className="text-xl font-bold text-white tracking-wide">Price: <span className="text-indigo-400">${tier.price}</span></h3>
                            </div>

                            <div className="relative w-full aspect-[1.58/1] bg-transparent pt-4 px-4 pb-2 border-b border-slate-800/80">
                                <Image 
                                    src={LOCAL_IMAGES[index] || LOCAL_IMAGES[0]} 
                                    alt={`Card Tier ${tier.price}`} 
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                    className="absolute inset-0 object-contain p-4"
                                />
                            </div>

                            <div className="p-5 flex flex-col relative z-10">
                                <div className="text-center mb-6">
                                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-1">Available Balance</p>
                                    <p className="text-emerald-400 text-3xl font-black tracking-tight">${tier.balance}</p>
                                </div>
                                <button 
                                    onClick={() => handleGetStartedClick(tier.price)}
                                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] uppercase tracking-wider text-sm"
                                >
                                    Get Started
                                </button>
                            </div>
                        </div>
                    ))}
                  </div>
                </>
              ) : (
                /* === VIEW 2: THE ACTUAL DATABASE INVENTORY FOR THE SELECTED PRICE === */
                <div className="animate-in fade-in slide-in-from-right-8 duration-300">
                  
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                      <div>
                          <button onClick={() => setSelectedTierPrice(null)} className="text-indigo-400 hover:text-indigo-300 text-sm font-bold flex items-center gap-2 mb-2 transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                              Back to Card Tiers
                          </button>
                          <h2 className="text-2xl font-black text-white">Cards priced at ${selectedTierPrice}</h2>
                      </div>
                      <div className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400 backdrop-blur-md">
                          <span className="block text-slate-500 mb-0.5">Total Inventory</span>
                          <span className="text-emerald-400 font-mono">{totalItems}</span>
                      </div>
                  </div>

                  {/* Filters for the DB search */}
                  <div className="mb-6 rounded-xl border border-slate-800 bg-[#0B101B]/90 p-3 shadow-xl backdrop-blur-md">
                    <div className="flex flex-col lg:flex-row items-center gap-2">
                        <div className="w-full lg:w-[30%]"><SearchInput placeholder="Search BIN..." value={filters.search} onChange={(v) => { setFilters(f => ({...f, search: v})); setPage(1); }} /></div>
                        <div className="w-full lg:w-[20%]"><InputWithIcon icon={<span>🏳️</span>} placeholder="Origin..." value={filters.country} onChange={(v) => { setFilters(f => ({...f, country: v})); setPage(1); }} /></div>
                        <div className="w-full lg:w-[40%] grid grid-cols-2 gap-2">
                            <SelectWithIcon icon={<span>💳</span>} value={filters.brand} onChange={(e) => { setFilters(f => ({...f, brand: e.target.value as CardCategory | ""})); setPage(1); }}><option value="">Any Network</option><option value="visa">Visa</option><option value="mastercard">Mastercard</option><option value="american-express">Amex</option></SelectWithIcon>
                            <SelectWithIcon icon={<span>🏷️</span>} value={filters.type} onChange={(e) => { setFilters(f => ({...f, type: e.target.value as CardType | ""})); setPage(1); }}><option value="">Any Type</option><option value="credit">Credit</option><option value="debit">Debit</option></SelectWithIcon>
                        </div>
                        <div className="w-full lg:w-[10%] h-10"><button onClick={resetFilters} className="h-full w-full rounded-lg border border-slate-800 bg-slate-900 text-slate-400 hover:text-white transition-all text-sm font-medium">Reset</button></div>
                    </div>
                  </div>

                  {/* Database Inventory Table */}
                  <div className="relative rounded-xl border border-slate-800 bg-[#0B101B]/80 shadow-2xl backdrop-blur-md min-h-[400px]">
                      {loading && <div className="absolute inset-0 bg-[#0B101B]/60 z-20 flex items-center justify-center backdrop-blur-sm"><div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                      
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[1000px] text-left text-sm">
                          <thead className="bg-[#0f1623] text-xs font-medium uppercase tracking-wider text-slate-500 border-b border-slate-800">
                            <tr>
                              <th className="px-6 py-5">Network / BIN</th>
                              <th className="px-6 py-5">Origin</th>
                              <th className="px-6 py-5">Type / Level</th>
                              <th className="px-6 py-5 text-right">Est. Balance</th>
                              <th className="px-6 py-5 text-right w-[160px]">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50">
                            {marketCards.map((card) => (
                              <tr key={card.id} className="group hover:bg-white/[0.02] transition-colors">
                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-4">
                                    <div className="flex h-10 w-14 items-center justify-center rounded bg-slate-900 p-1 border border-slate-800">{BrandIcons[card.brand] || <span className="text-slate-500 text-xs uppercase font-bold">{card.brand}</span>}</div>
                                    <span className="font-mono text-base text-slate-200 font-bold">{card.bin}******</span>
                                  </div>
                                </td>
                                <td className="px-6 py-4 text-slate-300 font-medium">{card.country || "International"}</td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 uppercase font-bold tracking-wider">{card.type}</span>
                                </td>
                                <td className="px-6 py-4 text-right"><span className="text-emerald-400 font-mono text-lg font-bold">${card.balance}</span></td>
                                <td className="px-6 py-4 text-right">
                                  <button 
                                      onClick={() => handleBuyClick(card)} 
                                      className="w-full bg-indigo-600 px-4 py-2.5 rounded-lg text-sm font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                                  >
                                      Buy Now
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {marketCards.length === 0 && !loading && <tr><td colSpan={5} className="p-16 text-center text-slate-500 text-lg">No cards available in this price tier right now.</td></tr>}
                          </tbody>
                        </table>
                      </div>

                      {/* DB Pagination */}
                      <div className="border-t border-slate-800 bg-[#0f1623]/50 px-6 py-4 flex items-center justify-between">
                          <div className="text-xs text-slate-500">Page {page} of {totalPages}</div>
                          <div className="flex gap-2">
                              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors">Prev</button>
                              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-xs font-bold transition-colors">Next</button>
                          </div>
                      </div>
                  </div>

                </div>
              )}
            </div>
          )}

          {activeTab === "my_cards" && (
            <div className="rounded-xl border border-slate-800 bg-[#0B101B]/80 shadow-2xl backdrop-blur-md overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="bg-[#0f1623] text-xs font-medium uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Brand</th>
                        <th className="px-6 py-4">Full PAN</th>
                        <th className="px-6 py-4">Expiry</th>
                        <th className="px-6 py-4">CVV</th>
                        <th className="px-6 py-4">Type</th> {/* ✅ ADDED TYPE HEADER */}
                        <th className="px-6 py-4">Country</th>
                        <th className="px-6 py-4 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {myCards.map((card) => {
                        const isRevealed = revealedCards[card.id];
                        const isDecryptionError = card.fullPan === "DECRYPTION_ERROR" || card.fullPan === "CONFIG_ERROR";
                        
                        return (
                        <tr key={card.id} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4"><div className="w-10">{BrandIcons[card.brand] || <span className="text-slate-500 capitalize">{card.brand}</span>}</div></td>
                          
                          {/* PAN COLUMN */}
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className={`font-mono tracking-wider font-bold ${isDecryptionError ? 'text-red-400' : 'text-emerald-400'}`}>
                                {isDecryptionError ? "Decryption Failed" : (isRevealed ? card.fullPan : maskPan(card.fullPan, card.bin))}
                              </span>
                              {!isDecryptionError && card.fullPan && card.fullPan !== "N/A" && (
                                <div className="flex gap-1">
                                  <button onClick={() => toggleReveal(card.id)} className="p-1.5 text-slate-500 hover:text-indigo-400 transition-colors" title={isRevealed ? "Hide Details" : "Reveal Details"}>
                                    {isRevealed ? (
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                    )}
                                  </button>
                                  {isRevealed && (
                                    <button onClick={() => handleCopy(card.fullPan!)} className="p-1.5 text-slate-500 hover:text-emerald-400 transition-colors" title="Copy PAN">
                                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-white">{card.exp || "12/28"}</td>
                          
                          {/* CVV COLUMN */}
                          <td className="px-6 py-4 font-mono text-indigo-400">
                             {!isDecryptionError ? (isRevealed ? card.cvv : "***") : "ERR"}
                          </td>
                          
                          {/* ✅ ADDED TYPE COLUMN */}
                          <td className="px-6 py-4">
                              <span className="px-2 py-1 rounded text-xs bg-slate-800 text-slate-300 uppercase font-bold tracking-wider">{card.type}</span>
                          </td>

                          <td className="px-6 py-4 text-slate-300">{card.country}</td>
                          <td className="px-6 py-4 text-right text-slate-500">${card.price}</td>
                        </tr>
                      )})}
                      {myCards.length === 0 && <tr><td colSpan={7} className="p-12 text-center text-slate-500">You haven't purchased any cards yet.</td></tr>}
                    </tbody>
                  </table>
                </div>
            </div>
          )}

        </div>
      </div>

      {selectedCardForPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#0B101B] border border-slate-800 rounded-2xl w-full max-w-sm shadow-2xl p-6 relative">
                <h3 className="text-xl font-bold text-white mb-4">Confirm Purchase</h3>
                <div className="space-y-3 mb-6 bg-[#151b2d] p-4 rounded-lg border border-slate-800">
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-500">BIN</span>
                        <span className="text-white font-mono font-bold text-lg">{selectedCardForPurchase.bin}******</span>
                    </div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Type</span><span className="text-white capitalize font-bold">{selectedCardForPurchase.brand} {selectedCardForPurchase.type}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Origin</span><span className="text-white font-bold">{selectedCardForPurchase.country}</span></div>
                    <div className="h-px bg-slate-700 my-2"></div>
                    <div className="flex justify-between text-sm items-center">
                        <span className="text-slate-400">Total Cost</span>
                        <span className="text-indigo-400 font-bold font-mono text-xl">${selectedCardForPurchase.price.toFixed(2)}</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setSelectedCardForPurchase(null)} className="py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition-colors">Cancel</button>
                    <button onClick={confirmPurchase} disabled={loading} className="py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-500/25 transition-all">{loading ? "Processing..." : "Confirm Buy"}</button>
                </div>
            </div>
        </div>
      )}

      {showDepositModal && (
        <DepositModal 
            onClose={() => setShowDepositModal(false)} 
            onNotify={(msg, type) => showNotification(msg, type)}
        />
      )}

    </main>
  );
}

function DepositModal({ onClose, onNotify }: { onClose: () => void, onNotify: (msg: string, type: 'success' | 'error') => void }) {
    const [amount, setAmount] = useState("");
    const [file, setFile] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const walletAddress = "TD5drdYXMjWpqJyi3xo9AQ3NfAYduBoRoU";

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = () => { setFile(reader.result as string); };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !file) { onNotify("Please enter amount and upload a screenshot.", "error"); return; }
        setSubmitting(true);
        const formData = new FormData();
        formData.append("amount", amount);
        formData.append("screenshot", file);
        const res = await submitDepositProof(formData);
        setSubmitting(false);
        if (res.success) { 
            onNotify("Deposit Submitted! Admin will verify shortly.", "success"); 
            onClose(); 
        } else { 
            onNotify("Error: " + res.error, "error"); 
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(walletAddress);
        onNotify("Wallet Address copied!", "success");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0B101B] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">✕</button>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-1">Deposit Funds</h3>
                    <p className="text-xs text-slate-500 mb-6">Send USDT (TRX) to the address below.</p>
                    <div className="bg-[#151b2d] p-4 rounded-lg border border-indigo-500/20 mb-6 relative group">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block mb-2">Official Wallet Address</label>
                        <div className="flex items-center justify-between gap-2">
                            <code className="text-xs sm:text-sm font-mono text-white break-all select-all">{walletAddress}</code>
                            <button onClick={copyToClipboard} className="p-2 bg-indigo-500/10 hover:bg-indigo-500/20 rounded text-indigo-400 transition-colors" title="Copy">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                            </button>
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div><label className="block text-xs font-medium text-slate-400 mb-1.5">Amount Sent (USD)</label><input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="100.00" className="w-full bg-[#0f1623] border border-slate-700 rounded-lg pl-8 pr-4 py-2.5 text-sm text-white focus:border-indigo-500 outline-none transition-all placeholder:text-slate-600" required /></div>
                        <div><label className="block text-xs font-medium text-slate-400 mb-1.5">Payment Screenshot</label><input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-xs text-slate-400 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-500/10 file:text-indigo-400 hover:file:bg-indigo-500/20 cursor-pointer" required /></div>
                        <button disabled={submitting} className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed">{submitting ? "Verifying..." : "I Have Sent Payment"}</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

function Navbar({ balance, onOpenDeposit, onLogout }: { balance: number, onOpenDeposit: () => void, onLogout: () => void }) {
  return (
    <nav className="border-b border-slate-800 bg-[#020617]/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="mx-auto max-w-[1400px] px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4"><span className="text-lg font-bold text-white">{MARKET_NAME}</span><span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-[10px] text-slate-400">V.3.1.0</span></div>
        <div className="flex items-center gap-4">
             <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-700/50 rounded-lg px-3 py-1.5"><div className="text-right"><p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Balance</p><p className="text-sm font-mono text-emerald-400 font-bold">${balance.toFixed(2)}</p></div><button onClick={onOpenDeposit} className="h-8 w-8 flex items-center justify-center bg-indigo-600 hover:bg-indigo-500 rounded text-white transition-colors"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg></button></div>
             <div className="h-6 w-px bg-slate-800"></div>
             <button onClick={onLogout} className="text-slate-400 hover:text-white text-xs font-medium flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 transition-all"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>Log Out</button>
        </div>
      </div>
    </nav>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string; }) {
  return (
    <div className="relative group h-10 w-full"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors"><svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" /></svg></div><input className="h-full w-full rounded-lg border border-slate-800 bg-slate-950/50 pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500/50" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></div>
  );
}

function InputWithIcon({ value, onChange, placeholder, icon }: { value: string; onChange: (v: string) => void; placeholder: string; icon: React.ReactNode }) {
    return (
      <div className="relative group h-10 w-full"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors">{icon}</div><input className="h-full w-full rounded-lg border border-slate-800 bg-slate-950/50 pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none transition-all focus:border-indigo-500 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500/50" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} /></div>
    );
}

function SelectWithIcon({ value, onChange, children, icon }: { value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; children: React.ReactNode; icon: React.ReactNode }) {
  return (
    <div className="relative group h-10 w-full"><div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500 group-focus-within:text-indigo-400 transition-colors">{icon}</div><select className="h-full w-full appearance-none rounded-lg border border-slate-800 bg-slate-950/50 pl-10 pr-8 text-sm text-white outline-none transition-all focus:border-indigo-500 focus:bg-slate-900 focus:ring-1 focus:ring-indigo-500/50" value={value} onChange={onChange}>{children}</select><div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400"><svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div></div>
  )
}