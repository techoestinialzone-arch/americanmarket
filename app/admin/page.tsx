"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getAdminStats, 
  getPendingDeposits, 
  approveDeposit, 
  addCardInventory,
  changeAdminPassword,
  getUsers, 
  getTransactionHistory,
  getInventoryList,
  deleteCard,
  updateCard
} from "./actions";

// ────────────────────────────────────────────────
// ICONS
// ────────────────────────────────────────────────
const Icons = {
  Dashboard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="9" x="3" y="3" rx="1" /><rect width="7" height="5" x="14" y="3" rx="1" /><rect width="7" height="9" x="14" y="12" rx="1" /><rect width="7" height="5" x="3" y="16" rx="1" /></svg>,
  CreditCard: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>,
  Wallet: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" /><path d="M3 5v14a2 2 0 0 0 2 2h16v-5" /><path d="M18 12a2 2 0 0 0 0 4h4v-4Z" /></svg>,
  Users: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  History: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v5h5" /><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" /><path d="M12 7v5l4 2" /></svg>,
  Settings: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.09a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>,
  LogOut: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" x2="9" y1="12" y2="12" /></svg>,
  Add: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="16"/><line x1="8" x2="16" y1="12" y2="12"/></svg>,
  List: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>,
  Edit: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>,
  Trash: () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
};

