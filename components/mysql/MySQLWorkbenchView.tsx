"use client";

import React, { useState, useEffect } from "react";
import {
  Database,
  Terminal,
  Play,
  Download,
  Server,
  ShieldAlert,
  Table as TableIcon,
  RefreshCw,
  ExternalLink,
  FileCode,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { isAdministrator, isSupremeAdmin } from "@/lib/rbac";

export default function MySQLWorkbenchView() {
  const { currentUser, showToast } = useAuth();
  const role = currentUser?.role || "student";
  const [statusData, setStatusData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string>("students");
  const [tableRows, setTableRows] = useState<any[]>([]);
  const [loadingTable, setLoadingTable] = useState(false);

  // SQL Console (Read-Only)
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM students LIMIT 10;");
  const [queryResult, setQueryResult] = useState<any>(null);
  const [runningQuery, setRunningQuery] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  // Active view mode
  const [activeMode, setActiveMode] = useState<"tables" | "query" | "config" | "guide">("tables");

  // Connection settings state
  const [configForm, setConfigForm] = useState({
    host: "127.0.0.1",
    port: 3306,
    user: "root",
    database: "pgtsc_erp_db",
    phpMyAdminUrl: "http://localhost:8080/phpmyadmin",
  });

  const [syncingMySQL, setSyncingMySQL] = useState(false);
  const [pullingMySQL, setPullingMySQL] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const isAdmin = isAdministrator(role) || isSupremeAdmin(role);

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let ignore = false;
    fetch("/api/mysql-workbench?action=status")
      .then((res) => res.json())
      .then((json) => {
        if (!ignore && json.success) {
          setStatusData(json);
          if (json.mysqlConfig) {
            setConfigForm({
              host: json.mysqlConfig.host || "127.0.0.1",
              port: json.mysqlConfig.port || 3306,
              user: json.mysqlConfig.user || "root",
              database: json.mysqlConfig.database || "pgtsc_erp_db",
              phpMyAdminUrl: json.mysqlConfig.phpMyAdminUrl || "http://localhost:8080/phpmyadmin",
            });
          }
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin || !selectedTable) return;
    let ignore = false;
    setLoadingTable(true);
    fetch(`/api/mysql-workbench?action=table_data&table=${selectedTable}`)
      .then((res) => res.json())
      .then((json) => {
        if (!ignore) {
          if (json.success) {
            setTableRows(json.rows || []);
          }
          setLoadingTable(false);
        }
      })
      .catch((err) => {
        if (!ignore) {
          console.error(err);
          setLoadingTable(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [selectedTable, isAdmin]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mysql-workbench?action=status");
      const json = await res.json();
      if (json.success) {
        setStatusData(json);
        if (json.mysqlConfig) {
          setConfigForm({
            host: json.mysqlConfig.host || "127.0.0.1",
            port: json.mysqlConfig.port || 3306,
            user: json.mysqlConfig.user || "root",
            database: json.mysqlConfig.database || "pgtsc_erp_db",
            phpMyAdminUrl: json.mysqlConfig.phpMyAdminUrl || "http://localhost:8080/phpmyadmin",
          });
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tbl: string) => {
    setLoadingTable(true);
    try {
      const res = await fetch(`/api/mysql-workbench?action=table_data&table=${tbl}`);
      const json = await res.json();
      if (json.success) {
        setTableRows(json.rows || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTable(false);
    }
  };

  const handleQueryChange = (text: string) => {
    setSqlQuery(text);
    const lower = text.toLowerCase();
    const destructive = ["drop", "delete", "alter", "truncate", "insert", "update", "create", "grant", "revoke"];
    const found = destructive.find((k) => new RegExp(`\\b${k}\\b`, "i").test(lower));
    if (found) {
      setSecurityWarning(`সতর্কতা: '${found.toUpperCase()}' এর মতো পরিবর্তনশীল বা ক্ষতিকর কমান্ড চালানো সম্পূর্ণ নিষিদ্ধ।`);
    } else {
      setSecurityWarning(null);
    }
  };

  const handleRunQuery = async () => {
    if (!sqlQuery.trim()) return;

    const lower = sqlQuery.toLowerCase();
    const destructive = ["drop", "delete", "alter", "truncate", "insert", "update", "create", "grant", "revoke"];
    const found = destructive.find((k) => new RegExp(`\\b${k}\\b`, "i").test(lower));
    if (found) {
      showToast(`নিরাপত্তা ত্রুটি: '${found.toUpperCase()}' কমান্ড নিষিদ্ধ। শুধুমাত্র SELECT অনুমোদিত।`, "error");
      return;
    }

    setRunningQuery(true);
    try {
      const res = await fetch("/api/mysql-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_query",
          query: sqlQuery,
        }),
      });
      const json = await res.json();
      setQueryResult(json);
      if (json.success) {
        showToast(`SQL কোয়েরি সফল (${json.executionTimeMs} ms)`, "success");
      } else {
        showToast(json.error || json.message || "Query Error", "error");
      }
    } catch (err: any) {
      showToast("SQL কোয়েরি চালাতে ত্রুটি হয়েছে", "error");
    } finally {
      setRunningQuery(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSupremeAdmin(role)) {
      showToast("কেবলমাত্র সুপার অ্যাডমিন কনফিগারেশন পরিবর্তন করতে পারেন", "error");
      return;
    }
    try {
      const res = await fetch("/api/mysql-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_config",
          config: configForm,
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("MySQL সংযোগ কনফিগারেশন সংরক্ষিত হয়েছে!", "success");
        fetchStatus();
      } else {
        showToast(json.error || "কনফিগারেশন সংরক্ষণ ব্যর্থ", "error");
      }
    } catch (err) {
      showToast("কনফিগারেশন সংরক্ষণ ব্যর্থ", "error");
    }
  };

  const handleSyncToMySQL = async () => {
    setSyncingMySQL(true);
    try {
      const res = await fetch("/api/mysql-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_to_mysql" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("সকল লোকাল কালেকশন MySQL ডাটাবেসে সফলভাবে সিঙ্ক হয়েছে!", "success");
        fetchStatus();
      } else {
        showToast(json.error || "MySQL সিঙ্ক সম্পন্ন হতে পারেনি", "error");
      }
    } catch {
      showToast("MySQL সিঙ্ক ব্যর্থ", "error");
    } finally {
      setSyncingMySQL(false);
    }
  };

  const handlePullFromMySQL = async () => {
    if (!confirm("আপনি কি নিশ্চিত যে MySQL থেকে সমস্ত ডাটা লোকাল ক্যাশে টেনে আনতে চান?")) return;
    setPullingMySQL(true);
    try {
      const res = await fetch("/api/mysql-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "pull_from_mysql" }),
      });
      const json = await res.json();
      if (json.success) {
        showToast("MySQL ডাটা সফলভাবে লোকাল মেমোরি ক্যাশে লোড হয়েছে!", "success");
        fetchStatus();
        fetchTableData(selectedTable);
      } else {
        showToast(json.error || "ডাটা পুল করা সম্ভব হয়নি", "error");
      }
    } catch {
      showToast("ডাটা পুল ব্যর্থ", "error");
    } finally {
      setPullingMySQL(false);
    }
  };

  const handleDeleteRow = async (id: any) => {
    if (!confirm(`আপনি কি নিশ্চিত যে সারি #${id} মুছে ফেলতে চান?`)) return;
    try {
      const res = await fetch("/api/mysql-workbench", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_row", table: selectedTable, id }),
      });
      const json = await res.json();
      if (json.success) {
        showToast(json.message || "সারি সফলভাবে মুছে ফেলা হয়েছে", "success");
        fetchTableData(selectedTable);
        fetchStatus();
      } else {
        showToast(json.error || "মুছে ফেলা সম্ভব হয়নি", "error");
      }
    } catch {
      showToast("অপারেশন ব্যর্থ", "error");
    }
  };

  const handleRestoreFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target?.result as string;
        const res = await fetch("/api/mysql-workbench", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "restore_backup", backupData: text }),
        });
        const json = await res.json();
        if (json.success) {
          showToast(json.message || "ব্যাকআপ সফলভাবে পুনরুদ্ধার হয়েছে!", "success");
          fetchStatus();
          fetchTableData(selectedTable);
        } else {
          showToast(json.error || "ব্যাকআপ ফাইল সঠিক নয়", "error");
        }
      } catch {
        showToast("ব্যাকআপ পুনরুদ্ধার ব্যর্থ", "error");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (!isAdmin) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/40 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-rose-100 dark:bg-rose-950/60 rounded-2xl flex items-center justify-center text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">অননুমোদিত প্রবেশাধিকার (Access Restricted)</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
          ডাটাবেস ও সিস্টেম স্ট্যাটাস ওয়ার্কবেঞ্চ কেবলমাত্র প্রাতিষ্ঠানিক অ্যাডমিনিস্ট্রেটরদের জন্য সংরক্ষিত (Zero-Trust Security Policy)।
        </p>
      </div>
    );
  }

  const sampleQueries = [
    { label: "সকল শিক্ষার্থী", sql: "SELECT * FROM students LIMIT 10;" },
    { label: "কর্মকর্তা ও শিক্ষক", sql: "SELECT * FROM faculty_staff LIMIT 10;" },
    { label: "কারিগরি ট্রেড", sql: "SELECT * FROM technical_trades;" },
    { label: "ক্লাস রুটিন", sql: "SELECT * FROM class_routines LIMIT 10;" },
    { label: "টেবিল তালিকা", sql: "SHOW TABLES;" },
  ];

  return (
    <div className="space-y-6">
      {/* MySQL & phpMyAdmin Studio Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl border border-indigo-900/50 flex flex-col md:flex-row md:items-center md:justify-between gap-5 relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          {/* Storage Mode Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold backdrop-blur-xs border border-white/20">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{statusData?.storageEngineLabel || "⚡ Fast Local Memory/JSON Store (.next/cache/pgtsc-hybrid-local-db.json)"}</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white">
            ডাটাবেস হেলথ ও সিস্টেম স্ট্যাটাস ওয়ার্কবেঞ্চ
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            হাইব্রিড ডুয়াল-ইঞ্জিন স্টোরেজ ইন্সপেক্টর (Fast Memory/JSON Dev + MySQL Live Production)। টেবিল ব্রাউজার, 1-ক্লিক সিঙ্ক ও ফুল ডাটাবেস ব্যাকআপ ইঞ্জিন।
          </p>
        </div>

        {/* 1-Click Sync & Backup Toolbar */}
        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncToMySQL}
            disabled={syncingMySQL}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="লোকাল ডাটাবেস থেকে সকল রেকর্ড MySQL এ আপলোড করুন"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncingMySQL ? "animate-spin" : ""}`} />
            <span>{syncingMySQL ? "সিঙ্ক হচ্ছে..." : "Sync Local to MySQL"}</span>
          </button>

          <button
            type="button"
            onClick={handlePullFromMySQL}
            disabled={pullingMySQL}
            className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            title="MySQL ডাটাবেস থেকে সমস্ত রেকর্ড লোকাল ক্যাশে নিয়ে আসুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{pullingMySQL ? "লোড হচ্ছে..." : "Pull MySQL to Local"}</span>
          </button>

          <a
            href="/api/mysql-workbench?action=export_backup&format=json"
            download="pgtsc_erp_full_backup.json"
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-1.5"
            title="সম্পূর্ণ ডাটাবেস JSON ব্যাকআপ ফাইল ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.JSON ব্যাকআপ</span>
          </a>

          <a
            href="/api/mysql-workbench?action=export_sql"
            download="pgtsc_erp_mysql_dump.sql"
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-slate-950 font-black text-xs shadow-md flex items-center gap-1.5 transition-all"
            title="MySQL রিলেশনাল DDL ও INSERT ডাম্প ডাউনলোড করুন"
          >
            <Download className="w-3.5 h-3.5" />
            <span>.SQL ডাম্প</span>
          </a>

          <label className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center gap-1.5 cursor-pointer">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>রিস্টোর (.JSON)</span>
            <input
              type="file"
              accept=".json"
              onChange={handleRestoreFile}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Connection & Status Metric Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">ডাটাবেস সিকিউরিটি</span>
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
            <Lock className="w-3.5 h-3.5 text-emerald-500" />
            <span>Locked (Read-Only)</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400 block">{configForm.database}</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">হোস্ট ও পোর্ট</span>
          <span className="text-sm font-black text-indigo-600 dark:text-cyan-400 block font-mono">
            {configForm.host}:{configForm.port}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">MySQL Default 3306</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">মোট টেবিল সংখ্যা</span>
          <span className="text-sm font-black text-slate-900 dark:text-white block font-mono">
            {statusData?.totalTables || 12} টি রিলেশনাল টেবিল
          </span>
          <span className="text-[11px] text-teal-700 dark:text-teal-400">InnoDB UTF8MB4</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xs border border-slate-200 dark:border-slate-800 space-y-1">
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold block uppercase">phpMyAdmin URL</span>
          <a
            href={configForm.phpMyAdminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-amber-600 hover:underline flex items-center gap-1 truncate"
          >
            <span>{configForm.phpMyAdminUrl}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
          <span className="text-[10px] text-slate-400">Admin Control Panel</span>
        </div>
      </div>

      {/* Sub-tabs Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl px-4 text-xs font-bold shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveMode("tables")}
          className={`flex items-center gap-1.5 py-4 px-4 border-b-2 transition-all min-w-max ${
            activeMode === "tables"
              ? "border-indigo-600 text-indigo-600 dark:text-cyan-400 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <TableIcon className="w-4 h-4" />
          <span>টেবিল পরিদর্শক (Table Inspector)</span>
        </button>

        <button
          onClick={() => setActiveMode("query")}
          className={`flex items-center gap-1.5 py-4 px-4 border-b-2 transition-all min-w-max ${
            activeMode === "query"
              ? "border-indigo-600 text-indigo-600 dark:text-cyan-400 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>নিরাপদ কোয়েরি পরিদর্শক (Read-Only Queries)</span>
        </button>

        <button
          onClick={() => setActiveMode("config")}
          className={`flex items-center gap-1.5 py-4 px-4 border-b-2 transition-all min-w-max ${
            activeMode === "config"
              ? "border-indigo-600 text-indigo-600 dark:text-cyan-400 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <Server className="w-4 h-4" />
          <span>MySQL সংযোগ সেটিংস</span>
        </button>

        <button
          onClick={() => setActiveMode("guide")}
          className={`flex items-center gap-1.5 py-4 px-4 border-b-2 transition-all min-w-max ${
            activeMode === "guide"
              ? "border-indigo-600 text-indigo-600 dark:text-cyan-400 font-black"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white"
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>phpMyAdmin নির্দেশিকা</span>
        </button>
      </div>

      {/* MODE 1: TABLE BROWSER */}
      {activeMode === "tables" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Table List (4 cols) */}
          <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs">
            <span className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider block">
              ডাটাবেস টেবিলসমূহ ({statusData?.tables?.length || 12})
            </span>

            <div className="space-y-1.5 max-h-[480px] overflow-y-auto">
              {(statusData?.tables || []).map((t: any) => {
                const isSelected = selectedTable === t.name;
                return (
                  <button
                    key={t.name}
                    onClick={() => setSelectedTable(t.name)}
                    className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? "bg-indigo-50 dark:bg-slate-800 border-indigo-500 text-indigo-950 dark:text-cyan-300 font-bold shadow-xs"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <TableIcon className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400 shrink-0" />
                      <span className="font-mono text-xs truncate">{t.name}</span>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                      {t.rows} সারি
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Table Data Rows View (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-slate-900 p-5 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-3 text-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">বর্তমান টেবিল</span>
                <h3 className="font-mono font-black text-base text-indigo-700 dark:text-cyan-400">
                  `{selectedTable}`
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="টেবিলে অনুসন্ধান করুন..."
                  className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden w-48"
                />
                <button
                  onClick={() => fetchTableData(selectedTable)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-semibold cursor-pointer shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>রিফ্রেশ</span>
                </button>
              </div>
            </div>

            {loadingTable ? (
              <div className="p-12 text-center text-slate-400">ডাটা লোড হচ্ছে...</div>
            ) : tableRows.length === 0 ? (
              <div className="p-12 text-center text-slate-400">এই টেবিলে কোনও সারি পাওয়া যায়নি।</div>
            ) : (() => {
              const filteredRows = searchQuery.trim()
                ? tableRows.filter((r) => JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase().trim()))
                : tableRows;

              return (
                <div className="overflow-x-auto max-h-[440px]">
                  <table className="w-full text-left border-collapse font-mono text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 sticky top-0 font-bold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="p-2.5 whitespace-nowrap text-rose-500">অ্যাকশন</th>
                        {Object.keys(tableRows[0] || {}).slice(0, 7).map((col) => (
                          <th key={col} className="p-2.5 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredRows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/60">
                          <td className="p-2.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id ?? idx)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 dark:hover:bg-rose-900 border border-rose-200 dark:border-rose-800 transition cursor-pointer"
                            >
                              মুছুন
                            </button>
                          </td>
                          {Object.keys(tableRows[0] || {}).slice(0, 7).map((col) => (
                            <td key={col} className="p-2.5 whitespace-nowrap text-slate-800 dark:text-slate-200 max-w-[200px] truncate">
                              {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* MODE 2: READ-ONLY QUERY INSPECTOR */}
      {activeMode === "query" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>নিরাপদ কোয়েরি পরিদর্শক (Read-Only Query Inspector)</span>
            </h3>

            {/* Quick Sample Queries */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold mr-1">অনুমোদিত কোয়েরি:</span>
              {sampleQueries.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => handleQueryChange(sq.sql)}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-mono text-[10px] transition-colors"
                >
                  {sq.label}
                </button>
              ))}
            </div>
          </div>

          {/* Security alert if destructive keyword found */}
          {securityWarning && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{securityWarning}</span>
            </div>
          )}

          {/* SQL Editor Area */}
          <div className="space-y-2">
            <textarea
              rows={4}
              value={sqlQuery}
              onChange={(e) => handleQueryChange(e.target.value)}
              placeholder="SELECT * FROM students LIMIT 10;"
              className="w-full p-3.5 bg-slate-950 text-cyan-300 font-mono text-xs rounded-2xl border border-cyan-500/30 focus:outline-none focus:border-cyan-400 focus:shadow-[0_0_20px_rgba(6,182,212,0.35)] shadow-inner"
            />
            <div className="flex flex-wrap justify-between items-center gap-2">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1">
                <Lock className="w-3 h-3 text-emerald-500" />
                <span>নিরাপত্তা লকডাউন: শুধুমাত্র SELECT ও SHOW কোয়েরি অনুমোদিত (No Write Operations)</span>
              </span>
              <button
                onClick={handleRunQuery}
                disabled={runningQuery || Boolean(securityWarning)}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.45)] disabled:opacity-50 transition-all transform hover:scale-105"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{runningQuery ? "রান হচ্ছে..." : "কোয়েরি পরিদর্শন (Run Read-Only)"}</span>
              </button>
            </div>
          </div>

          {/* Query Output Box */}
          {queryResult && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between">
                <span className={`font-mono text-xs font-bold ${queryResult.success ? "text-slate-900 dark:text-white" : "text-rose-600 dark:text-rose-400"}`}>
                  {queryResult.error || queryResult.message}
                </span>
                {queryResult.executionTimeMs !== undefined && (
                  <span className="font-mono text-[10px] text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950 px-2 py-0.5 rounded">
                    সময়: {queryResult.executionTimeMs} ms
                  </span>
                )}
              </div>

              {queryResult.data && Array.isArray(queryResult.data) && queryResult.data.length > 0 && (
                <div className="overflow-x-auto max-h-64">
                  <table className="w-full text-left font-mono text-[11px] border-collapse">
                    <thead className="bg-slate-100 dark:bg-slate-700 font-bold border-b border-slate-200 dark:border-slate-600">
                      <tr>
                        {Object.keys(queryResult.data[0] || {}).map((col) => (
                          <th key={col} className="p-2 whitespace-nowrap">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {queryResult.data.map((row: any, idx: number) => (
                        <tr key={idx}>
                          {Object.keys(queryResult.data[0] || {}).map((col) => (
                            <td key={col} className="p-2 whitespace-nowrap">
                              {typeof row[col] === "object" ? JSON.stringify(row[col]) : String(row[col] ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODE 3: CONFIGURATION */}
      {activeMode === "config" && (
        <form
          onSubmit={handleSaveConfig}
          className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              MySQL / phpMyAdmin ডাটাবেস সংযোগ সেটিংস
            </h3>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-full border border-amber-200 dark:border-amber-900">
              সুপার অ্যাডমিন অনুমতি আবশ্যক
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                MySQL হোস্ট (Host)
              </label>
              <input
                type="text"
                value={configForm.host}
                onChange={(e) => setConfigForm({ ...configForm, host: e.target.value })}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                পোর্ট (Default 3306)
              </label>
              <input
                type="number"
                value={configForm.port}
                onChange={(e) => setConfigForm({ ...configForm, port: Number(e.target.value) })}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ডাটাবেসের নাম (Database Name)
              </label>
              <input
                type="text"
                value={configForm.database}
                onChange={(e) => setConfigForm({ ...configForm, database: e.target.value })}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                ইউজারনেম (User)
              </label>
              <input
                type="text"
                value={configForm.user}
                onChange={(e) => setConfigForm({ ...configForm, user: e.target.value })}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
              />
            </div>
          </div>

          <div>
            <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
              phpMyAdmin ব্রাউজার URL
            </label>
            <input
              type="text"
              value={configForm.phpMyAdminUrl}
              onChange={(e) => setConfigForm({ ...configForm, phpMyAdminUrl: e.target.value })}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs transition-colors"
            >
              কনফিগারেশন সংরক্ষণ করুন
            </button>
          </div>
        </form>
      )}

      {/* MODE 4: PHPMYADMIN IMPORT GUIDE */}
      {activeMode === "guide" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-xs border border-slate-200/80 dark:border-slate-800 space-y-4 text-xs text-slate-700 dark:text-slate-300">
          <h3 className="font-black text-sm text-slate-900 dark:text-white">
            phpMyAdmin-এ PTSC ERP ডাটাবেস ব্যবহারের নির্দেশিকা (Setup Guide)
          </h3>

          <div className="space-y-3">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-indigo-700 dark:text-cyan-400 block text-xs">
                ধাপ ১: ডাম্প ফাইল ডাউনলোড
              </span>
              <p>
                উপরে ডানদিকের <strong className="text-amber-600">&quot;.SQL ডাম্প এক্সপোর্ট&quot;</strong> বাটনে ক্লিক করে প্রস্তুতকৃত <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">pgtsc_erp_mysql_dump.sql</code> ফাইলটি ডাউনলোড করুন।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-indigo-700 dark:text-cyan-400 block text-xs">
                ধাপ ২: phpMyAdmin ওপেন করুন
              </span>
              <p>
                আপনার লোকাল সার্ভার (XAMPP / WAMP / Laragon) বা রিমোট হোস্টিংয়ের phpMyAdmin প্যানেলে ব্রাউজারে প্রবেশ করুন (যেমন: <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">http://localhost/phpmyadmin</code>)।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="font-bold text-indigo-700 dark:text-cyan-400 block text-xs">
                ধাপ ৩: ডাটাবেস তৈরি ও ইমপোর্ট
              </span>
              <p>
                ১. নতুন ডাটাবেস তৈরি করুন: <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">pgtsc_erp_db</code> (Collation: <code className="font-mono">utf8mb4_unicode_ci</code>)
                <br />
                ২. উপরের <strong>&quot;Import&quot;</strong> মেনুতে যান।
                <br />
                ৩. ডাউনলোডকৃত <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">pgtsc_erp_mysql_dump.sql</code> ফাইলটি সিলেক্ট করে নিচে <strong>&quot;Go&quot;</strong> চাপুন।
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-1">
              <span className="font-bold block text-xs">ধাপ ৪: স্বয়ংক্রিয় ডাটা লোড সম্পন্ন!</span>
              <p>
                সবগুলো টেবিল (শিক্ষার্থী, শিক্ষক, ট্রেড, রুটিন, ফলাফল ইত্যাদি) সঠিক UTF-8 বাংলায় আপনার নিজস্ব MySQL / phpMyAdmin ডাটাবেসে সফলভাবে ইন্সটল হয়ে যাবে।
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
