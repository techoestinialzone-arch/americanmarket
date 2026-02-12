"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  fetchSecureInventory, 
  buyCardAction, 
  logoutAction, 
  submitDepositProof, 
  fetchUserCards 
} from "./actions";

const MARKET_NAME = "Ameican Market"; 

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

const BrandIcons: Record<string, JSX.Element> = {
  visa: <svg className="h-6 w-auto" viewBox="0 0 48 16" fill="none"><path d="M15.2 0L11.6 15.2H7.2L10.8 0H15.2Z" fill="#fff" /><path d="M30.4 0L26.8 15.2H22.4L25.9999 0H30.4Z" fill="#fff" /><path d="M44.8 0L41.2 15.2H36.8L40.4 0H44.8Z" fill="#fff" /><path d="M4 0L0.4 15.2H-4L-0.599976 0H4Z" fill="#fff" /></svg>,
  mastercard: <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><circle cx="18" cy="15" r="15" fill="#EB001B" /><circle cx="30" cy="15" r="15" fill="#F79E1B" /><circle cx="24" cy="15" r="15" fill="#FF5F00" opacity="0.7" /></svg>,
  "american-express": <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#0077CC" /><path d="M6 8H12M6 22H12M6 15H10" stroke="white" strokeWidth="2" /><text x="14" y="20" fill="white" fontSize="10" fontWeight="bold">AMEX</text></svg>,
  discover: <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#FF6600" /><text x="5" y="19" fill="white" fontSize="9" fontWeight="bold">DISCOVER</text></svg>,
  "diners-club": <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#004B8D" /><text x="28" y="20" fill="white" fontSize="11" fontWeight="bold">DC</text></svg>,
  jcb: <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#003366" /><text x="14" y="20" fill="white" fontSize="12" fontWeight="bold">JCB</text></svg>,
  maestro: <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><circle cx="18" cy="15" r="15" fill="#0071BC" /><circle cx="30" cy="15" r="15" fill="#ED1C24" /></svg>,
  unionpay: <svg className="h-6 w-auto" viewBox="0 0 48 30" fill="none"><rect width="48" height="30" rx="4" fill="#D81E05" /><text x="8" y="20" fill="white" fontSize="12" fontWeight="bold">UP</text></svg>,
};