export default function AdminDashboard() {
  const router = useRouter();
  const [view, setView] = useState<"dashboard" | "add-inventory" | "view-inventory" | "deposits" | "users" | "history" | "settings">("dashboard");
  
  // Data State
  const [stats, setStats] = useState<any>(null);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [history, setHistory] = useState<{ recentDeposits: any[], recentSales: any[] }>({ recentDeposits: [], recentSales: [] });
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  
  // Edit State
  const [editingCard, setEditingCard] = useState<any>(null);

  const [loading, setLoading] = useState(false);
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");

  useEffect(() => { refreshData(); }, []);

  const refreshData = async () => {
    try {
        const [statsData, depositsData, usersData, historyData, inventoryData] = await Promise.all([
            getAdminStats(), 
            getPendingDeposits(),
            getUsers(),
            getTransactionHistory(),
            getInventoryList ? getInventoryList() : Promise.resolve([]) 
        ]);
        
        setStats(statsData);
        setDeposits(depositsData as any);
        setUsers(usersData as any);
        setHistory(historyData as any);
        setInventoryList(inventoryData as any);
    } catch (e) {
        console.error("Failed to load admin data", e);
    }
  };

  const handleAdminPasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if(newPass !== confirmPass) { alert("Passwords do not match"); return; }
    if(!confirm("Change your admin password?")) return;
    
    setLoading(true);
    const res = await changeAdminPassword(newPass);
    setLoading(false);
    
    if(res.success) {
        alert("Success. Please login again.");
        router.push("/admin/login");
    } else {
        alert("Error: " + res.error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this card?")) return;
    setLoading(true);
    const res = await deleteCard(id);
    setLoading(false);
    if (res.success) {
        refreshData();
    } else {
        alert("Error deleting card: " + res.error);
    }
  };

  const handleUpdate = async (formData: FormData) => {
    setLoading(true);
    const res = await updateCard(formData);
    setLoading(false);
    if (res.success) {
        setEditingCard(null);
        refreshData();
        alert("Card updated successfully");
    } else {
        alert("Error updating card: " + res.error);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#050505] text-slate-300 font-sans selection:bg-indigo-500/20">
      
      {/* 🟢 SIDEBAR */}
      <aside className="w-64 border-r border-white/5 bg-[#0a0a0a] flex flex-col fixed h-full z-10">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-lg">A</span>
          </div>
          <div>
            <h1 className="font-bold text-white leading-none tracking-tight">AMERICAN</h1>
            <p className="text-[10px] text-slate-500 tracking-[0.2em] mt-1">MARKET</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem icon={<Icons.Dashboard/>} label="Overview" active={view === "dashboard"} onClick={() => setView("dashboard")} />
          
          <div className="pt-4 mt-4 mb-2 border-t border-white/5 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Inventory</div>
          <SidebarItem icon={<Icons.Add/>} label="Add Inventory" active={view === "add-inventory"} onClick={() => setView("add-inventory")} />
          <SidebarItem icon={<Icons.List/>} label="All Cards" active={view === "view-inventory"} onClick={() => setView("view-inventory")} />
          
          <div className="pt-4 mt-4 mb-2 border-t border-white/5 px-4 text-[10px] font-bold text-slate-600 uppercase tracking-wider">Management</div>
          <SidebarItem icon={<Icons.Wallet/>} label="Deposits" active={view === "deposits"} onClick={() => setView("deposits")} count={stats?.pendingDeposits} />
          <SidebarItem icon={<Icons.Users/>} label="Users" active={view === "users"} onClick={() => setView("users")} />
          <SidebarItem icon={<Icons.History/>} label="History" active={view === "history"} onClick={() => setView("history")} />
          
          <div className="pt-4 mt-4 border-t border-white/5">
            <SidebarItem icon={<Icons.Settings/>} label="Settings" active={view === "settings"} onClick={() => setView("settings")} />
          </div>
        </nav>

        <div className="p-4 border-t border-white/5 bg-[#080808]">
           <button onClick={() => router.push("/admin/login")} className="flex items-center gap-3 w-full px-4 py-3 text-xs font-medium text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors group">
              <Icons.LogOut />
              <span className="group-hover:translate-x-1 transition-transform">Sign Out</span>
           </button>
        </div>
      </aside>

      {/* 🟢 MAIN CONTENT */}
      <div className="flex-1 ml-64 bg-[#050505]">
        <header className="h-16 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-xl sticky top-0 z-20 px-8 flex items-center justify-between">
            <div className="text-sm font-medium text-slate-500">
               Admin Portal <span className="mx-2 text-slate-700">/</span> <span className="capitalize text-white">{view.replace('-', ' ')}</span>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <p className="text-xs font-bold text-white">Root Admin</p>
                    <p className="text-[10px] text-emerald-500 font-mono">SECURE_CONNECTION</p>
                </div>
                <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 border border-white/10 shadow-inner"></div>
            </div>
        </header>

        <main className="p-8 max-w-7xl mx-auto">
            
            {/* VIEW: DASHBOARD */}
            {view === "dashboard" && stats && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-bold text-white tracking-tight">Market Overview</h2>
                        <span className="text-xs text-slate-500 bg-white/5 px-3 py-1 rounded-full border border-white/5">Live Data</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <KPICard label="Total Revenue" value={`$${stats.totalRevenue.toFixed(2)}`} trend="+12.5%" />
                        <KPICard label="Total Users" value={stats.totalUsers} trend="+4" />
                        <KPICard label="Live Inventory" value={stats.liveInventory} trend="Stable" />
                        <KPICard label="Pending Deposits" value={stats.pendingDeposits} alert={stats.pendingDeposits > 0} />
                    </div>
                </div>
            )}

            {/* VIEW: ADD INVENTORY */}
            {view === "add-inventory" && (
                <div className="max-w-5xl mx-auto animate-in fade-in space-y-8">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-8 shadow-2xl">
                        <div className="flex justify-between items-start mb-8 pb-6 border-b border-white/5">
                            <div>
                                <h2 className="text-xl font-bold text-white">Add Inventory</h2>
                                <p className="text-sm text-slate-500 mt-1">Push new card data to the marketplace feed.</p>
                            </div>
                            <div className="px-3 py-1 rounded border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 text-xs font-bold">Manual Entry</div>
                        </div>

                        <form action={async (formData) => { 
                            setLoading(true); 
                            const res = await addCardInventory(formData); 
                            setLoading(false); 
                            if (res.success) { alert("Added!"); refreshData(); } else { alert("Error: " + res.error); } 
                        }} className="space-y-8">
                            
                            {/* Group 1: Data */}
                            <div className="p-5 bg-white/[0.02] rounded-lg border border-white/5">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Icons.CreditCard /> Card Attributes
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                    <div className="md:col-span-6"><FormInput label="Full PAN" name="pan" placeholder="4532 1234 5678 9010" required /></div>
                                    <div className="md:col-span-3"><FormInput label="Expiry (MM/YY)" name="exp" placeholder="05/29" required /></div>
                                    <div className="md:col-span-3"><FormInput label="CVV" name="cvv" placeholder="123" required /></div>
                                </div>
                            </div>

                            {/* Group 2: Origin */}
                            <div className="p-5 bg-white/[0.02] rounded-lg border border-white/5">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Classification</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FormSelect label="Network" name="brand">
                                        <option value="American Express">American Express</option><option value="visa">Visa</option><option value="mastercard">Mastercard</option><option value="amex">Amex</option><option value="discover">Discover</option>
                                    </FormSelect>
                                    <FormSelect label="Type" name="type">
                                        <option value="credit">Credit</option><option value="debit">Debit</option>
                                    </FormSelect>
                                    <FormInput label="Country Code" name="country" placeholder="US" maxLength={2} required />
                                </div>
                            </div>

                            {/* Group 3: Pricing */}
                            <div className="p-5 bg-white/[0.02] rounded-lg border border-white/5">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Market Valuation</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="relative group">
                                        <FormInput label="Estimated Balance" name="balance" type="number" placeholder="1000" required />
                                        <div className="absolute right-3 top-[34px] text-slate-600 font-bold">$</div>
                                    </div>
                                    <div className="relative group">
                                        <FormInput label="Sale Price" name="price" type="number" placeholder="25" required />
                                        <div className="absolute right-3 top-[34px] text-slate-600 font-bold">$</div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button disabled={loading} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 transition-all active:scale-[0.98]">
                                    {loading ? "Adding..." : "Push to Market"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW: INVENTORY LIST (Table Only) */}
            {view === "view-inventory" && (
                <div className="max-w-6xl mx-auto animate-in fade-in space-y-6">
                    <div className="flex justify-between items-end">
                        <h2 className="text-2xl font-bold text-white">Full Inventory List</h2>
                        <button onClick={refreshData} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">Refresh List</button>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/[0.02] text-slate-500 border-b border-white/5 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">BIN / Last4</th>
                                        <th className="px-4 py-3">Details</th>
                                        <th className="px-4 py-3">Bal / Price</th>
                                        <th className="px-4 py-3">Added</th>
                                        <th className="px-4 py-3 text-right">Status</th>
                                        <th className="px-4 py-3 text-right w-[100px]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {inventoryList.map((card) => (
                                        <tr key={card.id} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-3 text-white font-mono">
                                                {card.bin}******{card.last4}
                                            </td>
                                            <td className="px-4 py-3 text-slate-400 capitalize">
                                                {card.brand} • {card.country}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className="text-slate-300">${card.balance}</span> 
                                                <span className="text-slate-600 mx-1">/</span>
                                                <span className="text-emerald-400">${card.price}</span>
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {new Date(card.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                                    card.status === 'live' 
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                                                        : card.status === 'sold'
                                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}>
                                                    {card.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button 
                                                        onClick={() => setEditingCard(card)} 
                                                        className="p-1.5 text-slate-400 hover:text-indigo-400 hover:bg-white/5 rounded transition-colors"
                                                        title="Edit"
                                                    >
                                                        <Icons.Edit />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(card.id)} 
                                                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Icons.Trash />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {inventoryList.length === 0 && (
                                        <tr><td colSpan={6} className="p-12 text-center text-slate-600">No inventory found. Add some cards!</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: USERS LIST */}
            {view === "users" && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-end">
                        <h2 className="text-2xl font-bold text-white">User Accounts</h2>
                        <button onClick={refreshData} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">Refresh List</button>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.02] text-xs font-semibold uppercase text-slate-500 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">User Email</th>
                                    <th className="px-6 py-4 text-right">Current Balance</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                                        <td className="px-6 py-4 text-white font-medium">{u.email}</td>
                                        <td className="px-6 py-4 font-mono text-indigo-400 text-right">${u.balance.toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW: HISTORY */}
            {view === "history" && (
                <div className="space-y-8 animate-in fade-in">
                    <div className="flex justify-between items-center">
                        <h2 className="text-2xl font-bold text-white">Transaction Logs</h2>
                        <button onClick={refreshData} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">Refresh Data</button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Recent Sales */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-xl">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                                <h3 className="text-sm font-bold text-slate-300">Recent Sales</h3>
                            </div>
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/[0.02] text-slate-500 border-b border-white/5 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Buyer</th>
                                        <th className="px-4 py-3">Item</th>
                                        <th className="px-4 py-3 text-right">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.recentSales.map((s: any) => (
                                        <tr key={s.id} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-3 text-white truncate max-w-[150px]">{s.user.email}</td>
                                            <td className="px-4 py-3 text-slate-400 font-mono">
                                                {s.card ? `${s.card.brand.toUpperCase()} - ${s.card.bin}******` : 'Unknown Card'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-emerald-400 font-mono">${s.amount.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Completed Deposits */}
                        <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-xl">
                            <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                                <h3 className="text-sm font-bold text-slate-300">Completed Deposits</h3>
                            </div>
                            <table className="w-full text-left text-xs">
                                <thead className="bg-white/[0.02] text-slate-500 border-b border-white/5 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">User</th>
                                        <th className="px-4 py-3">Amount</th>
                                        <th className="px-4 py-3 text-right">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {history.recentDeposits.map((d: any) => (
                                        <tr key={d.id} className="hover:bg-white/[0.02]">
                                            <td className="px-4 py-3 text-white truncate max-w-[150px]">{d.user.email}</td>
                                            <td className="px-4 py-3 text-indigo-400 font-mono">+${d.amount.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right text-slate-500">{new Date(d.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: DEPOSITS */}
            {view === "deposits" && (
                <div className="space-y-6 animate-in fade-in">
                    <div className="flex justify-between items-end">
                        <h2 className="text-2xl font-bold text-white">Pending Transactions</h2>
                        <button onClick={refreshData} className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline">Refresh Feed</button>
                    </div>
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl overflow-hidden shadow-2xl">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white/[0.02] text-xs font-semibold uppercase text-slate-500 border-b border-white/5">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Decision</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {deposits.map((d) => (
                                    <tr key={d.id} className="hover:bg-white/[0.02] transition-colors group">
                                        <td className="px-6 py-4 text-white font-medium">{d.user.email}</td>
                                        <td className="px-6 py-4 font-mono text-emerald-400 font-bold">${d.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={async () => { if(!confirm("Approve?")) return; setLoading(true); await approveDeposit(d.id); await refreshData(); setLoading(false); }} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded text-xs font-bold transition-all">Accept</button>
                                                <button className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded text-xs font-bold transition-all">Reject</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* VIEW: SETTINGS */}
            {view === "settings" && (
                <div className="max-w-xl mx-auto animate-in fade-in">
                    <div className="bg-[#0a0a0a] border border-white/5 rounded-xl p-8 shadow-2xl">
                        <h2 className="text-xl font-bold text-white mb-6">Security Access</h2>
                        <form onSubmit={handleAdminPasswordChange} className="space-y-6">
                            <FormInput label="New Admin Key" type="password" value={newPass} onChange={(e:any) => setNewPass(e.target.value)} required placeholder="••••••••" />
                            <FormInput label="Confirm Key" type="password" value={confirmPass} onChange={(e:any) => setConfirmPass(e.target.value)} required placeholder="••••••••" />
                            <button disabled={loading} className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-slate-200 transition-all">Update Credentials</button>
                        </form>
                    </div>
                </div>
            )}
        </main>
      </div>

      {/* 🔴 EDIT MODAL */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-[#0a0a0a] border border-white/10 rounded-xl w-full max-w-md p-6 relative shadow-2xl">
                <button onClick={() => setEditingCard(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors">✕</button>
                <h3 className="text-lg font-bold text-white mb-6">Edit Card Details</h3>
                
                <form action={handleUpdate} className="space-y-4">
                    <input type="hidden" name="id" value={editingCard.id} />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <FormInput label="Price ($)" name="price" type="number" defaultValue={editingCard.price} required />
                        <FormInput label="Balance ($)" name="balance" type="number" defaultValue={editingCard.balance} required />
                    </div>
                    
                    <FormSelect label="Status" name="status" defaultValue={editingCard.status}>
                        <option value="live">Live</option>
                        <option value="sold">Sold</option>
                        <option value="dead">Dead</option>
                    </FormSelect>

                    <div className="pt-2">
                        <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg transition-all">
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}

// ────────────────────────────────────────────────
// UI COMPONENTS
// ────────────────────────────────────────────────

function SidebarItem({ icon, label, active, onClick, count }: any) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all ${active ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"}`}>
      <div className="flex items-center gap-3">{icon}<span>{label}</span></div>
      {count > 0 && <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${active ? "bg-indigo-500 text-white" : "bg-white/10 text-slate-400"}`}>{count}</span>}
    </button>
  );
}

function KPICard({ label, value, trend, alert }: any) {
  return (
    <div className={`p-6 rounded-xl border bg-[#0a0a0a] hover:border-white/10 transition-colors ${alert ? 'border-red-900/40 bg-red-950/10' : 'border-white/5'}`}>
      <div className="flex justify-between items-start mb-4">
        <p className={`text-xs font-bold uppercase tracking-wider ${alert ? 'text-red-400' : 'text-slate-500'}`}>{label}</p>
        {trend && <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">{trend}</span>}
      </div>
      <p className="text-3xl font-mono font-bold text-white">{value}</p>
    </div>
  );
}

function FormInput({ label, ...props }: any) {
    return <div className="space-y-1.5"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label><input {...props} className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all" /></div>
}

function FormSelect({ label, children, ...props }: any) {
    return <div className="space-y-1.5"><label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider ml-1">{label}</label><select {...props} className="w-full bg-[#121212] border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all appearance-none">{children}</select></div>
}