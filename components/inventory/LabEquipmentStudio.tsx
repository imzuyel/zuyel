"use client";

import React, { useState, useEffect } from "react";
import {
  Wrench,
  Package,
  ShieldCheck,
  AlertTriangle,
  Plus,
  Search,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Clock,
  Tag,
  MapPin,
  DollarSign,
  Layers,
  ChevronRight,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface EquipmentItem {
  id: string;
  itemCode: string;
  name: string;
  nameBangla: string;
  tradeCode: string;
  labLocation: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  damagedQuantity: number;
  conditionStatus: "GOOD" | "UNDER_MAINTENANCE" | "DAMAGED" | "OBSOLETE";
  unitPrice: number;
  purchaseDate: string;
  supplier?: string;
  notes?: string;
}

export default function LabEquipmentStudio() {
  const [equipmentList, setEquipmentList] = useState<EquipmentItem[]>([]);
  const [selectedTrade, setSelectedTrade] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Equipment Form State
  const [formState, setFormState] = useState({
    itemCode: "LAB-IT-105",
    name: "",
    nameBangla: "",
    tradeCode: "IT",
    labLocation: "Room 204 - IoT Lab",
    category: "Electronic Components",
    totalQuantity: 10,
    unitPrice: 1500,
    purchaseDate: new Date().toISOString().split("T")[0],
    supplier: "Karigari Supplier",
    notes: ""
  });

  // Fetch equipment list
  const fetchEquipment = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/inventory/equipment");
      const data = await res.json();
      if (data.success && data.equipment) {
        setEquipmentList(data.equipment);
      }
    } catch (err) {
      console.error("Failed to fetch equipment:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  // Handle Add Equipment Submit
  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/inventory/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ADD",
          ...formState
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsAddModalOpen(false);
        fetchEquipment();
      } else {
        alert(data.message || "সংরক্ষণ করতে ব্যর্থ হয়েছে।");
      }
    } catch (err) {
      console.error("Add equipment error:", err);
    }
  };

  // Filtered equipment
  const filteredEquipment = equipmentList.filter((item) => {
    const matchesTrade = selectedTrade === "ALL" || item.tradeCode === selectedTrade;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.nameBangla.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.itemCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTrade && matchesSearch;
  });

  // Statistics
  const totalItemsCount = equipmentList.reduce((acc, i) => acc + i.totalQuantity, 0);
  const totalValuation = equipmentList.reduce((acc, i) => acc + i.totalQuantity * i.unitPrice, 0);
  const underMaintenanceCount = equipmentList.filter((i) => i.conditionStatus === "UNDER_MAINTENANCE" || i.conditionStatus === "DAMAGED").length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold border border-cyan-500/30">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>পঞ্চগড় টিএসসি ল্যাব ও ইনভেন্টরি ট্র্যাকিং সিস্টেম</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white">
            কারিগরি ল্যাব ইকুইপমেন্ট ও মেশিনারি স্টুডিও
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            আইটি ল্যাব, ইলেকট্রিক্যাল ওয়ার্কশপ, অটোমোটিভ এবং আরএসি ল্যাবের যন্ত্রপাতি ও কাঁচামাল ব্যবস্থাপনা।
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-cyan-400" />
            <span>ল্যাব অডিট রিপোর্ট প্রিন্ট</span>
          </button>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white text-xs font-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>নতুন ইকুইপমেন্ট যোগ করুন</span>
          </button>
        </div>
      </div>

      {/* STATS OVERVIEW CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">মোট আইটেম সংখ্যা</div>
            <div className="text-xl sm:text-2xl font-black text-white font-mono mt-0.5">{totalItemsCount} টি</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">সচল ইকুইপমেন্ট</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono mt-0.5">
              {equipmentList.filter((i) => i.conditionStatus === "GOOD").length} ক্যাটাগরি
            </div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">মেরামতাধীন / ড্যামেজ</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono mt-0.5">{underMaintenanceCount} টি</div>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">মোট আনুমানিক মূল্য</div>
            <div className="text-lg sm:text-xl font-black text-cyan-400 font-mono mt-0.5">৳{totalValuation.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="p-4 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Trade Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "সকল ল্যাব" },
            { id: "IT", label: "আইটি ল্যাব" },
            { id: "EE", label: "ইলেকট্রিক্যাল" },
            { id: "AMB", label: "অটোমোটিভ" },
            { id: "RAC", label: "আরএসি" }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTrade(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedTrade === tab.id
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="কোড বা নাম দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs font-medium focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* EQUIPMENT GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEquipment.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 dark:text-slate-400 bg-slate-900/50 rounded-3xl border border-slate-800">
            কোনো ল্যাব ইকুইপমেন্ট পাওয়া যায়নি।
          </div>
        ) : (
          filteredEquipment.map((item) => {
            const isGood = item.conditionStatus === "GOOD";
            const isMaintenance = item.conditionStatus === "UNDER_MAINTENANCE";
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4 flex flex-col justify-between hover:border-slate-700 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-mono font-bold">
                      {item.itemCode}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isGood
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : isMaintenance
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                      }`}
                    >
                      {item.conditionStatus}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-white leading-snug">{item.name}</h3>
                    <p className="text-xs text-slate-400 font-semibold mt-0.5">{item.nameBangla}</p>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300 pt-1 border-t border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{item.labLocation}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">ক্যাটাগরি:</span>
                      <span className="font-medium text-slate-200">{item.category}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-800">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-slate-400">মোট</div>
                      <div className="font-mono font-black text-white">{item.totalQuantity}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-emerald-400">মজুদ</div>
                      <div className="font-mono font-black text-emerald-300">{item.availableQuantity}</div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                      <div className="text-[10px] text-rose-400">ড্যামেজ</div>
                      <div className="font-mono font-black text-rose-300">{item.damagedQuantity}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold">
                    가격: <span className="font-mono text-amber-400">৳{item.unitPrice.toLocaleString()} / unit</span>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* ADD EQUIPMENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>নতুন ল্যাব ইকুইপমেন্ট যুক্ত করুন</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">আইটেম কোড:</label>
                  <input
                    type="text"
                    value={formState.itemCode}
                    onChange={(e) => setFormState({ ...formState, itemCode: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">ট্রেড বা বিভাগ:</label>
                  <select
                    value={formState.tradeCode}
                    onChange={(e) => setFormState({ ...formState, tradeCode: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="IT">IT Support & IoT</option>
                    <option value="EE">Electrical</option>
                    <option value="AMB">Automotive</option>
                    <option value="RAC">RAC</option>
                    <option value="CIVIL">Civil</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">নাম (English):</label>
                <input
                  type="text"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g. Digital Oscilloscope"
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-300">নাম (বাংলা):</label>
                <input
                  type="text"
                  value={formState.nameBangla}
                  onChange={(e) => setFormState({ ...formState, nameBangla: e.target.value })}
                  placeholder="যেমন: ডিজিটাল অসিলেস্কোপ"
                  required
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">ল্যাব রুম লোকেশন:</label>
                  <input
                    type="text"
                    value={formState.labLocation}
                    onChange={(e) => setFormState({ ...formState, labLocation: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">ক্যাটাগরি:</label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  >
                    <option value="Heavy Machinery">Heavy Machinery</option>
                    <option value="Hand Tools">Hand Tools</option>
                    <option value="Electronic Components">Electronic Components</option>
                    <option value="Consumables">Consumables</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">মোট পরিমাণ:</label>
                  <input
                    type="number"
                    value={formState.totalQuantity}
                    onChange={(e) => setFormState({ ...formState, totalQuantity: Number(e.target.value) })}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">একক মূল্য (টাকা):</label>
                  <input
                    type="number"
                    value={formState.unitPrice}
                    onChange={(e) => setFormState({ ...formState, unitPrice: Number(e.target.value) })}
                    required
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md shadow-indigo-600/30"
                >
                  সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