export default function DashboardClient({ initialBalance }: { initialBalance: number }) {
  const router = useRouter();
  const [userBalance, setUserBalance] = useState(initialBalance);
  
  // 🔒 LOCK LOGIC
  const isLocked = userBalance <= 0;

  // UI State
  const [activeTab, setActiveTab] = useState<"market" | "my_cards">("market");
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [selectedCardForPurchase, setSelectedCardForPurchase] = useState<Card | null>(null);

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

  // 1. Fetch Market Data (WITH FIX)
  const loadMarket = useCallback(async () => {
    setLoading(true);
    
    // ⬇️ CRITICAL FIX: Clean the filters object. 
    // Removes empty strings ("") so the server doesn't reject them as invalid Enum values.
    const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== "" && v !== null)
    );

    const result = await fetchSecureInventory({ 
        page, 
        pageSize: ITEMS_PER_PAGE, 
        filters: activeFilters, // 👈 Send cleaned filters
        sort: sortConfig 
    });

    if (result.success && result.data) {
      setMarketCards(result.data as Card[]);
      setTotalPages(result.pagination?.totalPages || 1);
      setTotalItems(result.pagination?.totalItems || 0);
    }
    setLoading(false);
  }, [page, filters, sortConfig]);

  // 2. Fetch My Cards
  const loadMyCards = useCallback(async () => {
    const result = await fetchUserCards();
    if (result.success && result.data) {
      setMyCards(result.data as Card[]);
    }
  }, []);

  // Initial Load & Tab Switching
  useEffect(() => {
    if (activeTab === "market") loadMarket();
    if (activeTab === "my_cards") loadMyCards();
  }, [activeTab, loadMarket, loadMyCards]);

  // Handlers
  const handleBuyClick = (card: Card) => {
    if (isLocked) {
        alert("Please deposit funds to unlock the marketplace.");
        setShowDepositModal(true);
        return;
    }
    if (userBalance < card.price) {
        alert("Insufficient Balance. Please Deposit.");
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
        alert("Purchase Successful!");
        if (typeof result.newBalance === 'number') setUserBalance(result.newBalance);
        setSelectedCardForPurchase(null);
        setActiveTab("my_cards"); // Switch to My Cards
        loadMyCards(); // Reload bought cards
    } else {
        alert("Error: " + result.error);
    }
  };

  const handleLogout = async () => { await logoutAction(); };
  const handleSort = (key: keyof Card) => setSortConfig((curr) => ({ key, direction: curr.key === key && curr.direction === "asc" ? "desc" : "asc" }));
  const resetFilters = () => { setFilters({ search: "", brand: "", country: "", vbv: "", type: "", balance: "" }); setSortConfig({ key: "price", direction: "asc" }); setPage(1); };
  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  return (
    <main className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      <div className="fixed inset-0 z-0 pointer-events-none">
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070')] bg-cover opacity-10 mix-blend-overlay" />
         <div className="absolute inset-0 bg-gradient-to-b from-[#020617]/80 to-[#020617]" />
      </div>

      <div className="relative z-10">
        <Navbar balance={userBalance} onOpenDeposit={() => setShowDepositModal(true)} onLogout={handleLogout} />

        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8 py-10">
          
          <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div className="flex gap-4">
                <button onClick={() => setActiveTab("market")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'market' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>Marketplace</button>
                <button onClick={() => setActiveTab("my_cards")} className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'my_cards' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}>My Cards ({myCards.length})</button>
            </div>
            {activeTab === 'market' && <div className="px-4 py-2 rounded-lg bg-slate-900/50 border border-slate-800 text-xs text-slate-400 backdrop-blur-md"><span className="block text-slate-500 mb-0.5">Total Results</span><span className="text-emerald-400 font-mono">{totalItems}</span></div>}
          </div>

          {activeTab === "market" && (
            <>
              <div className="mb-8 rounded-xl border border-slate-800 bg-[#0B101B]/90 p-1 shadow-2xl backdrop-blur-md">
                 <div className="flex flex-col lg:flex-row items-center gap-1 p-1">
                  <div className="w-full lg:w-[20%]"><SearchInput placeholder="Search BIN..." value={filters.search} onChange={(v) => { setFilters(f => ({...f, search: v})); setPage(1); }} /></div>
                  <div className="w-full lg:w-[15%]"><InputWithIcon icon={<span>🏳️</span>} placeholder="Origin..." value={filters.country} onChange={(v) => { setFilters(f => ({...f, country: v})); setPage(1); }} /></div>
                  <div className="w-full lg:w-[15%]"><InputWithIcon icon={<span>💲</span>} placeholder="Min Balance" value={filters.balance} onChange={(v) => { setFilters(f => ({...f, balance: v})); setPage(1); }} /></div>
                  <div className="w-full lg:w-[40%] grid grid-cols-3 gap-1">
                      <SelectWithIcon icon={<span>💳</span>} value={filters.brand} onChange={(e) => { setFilters(f => ({...f, brand: e.target.value as CardCategory | ""})); setPage(1); }}><option value="">Network</option><option value="visa">Visa</option><option value="mastercard">Mastercard</option><option value="american-express">Amex</option><option value="discover">Discover</option></SelectWithIcon>
                      <SelectWithIcon icon={<span>🔒</span>} value={filters.vbv} onChange={(e) => { setFilters(f => ({...f, vbv: e.target.value as VBVStatus | ""})); setPage(1); }}><option value="">Security</option><option value="vbv">Verified</option><option value="non-vbv">Non-VBV</option></SelectWithIcon>
                      <SelectWithIcon icon={<span>🏷️</span>} value={filters.type} onChange={(e) => { setFilters(f => ({...f, type: e.target.value as CardType | ""})); setPage(1); }}><option value="">Type</option><option value="credit">Credit</option><option value="debit">Debit</option></SelectWithIcon>
                  </div>
                  <div className="w-full lg:w-[10%] h-10"><button onClick={resetFilters} disabled={activeFilterCount === 0} className={`h-full w-full flex items-center justify-center gap-2 rounded-lg border text-sm font-medium transition-all ${activeFilterCount > 0 ? "border-red-900/30 bg-red-900/10 text-red-400" : "border-slate-800 bg-slate-900 text-slate-500 cursor-not-allowed"}`}>Reset</button></div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-[#0B101B]/80 shadow-2xl backdrop-blur-md min-h-[400px]">
                {isLocked && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#020617]/80 backdrop-blur-md text-center p-6">
                        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full animate-in zoom-in-95 duration-300">
                            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg></div>
                            <h2 className="text-xl font-bold text-white mb-2">Inventory Locked</h2>
                            <p className="text-slate-400 text-sm mb-6">Deposit funds to view card details and purchase.</p>
                            <button onClick={() => setShowDepositModal(true)} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/25 transition-all">Deposit Funds</button>
                        </div>
                    </div>
                )}

                {loading && <div className="absolute inset-0 bg-[#0B101B]/60 z-20 flex items-center justify-center backdrop-blur-sm"><div className="h-10 w-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div></div>}
                
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="bg-[#0f1623] text-xs font-medium uppercase tracking-wider text-slate-500">
                      <tr>
                        <SortableHeader label="Network / BIN" sortKey="bin" activeSort={sortConfig} onSort={handleSort} width="220px" />
                        <SortableHeader label="Origin" sortKey="country" activeSort={sortConfig} onSort={handleSort} />
                        <SortableHeader label="Price" sortKey="price" activeSort={sortConfig} onSort={handleSort} width="150px" align="right" />
                        <th className="px-6 py-4 font-semibold text-right w-[160px]">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {marketCards.map((card) => (
                        <tr key={card.id} className={`group transition-colors ${isLocked ? 'blur-sm select-none opacity-50' : 'hover:bg-white/[0.02]'}`}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-12 items-center justify-center rounded bg-white/5 p-1 ring-1 ring-white/10">{BrandIcons[card.brand]}</div>
                              <span className="font-mono text-sm text-slate-200">{isLocked ? "5300 ****" : `${card.bin}******`}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-300 capitalize">{card.country} <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400 uppercase">{card.type}</span></td>
                          <td className="px-6 py-4 text-right"><span className="text-white font-mono">${card.price.toFixed(2)}</span></td>
                          <td className="px-6 py-4 text-right">
                            <button 
                                onClick={() => handleBuyClick(card)} 
                                className="bg-indigo-600 px-4 py-2 rounded text-xs font-bold text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
                                disabled={isLocked}
                            >
                                Buy Now
                            </button>
                          </td>
                        </tr>
                      ))}
                      {marketCards.length === 0 && !loading && <tr><td colSpan={4} className="p-12 text-center text-slate-500">No inventory found.</td></tr>}
                    </tbody>
                  </table>
                </div>
                <div className="border-t border-slate-800 bg-[#0f1623]/50 px-6 py-4 flex items-center justify-between">
                    <div className="text-xs text-slate-500">Page {page} of {totalPages}</div>
                    <div className="flex gap-2">
                        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-xs">Prev</button>
                        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white rounded text-xs">Next</button>
                    </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "my_cards" && (
            <div className="rounded-xl border border-slate-800 bg-[#0B101B]/80 shadow-2xl backdrop-blur-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left text-sm">
                    <thead className="bg-[#0f1623] text-xs font-medium uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-6 py-4">Brand</th>
                        <th className="px-6 py-4">Full PAN</th>
                        <th className="px-6 py-4">Expiry</th>
                        <th className="px-6 py-4">CVV</th>
                        <th className="px-6 py-4">Country</th>
                        <th className="px-6 py-4 text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {myCards.map((card) => (
                        <tr key={card.id} className="hover:bg-white/[0.02]">
                          <td className="px-6 py-4"><div className="w-10">{BrandIcons[card.brand]}</div></td>
                          <td className="px-6 py-4 font-mono text-emerald-400 tracking-wider font-bold">{card.fullPan}</td>
                          <td className="px-6 py-4 font-mono text-white">{card.exp}</td>
                          <td className="px-6 py-4 font-mono text-indigo-400">{card.cvv}</td>
                          <td className="px-6 py-4 text-slate-300">{card.country}</td>
                          <td className="px-6 py-4 text-right text-slate-500">${card.price}</td>
                        </tr>
                      ))}
                      {myCards.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-500">You haven't purchased any cards yet.</td></tr>}
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
                    <div className="flex justify-between text-sm"><span className="text-slate-500">BIN</span><span className="text-white font-mono">{selectedCardForPurchase.bin}******</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Type</span><span className="text-white capitalize">{selectedCardForPurchase.brand} {selectedCardForPurchase.type}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-500">Origin</span><span className="text-white">{selectedCardForPurchase.country}</span></div>
                    <div className="h-px bg-slate-700 my-2"></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-400">Price</span><span className="text-emerald-400 font-bold font-mono text-lg">${selectedCardForPurchase.price.toFixed(2)}</span></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => setSelectedCardForPurchase(null)} className="py-2.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 font-medium transition-colors">Cancel</button>
                    <button onClick={confirmPurchase} disabled={loading} className="py-2.5 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-bold shadow-lg shadow-indigo-500/25 transition-all">{loading ? "Processing..." : "Confirm Buy"}</button>
                </div>
            </div>
        </div>
      )}

      {showDepositModal && <DepositModal onClose={() => setShowDepositModal(false)} />}

    </main>
  );
}

function DepositModal({ onClose }: { onClose: () => void }) {
    const [amount, setAmount] = useState("");
    const [file, setFile] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const walletAddress = "0x6e3E388a0d9aCda78a98ae016B6a05344968DF7f";

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
        if (!amount || !file) { alert("Please enter amount and upload a screenshot."); return; }
        setSubmitting(true);
        const formData = new FormData();
        formData.append("amount", amount);
        formData.append("screenshot", file);
        const res = await submitDepositProof(formData);
        setSubmitting(false);
        if (res.success) { alert("Deposit Submitted! Admin will verify shortly."); onClose(); } else { alert("Error: " + res.error); }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(walletAddress);
        alert("Address copied!");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-[#0B101B] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative">
                <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">✕</button>
                <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-1">Deposit Funds</h3>
                    <p className="text-xs text-slate-500 mb-6">Send USDT (BEP20/ERC20) to the address below.</p>
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
    <nav className="border-b border-slate-800 bg-[#020617]/80 backdrop-blur-xl">
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

function SortableHeader({ label, sortKey, activeSort, onSort, width, align = "left" }: SortableHeaderProps) {
  const isActive = activeSort.key === sortKey;
  return (
    <th className={`px-6 py-4 font-semibold cursor-pointer group select-none transition-colors hover:text-indigo-300 ${isActive ? 'text-indigo-400' : ''}`} style={{ width, textAlign: align }} onClick={() => onSort(sortKey)}>
      <div className={`flex items-center gap-1.5 ${align === "right" ? "justify-end" : align === "center" ? "justify-center" : "justify-start"}`}>{label}<div className="flex flex-col gap-0.5 opacity-40 group-hover:opacity-100 transition-opacity"><svg className={`h-2 w-2 ${isActive && activeSort.direction === 'asc' ? 'text-indigo-400 opacity-100' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 4l-8 8h16z"/></svg><svg className={`h-2 w-2 ${isActive && activeSort.direction === 'desc' ? 'text-indigo-400 opacity-100' : ''}`} fill="currentColor" viewBox="0 0 24 24"><path d="M12 20l8-8H4z"/></svg></div></div>
    </th>
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