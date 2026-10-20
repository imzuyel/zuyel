import React, { useState, useEffect } from "react";
import {
  FileText,
  UploadCloud,
  Eye,
  Trash2,
  RefreshCw,
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  History,
  MoreVertical,
  Plus,
  ArrowRight,
  Settings,
  X,
  FileCheck,
  Check,
  Quote,
  AlertCircle,
  Clock
} from "lucide-react";

interface PdfLibraryViewProps {
  classes: any[];
  subjects: any[];
  quizzes: any[];
  showToast: (text: string, type?: "success" | "error" | "info") => void;
  onRefreshHistory: () => void;
}

export default function PdfLibraryView({ classes, subjects, quizzes, showToast, onRefreshHistory }: PdfLibraryViewProps) {
  // Collection & Search States
  const [documents, setDocuments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalDocuments: 0,
    processedCount: 0,
    processingCount: 0,
    pendingCount: 0,
    failedCount: 0,
    archivedCount: 0,
    totalQuestionsCount: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Upload States
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  
  const [docTitle, setDocTitle] = useState("");
  const [docDescription, setDocDescription] = useState("");
  const [docSubjectId, setDocSubjectId] = useState("");
  const [docClassId, setDocClassId] = useState("");
  const [docChapter, setDocChapter] = useState("");
  const [docTopic, setDocTopic] = useState("");
  const [docTags, setDocTags] = useState("");

  // Edit Metadata State
  const [showEditModal, setShowEditModal] = useState<any | null>(null);
  const [isEditingMetadata, setIsEditingMetadata] = useState(false);

  // Active Selected Document preview & Workspace
  const [activeDoc, setActiveDoc] = useState<any | null>(null);
  const [pagesList, setPagesList] = useState<any[]>([]);
  const [docPageChecklist, setDocPageChecklist] = useState<number[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  
  // PDF grounded generation states
  const [pdfGenTopic, setPdfGenTopic] = useState("");
  const [pdfGenCount, setPdfGenCount] = useState(5);
  const [pdfGenType, setPdfGenType] = useState("mcq_single");
  const [pdfGenDifficulty, setPdfGenDifficulty] = useState("medium");
  const [pdfGenLanguage, setPdfGenLanguage] = useState("Bangla");
  const [pdfGenInstructions, setPdfGenInstructions] = useState("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<any[]>([]);
  const [activeWorkspaceTab, setActiveWorkspaceTab] = useState<"reader" | "generator" | "history">("reader");
  const [workspaceJobs, setWorkspaceJobs] = useState<any[]>([]);

  // Batch Selection & Quiz Integration
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const [showAddToQuizModal, setShowAddToQuizModal] = useState(false);
  const [selectedQuizId, setSelectedQuizId] = useState("");
  const [isSavingSelected, setIsSavingSelected] = useState(false);

  // Question editing/refining workspace states
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState("");
  const [editedExplanation, setEditedExplanation] = useState("");
  const [editedData, setEditedData] = useState<any>(null);
  const [refinementText, setRefinementText] = useState("");
  const [isRefining, setIsRefining] = useState<string | null>(null);

  const fetchDocuments = async () => {
    setIsLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        subjectId: filterSubject,
        classId: filterClass,
        status: filterStatus,
        page: page.toString(),
        limit: "6",
      });
      const res = await fetch(`/api/quiz/documents?${q.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setDocuments(data.documents);
          setStats(data.stats);
          setTotalPages(data.pagination.totalPages);
        }
      }
    } catch (e) {
      console.error("Failed to load PDF library documents:", e);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-reload timer for processing state updates
  useEffect(() => {
    const fetchTimer = setTimeout(() => {
      fetchDocuments();
    }, 0);

    const timer = setInterval(() => {
      // If there are documents still processing, poll to update status
      if (documents.some(d => d.processingStatus === "processing" || d.processingStatus === "uploaded")) {
        fetchDocuments();
      }
    }, 4000);

    return () => {
      clearTimeout(fetchTimer);
      clearInterval(timer);
    };
  }, [search, filterSubject, filterClass, filterStatus, page]);

  // Drag and Drop files handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
        setUploadFile(file);
        if (!docTitle) setDocTitle(file.name.replace(".pdf", "").replace(/[_\-]/g, " "));
      } else {
        showToast("শুধুমাত্র পিডিএফ (.pdf) ফাইল গ্রহণযোগ্য।", "error");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadFile(file);
      if (!docTitle) setDocTitle(file.name.replace(".pdf", "").replace(/[_\-]/g, " "));
    }
  };

  // Upload handler
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) {
      showToast("দয়া করে একটি পিডিএফ সিলেক্ট করুন।", "error");
      return;
    }
    if (!docTitle.trim()) {
      showToast("ডকুমেন্টের শিরোনাম আবশ্যক।", "error");
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", uploadFile);
    formData.append("title", docTitle.trim());
    formData.append("description", docDescription.trim());
    formData.append("subjectId", docSubjectId);
    formData.append("classId", docClassId);
    formData.append("chapter", docChapter.trim());
    formData.append("topic", docTopic.trim());
    formData.append("tags", docTags.trim());

    try {
      const res = await fetch("/api/quiz/documents", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("পিডিএফ সফলভাবে আপলোড হয়েছে! এআই টেক্সট এক্সট্রাকশন ব্যাকগ্রাউন্ডে শুরু হয়েছে।", "success");
        setShowUploadModal(false);
        // Reset fields
        setUploadFile(null);
        setDocTitle("");
        setDocDescription("");
        setDocChapter("");
        setDocTopic("");
        setDocTags("");
        fetchDocuments();
      } else {
        showToast(data.message || "ফাইল আপলোড করতে ব্যর্থ হয়েছে।", "error");
      }
    } catch (err) {
      console.error("PDF upload error:", err);
      showToast("সার্ভার কানেকশন ত্রুটি। দয়া করে আবার চেষ্টা করুন।", "error");
    } finally {
      setIsUploading(false);
    }
  };

  // Reprocess/Retry extraction
  const handleReprocess = async (docId: string, simulateOcr: boolean = false) => {
    try {
      showToast(simulateOcr ? "সিমুলেটেড ওসিআর অপারেশন ব্যাকগ্রাউন্ডে শুরু হচ্ছে..." : "পুনরায় এক্সট্রাকশন শুরু হচ্ছে...", "info");
      const res = await fetch(`/api/quiz/documents/${docId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ simulateOcr }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        fetchDocuments();
        if (activeDoc && activeDoc.id === docId) {
          handleOpenWorkspace(activeDoc);
        }
      } else {
        showToast(data.message || "প্রসেসিং ব্যর্থ হয়েছে।", "error");
      }
    } catch (e) {
      showToast("কানেকশন ত্রুটি।", "error");
    }
  };

  // Archive or delete file
  const handleDelete = async (docId: string) => {
    if (!confirm("আপনি কি নিশ্চিতভাবে এই ডকুমেন্টটি লাইব্রেরি থেকে মুছতে চান?")) return;

    try {
      const res = await fetch(`/api/quiz/documents/${docId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message, "success");
        if (activeDoc && activeDoc.id === docId) {
          setActiveDoc(null);
        }
        fetchDocuments();
      } else {
        showToast(data.message || "ডকুমেন্ট মুছতে সমস্যা হয়েছে।", "error");
      }
    } catch (e) {
      showToast("মুছতে কানেকশন ত্রুটি হয়েছে।", "error");
    }
  };

  // Open PDF Workspace (Preview & Generate)
  const handleOpenWorkspace = async (doc: any) => {
    setActiveDoc(doc);
    setIsLoadingPreview(true);
    setActiveWorkspaceTab("reader");
    setGeneratedQuestions([]);
    setDocPageChecklist([]);
    
    // Default PDF Generation Topic based on PDF title or topic
    setPdfGenTopic(doc.topic || doc.title);

    try {
      // Load pages
      const pagesRes = await fetch(`/api/quiz/documents/${doc.id}/pages`);
      if (pagesRes.ok) {
        const pagesData = await pagesRes.json();
        if (pagesData.success) {
          setPagesList(pagesData.pages);
          // By default, select all successfully parsed pages
          const completedPages = pagesData.pages
            .filter((p: any) => p.extractionStatus === "completed")
            .map((p: any) => p.pageNumber);
          setDocPageChecklist(completedPages);
        }
      }

      // Load History for this PDF
      const histRes = await fetch(`/api/quiz/documents/${doc.id}/generation-history`);
      if (histRes.ok) {
        const histData = await histRes.json();
        if (histData.success) {
          setWorkspaceJobs(histData.jobs);
        }
      }
    } catch (e) {
      console.error("Error loading document workspace details:", e);
      showToast("ডকুমেন্ট ডাটা লোড করতে ব্যর্থ হয়েছে।", "error");
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Generate Questions Grounded in PDF
  const handleGroundedGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (docPageChecklist.length === 0) {
      showToast("দয়া করে কমপক্ষে একটি পৃষ্ঠা সিলেক্ট করুন যা থেকে প্রশ্ন তৈরি করা হবে।", "error");
      return;
    }
    if (!pdfGenTopic.trim()) {
      showToast("দয়া করে প্রশ্ন তৈরির টপিক নির্ধারণ করুন।", "error");
      return;
    }

    setIsGenerating(true);
    setGeneratedQuestions([]);

    try {
      const res = await fetch(`/api/quiz/documents/${activeDoc.id}/generate-questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pages: docPageChecklist,
          topic: pdfGenTopic.trim(),
          count: pdfGenCount,
          difficulty: pdfGenDifficulty,
          language: pdfGenLanguage,
          questionType: pdfGenType,
          additionalInstructions: pdfGenInstructions,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`সফলভাবে ${data.questions.length}টি প্রশ্ন জেনারেট হয়েছে!`, "success");
        setGeneratedQuestions(data.questions);
        setSelectedQuestionIds(data.questions.map((q: any) => q.id));
        
        // Reload history
        const histRes = await fetch(`/api/quiz/documents/${activeDoc.id}/generation-history`);
        if (histRes.ok) {
          const histData = await histRes.json();
          if (histData.success) setWorkspaceJobs(histData.jobs);
        }
        
        onRefreshHistory();
      } else {
        showToast(data.message || "প্রশ্ন তৈরিতে ব্যর্থ হয়েছে।", "error");
      }
    } catch (err) {
      console.error("Grounded generate error:", err);
      showToast("কানেকশন ত্রুটি। এআই কোড রেসপন্স চেক করুন।", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  // Page selection toggle
  const togglePageSelection = (pageNo: number) => {
    if (docPageChecklist.includes(pageNo)) {
      setDocPageChecklist(docPageChecklist.filter(n => n !== pageNo));
    } else {
      setDocPageChecklist([...docPageChecklist, pageNo]);
    }
  };

  // Edit metadata form action
  const handleEditMetadataSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showEditModal) return;

    setIsEditingMetadata(true);
    try {
      const res = await fetch(`/api/quiz/documents/${showEditModal.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: showEditModal.title,
          description: showEditModal.description,
          subjectId: showEditModal.subjectId,
          classId: showEditModal.classId,
          chapter: showEditModal.chapter,
          topic: showEditModal.topic,
          tags: showEditModal.tags,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("মেটাডাটা সফলভাবে আপডেট করা হয়েছে।", "success");
        setShowEditModal(null);
        fetchDocuments();
        if (activeDoc && activeDoc.id === showEditModal.id) {
          setActiveDoc({ ...activeDoc, ...data.document });
        }
      } else {
        showToast(data.message || "আপডেট ব্যর্থ হয়েছে।", "error");
      }
    } catch (e) {
      showToast("কানেকশন ত্রুটি।", "error");
    } finally {
      setIsEditingMetadata(false);
    }
  };

  // Single question AI Improvement / Refinement (Phase 2 capability inside Phase 3)
  const handleQuestionRefine = async (qId: string) => {
    if (!refinementText.trim()) return;
    setIsRefining(qId);

    try {
      const res = await fetch(`/api/quiz/documents/${activeDoc.id}/questions/regenerate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionId: qId,
          instruction: refinementText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast("এআই দ্বারা প্রশ্নটি সফলভাবে রিফাইন হয়েছে।", "success");
        setGeneratedQuestions(
          generatedQuestions.map((q) => (q.id === qId ? data.question : q))
        );
        setRefinementText("");
        setEditingQuestionId(null);
      } else {
        showToast(data.message || "রিফাইন ব্যর্থ হয়েছে।", "error");
      }
    } catch (e) {
      showToast("কানেকশন ত্রুটি।", "error");
    } finally {
      setIsRefining(null);
    }
  };

  // Question save/publish to Question Bank
  const handleAddSelectedToQuiz = async () => {
    if (selectedQuestionIds.length === 0) {
      showToast("কোনো প্রশ্ন সিলেক্ট করা হয়নি।", "error");
      return;
    }
    if (!selectedQuizId) {
      showToast("দয়া করে লক্ষ্যবস্তু কুইজ নির্বাচন করুন।", "error");
      return;
    }

    setIsSavingSelected(true);
    try {
      const res = await fetch("/api/ai/questions/add-to-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questionIds: selectedQuestionIds,
          quizId: selectedQuizId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${selectedQuestionIds.length}টি প্রশ্ন সফলভাবে কুইজে যুক্ত করা হয়েছে এবং কোয়েশ্চেন ব্যাংকে পাবলিশ হয়েছে!`, "success");
        setShowAddToQuizModal(false);
        // Mark saved in local states
        setGeneratedQuestions(
          generatedQuestions.map((q) =>
            selectedQuestionIds.includes(q.id) ? { ...q, status: "saved" as const } : q
          )
        );
        setSelectedQuestionIds([]);
      } else {
        showToast(data.message || "যুক্ত করতে ব্যর্থ হয়েছে।", "error");
      }
    } catch (e) {
      showToast("কানেকশন ত্রুটি।", "error");
    } finally {
      setIsSavingSelected(false);
    }
  };

  const getSubjectName = (id: number) => {
    const s = subjects.find(x => x.id === id);
    return s ? s.nameBangla : `বিষয় ${id}`;
  };

  const getClassName = (id: number) => {
    const c = classes.find(x => x.id === id);
    return c ? c.nameBangla : `শ্রেণি ${id}`;
  };

  return (
    <div className="space-y-6">
      {/* HEADER STATISTICS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">মোট ডকুমেন্টস</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{stats.totalDocuments}টি</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">সফলভাবে প্রসেসড</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{stats.processedCount}টি</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">ওসিআর লাগবে (Failed)</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{stats.failedCount}টি</h4>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-4 rounded-2xl flex items-center gap-3 shadow-xs">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/50 text-amber-600 rounded-xl">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">এআই জেনারেটেড প্রশ্ন</p>
            <h4 className="text-lg font-black text-slate-900 dark:text-white leading-tight">{stats.totalQuestionsCount}টি</h4>
          </div>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3 text-xs font-bold shadow-xs">
        <input
          type="text"
          placeholder="শিরোনাম, মূল টপিক বা অধ্যায় দিয়ে খুঁজুন..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full sm:flex-1 p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
        />

        <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
          <select
            value={filterClass}
            onChange={(e) => { setFilterClass(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
          >
            <option value="all">সকল শ্রেণি</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.nameBangla}</option>)}
          </select>

          <select
            value={filterSubject}
            onChange={(e) => { setFilterSubject(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl max-w-[150px]"
          >
            <option value="all">সকল বিষয়</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.nameBangla}</option>)}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
          >
            <option value="all">সকল অবস্থা</option>
            <option value="processed">Processed</option>
            <option value="processing">Processing</option>
            <option value="failed">OCR Needed</option>
            <option value="archived">Archived</option>
          </select>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>নতুন পিডিএফ আপলোড</span>
          </button>
        </div>
      </div>

      {/* CORE LIBRARY GRID VIEW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {documents.map((doc) => {
          const isSelected = activeDoc && activeDoc.id === doc.id;
          return (
            <div
              key={doc.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border transition-all flex flex-col p-5 space-y-4 shadow-xs relative ${
                isSelected
                  ? "ring-2 ring-indigo-500 border-indigo-500 shadow-md"
                  : "border-slate-200/80 dark:border-slate-800 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              {/* STATUS TOP BADGE */}
              <div className="flex items-center justify-between">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 ${
                  doc.processingStatus === "processed"
                    ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200"
                    : doc.processingStatus === "processing"
                    ? "bg-amber-50 dark:bg-amber-950/40 text-amber-700 animate-pulse border border-amber-200"
                    : doc.processingStatus === "failed"
                    ? "bg-rose-50 dark:bg-rose-950/40 text-rose-700 border border-rose-200"
                    : doc.processingStatus === "archived"
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                    : "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700"
                }`}>
                  {doc.processingStatus === "processing" && <Clock className="w-3 h-3 animate-spin" />}
                  <span>{doc.processingStatus === "failed" ? "Needs OCR" : doc.processingStatus}</span>
                </span>
                
                <span className="text-[10px] text-slate-400 font-mono">
                  {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB
                </span>
              </div>

              {/* DETAILS */}
              <div className="space-y-1">
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white line-clamp-1">
                  {doc.title}
                </h3>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {doc.description || "কোনো বিবরণ প্রদান করা হয়নি।"}
                </p>
              </div>

              {/* ATTRIBUTES */}
              <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/60">
                <div>
                  <span className="text-slate-400 font-normal block">শ্রেণি:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-black">{getClassName(doc.classId)}</span>
                </div>
                <div>
                  <span className="text-slate-400 font-normal block">বিষয়:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-black line-clamp-1">{getSubjectName(doc.subjectId)}</span>
                </div>
                {doc.chapter && (
                  <div className="col-span-2 border-t pt-1 border-slate-200/50 dark:border-slate-800/40">
                    <span className="text-slate-400 font-normal">অধ্যায়/টপিক:</span>{" "}
                    <span className="text-slate-700 dark:text-slate-300 font-black">{doc.chapter} - {doc.topic || "N/A"}</span>
                  </div>
                )}
              </div>

              {/* FOOTER STATS & ACTIONS */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-500 dark:text-slate-400">
                <div className="space-y-0.5">
                  <span>পৃষ্ঠা সংখ্যা: <b className="text-slate-800 dark:text-white">{doc.pageCount}টি</b></span>
                  <span className="block text-indigo-600">তৈরি প্রশ্ন: <b>{doc.generatedQuestionsCount || 0}টি</b></span>
                </div>

                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => setShowEditModal({ ...doc })}
                    title="মেটাডাটা সংশোধন"
                    className="p-1.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-lg border cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(doc.id)}
                    title="ডকুমেন্ট মুছুন"
                    className="p-1.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 rounded-lg border border-rose-100 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  {doc.processingStatus === "failed" && (
                    <button
                      onClick={() => handleReprocess(doc.id, true)}
                      title="সিমুলেটেড ওসিআর ট্রাই করুন"
                      className="px-2 py-1 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg flex items-center gap-1 text-[9px] cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3 animate-spin-slow" />
                      <span>OCR</span>
                    </button>
                  )}

                  {doc.processingStatus === "processed" && (
                    <button
                      onClick={() => handleOpenWorkspace(doc)}
                      className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center gap-1 font-black text-[10px] shadow-xs cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>ওয়ার্কস্পেস</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {documents.length === 0 && (
          <div className="col-span-3 text-center py-16 bg-white dark:bg-slate-900 border rounded-3xl text-slate-400 space-y-3">
            <FileText className="w-16 h-16 text-slate-200 mx-auto" />
            <p className="text-xs font-bold">লাইব্রেরিতে কোনো পিডিএফ বুক বা ডকুমেন্ট খুঁজে পাওয়া যায়নি।</p>
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 font-black rounded-xl text-xs"
            >
              প্রথম পিডিএফ আপলোড করুন
            </button>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 text-xs font-bold">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl disabled:opacity-50"
          >
            পূর্ববর্তী
          </button>
          <span>পৃষ্ঠা {page} / {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-xl disabled:opacity-50"
          >
            পরবর্তী
          </button>
        </div>
      )}

      {/* ACTIVE PDF WORKSPACE (SPLIT SCREEN WORKSPACE OVERLAY) */}
      {activeDoc && (
        <div className="bg-slate-50 dark:bg-slate-950 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-black text-slate-900 dark:text-white">
                  ডকুমেন্ট এআই ওয়ার্কস্পেস: {activeDoc.title}
                </h2>
                <p className="text-[10px] text-slate-400 font-mono">
                  {activeDoc.originalFilename} (সংস্করণ: {activeDoc.version || 1})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {/* Workspace Navigation Subtabs */}
              <div className="flex bg-slate-200 dark:bg-slate-700/60 p-1 rounded-xl text-[10px] font-black shrink-0">
                <button
                  onClick={() => setActiveWorkspaceTab("reader")}
                  className={`px-3 py-1.5 rounded-lg ${
                    activeWorkspaceTab === "reader" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  পৃষ্ঠা রিডার ({pagesList.length})
                </button>
                <button
                  onClick={() => setActiveWorkspaceTab("generator")}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1 ${
                    activeWorkspaceTab === "generator" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-500 hover:text-slate-800 dark:hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3 h-3 fill-current" />
                  <span>প্রশ্ন তৈরি জেনারেটর</span>
                </button>
                <button
                  onClick={() => setActiveWorkspaceTab("history")}
                  className={`px-3 py-1.5 rounded-lg ${
                    activeWorkspaceTab === "history" ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  রেকর্ডস ({workspaceJobs.length})
                </button>
              </div>

              <button
                onClick={() => setActiveDoc(null)}
                className="p-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-slate-600 dark:text-slate-400 font-extrabold cursor-pointer"
              >
                ✕ বন্ধ করুন
              </button>
            </div>
          </div>

          {/* SPLIT SCREEN BODY */}
          {isLoadingPreview ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
              <p className="text-xs">ডকুমেন্ট সোর্স এক্সট্রাকশন ডেটাবেস থেকে লোড হচ্ছে...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT COLUMN: PAGE SELECTION CHECKLIST */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border space-y-4 max-h-[600px] overflow-y-auto">
                <div className="flex justify-between items-center pb-2 border-b">
                  <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">উৎস পৃষ্ঠা নির্বাচন (Source Pages)</h3>
                  <span className="text-[10px] text-indigo-600 font-mono">
                    {docPageChecklist.length}টি নির্বাচিত
                  </span>
                </div>
                
                <p className="text-[10px] text-slate-400 leading-relaxed">
                  নিচে সিলেক্ট করা পৃষ্ঠাগুলির তথ্যই শুধুমাত্র এআই প্রম্পটে যুক্ত হবে। প্রশ্ন ফাঁসের ঝুঁকি ও বড় ফাইল প্রসেসিং এড়াতে টার্গেটেড পেজ নির্ধারণ করুন।
                </p>

                <div className="space-y-2.5">
                  {pagesList.map((p) => {
                    const isChecked = docPageChecklist.includes(p.pageNumber);
                    return (
                      <div
                        key={p.id}
                        onClick={() => togglePageSelection(p.pageNumber)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isChecked
                            ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40/20 shadow-xs"
                            : "border-slate-100 hover:border-slate-200 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60 dark:bg-slate-950/50"
                        }`}
                      >
                        <div className="flex items-center justify-between pb-1">
                          <span className="font-black text-[11px] text-indigo-600 flex items-center gap-1.5">
                            <span className={`w-4 h-4 rounded border flex items-center justify-center text-[8px] ${
                              isChecked ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                            }`}>
                              {isChecked && "✓"}
                            </span>
                            <span>পৃষ্ঠা নং {p.pageNumber}</span>
                          </span>
                          
                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-mono ${
                            p.extractionStatus === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          }`}>
                            {p.extractionStatus}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 font-medium line-clamp-2 leading-relaxed">
                          {p.extractedText || "কোনো এক্সট্রাক্ট করা টেক্সট পাওয়া যায়নি বা পৃষ্ঠাটি স্ক্যান করা চিত্র ছিল।"}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT COLUMN: CHOSEN VIEW CONTAINER */}
              <div className="lg:col-span-8 space-y-6">
                
                {/* SUBTAB VIEW: READER PREVIEW */}
                {activeWorkspaceTab === "reader" && (
                  <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4 max-h-[600px] overflow-y-auto">
                    <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 pb-2 border-b">ফাইল এক্সট্রাক্ট করা পাঠ্য রিডার</h3>
                    
                    {pagesList.filter(p => docPageChecklist.includes(p.pageNumber)).length === 0 ? (
                      <div className="text-center py-16 text-slate-400 space-y-2">
                        <FileText className="w-12 h-12 text-slate-200 mx-auto" />
                        <p>রিডারে দেখার জন্য বাম কলাম থেকে পৃষ্ঠা নির্বাচন করুন।</p>
                      </div>
                    ) : (
                      <div className="space-y-6 text-xs text-slate-700 dark:text-slate-300">
                        {pagesList.filter(p => docPageChecklist.includes(p.pageNumber)).map((p) => (
                          <div key={p.id} className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border space-y-2">
                            <div className="flex justify-between border-b pb-1">
                              <span className="font-black text-slate-900 dark:text-white">পৃষ্ঠা {p.pageNumber} (Extracted Text)</span>
                              <span className="text-[10px] text-slate-400 font-mono">{p.extractedText.split(/\s+/).length} শব্দ</span>
                            </div>
                            <p className="leading-relaxed whitespace-pre-wrap font-mono select-text selection:bg-indigo-200">
                              {p.extractedText}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* SUBTAB VIEW: COGNITIVE AI GENERATOR CONFIG */}
                {activeWorkspaceTab === "generator" && generatedQuestions.length === 0 && (
                  <form onSubmit={handleGroundedGenerate} className="bg-white dark:bg-slate-900 border rounded-2xl p-6 space-y-5 text-xs font-bold">
                    <div className="pb-3 border-b flex items-center justify-between">
                      <h3 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-indigo-600 fill-current" />
                        <span>সোর্স-গ্রাউন্ডেড এআই প্রশ্ন জেনারেটর প্রম্পটার</span>
                      </h3>
                      <span className="text-[10px] text-slate-400 font-mono">Page Range: {docPageChecklist.join(", ")}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300">জেনারেশন টপিক / ফোকাস এরিয়া *</label>
                        <input
                          type="text"
                          required
                          value={pdfGenTopic}
                          onChange={(e) => setPdfGenTopic(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                          placeholder="যেমন: ওহমের সূত্র ও রোধের সম্পর্ক"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300">প্রশ্নের টাইপ (Type) *</label>
                        <select
                          value={pdfGenType}
                          onChange={(e) => setPdfGenType(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        >
                          <option value="mcq_single">MCQ (একক সঠিক উত্তর)</option>
                          <option value="mcq_multiple">MCQ (বহু নির্বাচনী উত্তর)</option>
                          <option value="true_false">সত্য / মিথ্যা</option>
                          <option value="matching">বাম-ডান মিলকরণ</option>
                          <option value="ordering">ক্রম সাজানো</option>
                          <option value="fill_blank">শূন্যস্থান পূরণ</option>
                          <option value="short_answer">সংক্ষিপ্ত উত্তর মূলক</option>
                          <option value="image_choice">চিত্র ভিত্তিক চয়েস</option>
                          <option value="poll">পোল / জরিপ</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300">প্রশ্নের সংখ্যা</label>
                        <select
                          value={pdfGenCount}
                          onChange={(e) => setPdfGenCount(Number(e.target.value))}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        >
                          {[3, 5, 8, 10, 15].map(n => <option key={n} value={n}>{n}টি প্রশ্ন</option>)}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300">কঠিনতা</label>
                        <select
                          value={pdfGenDifficulty}
                          onChange={(e) => setPdfGenDifficulty(e.target.value)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        >
                          <option value="easy">সহজ (Easy)</option>
                          <option value="medium">মধ্যম (Medium)</option>
                          <option value="hard">কঠিন (Hard)</option>
                          <option value="mixed">মিশ্র (Mixed)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-700 dark:text-slate-300">ভাষা</label>
                        <select
                          value={pdfGenLanguage}
                          onChange={(e) => setPdfGenLanguage(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl"
                        >
                          <option value="Bangla">বাংলা (Bengali)</option>
                          <option value="English">English</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-slate-600 dark:text-slate-400">এআই প্রম্পট রুলস এবং বিশেষ দিকনির্দেশনা (ঐচ্ছিক)</label>
                      <textarea
                        rows={2}
                        value={pdfGenInstructions}
                        onChange={(e) => setPdfGenInstructions(e.target.value)}
                        placeholder="যেমন: অনুধাবন মূলক প্রশ্ন বেশি রাখুন বা জটিল শব্দ এড়ান..."
                        className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isGenerating}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center gap-2 font-black shadow-md disabled:bg-indigo-400 cursor-pointer"
                    >
                      {isGenerating ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>পিডিএফ পাঠ্য বিশ্লেষণ করে প্রশ্ন জেনারেট হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 fill-current animate-pulse" />
                          <span>পিডিএফ উৎস থেকে প্রশ্ন জেনারেট করুন</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* SHOWING DYNAMIC REVIEWWORKSPACE OF GENERATED QUESTIONS FROM PDF */}
                {activeWorkspaceTab === "generator" && generatedQuestions.length > 0 && (
                  <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 border rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-bold shadow-xs">
                      <div>
                        <h3 className="font-extrabold text-xs text-slate-950">
                          রিভিউ ওয়ার্কস্পেস: {generatedQuestions.length}টি এআই গ্রাউন্ডেড প্রশ্নপত্র
                        </h3>
                        <p className="text-[10px] text-slate-400 font-normal">
                          নিচের প্রশ্নগুলো সোর্স পিডিএফের নির্বাচিত পৃষ্ঠাগুলির উপর সম্পূর্ণ ভিত্তি করে রচিত হয়েছে।
                        </p>
                      </div>

                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => setGeneratedQuestions([])}
                          className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
                        >
                          আবার তৈরি করুন
                        </button>
                        <button
                          onClick={() => setShowAddToQuizModal(true)}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1 shadow-md"
                        >
                          <FileCheck className="w-4 h-4" />
                          <span>বাছাইকৃত প্রশ্ন সংরক্ষণ</span>
                        </button>
                      </div>
                    </div>

                    {/* INTERACTIVE QUESTION LIST WITH SOURCE CITATION PANEL */}
                    <div className="space-y-5">
                      {generatedQuestions.map((q, qIdx) => {
                        const isSelected = selectedQuestionIds.includes(q.id);
                        const isEditing = editingQuestionId === q.id;

                        return (
                          <div
                            key={q.id}
                            className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 transition-all space-y-4 shadow-xs relative ${
                              isSelected
                                ? "ring-2 ring-indigo-500/50 border-indigo-400"
                                : "border-slate-200/80 dark:border-slate-800"
                            }`}
                          >
                            {/* QUESTION HEADER ROW */}
                            <div className="flex items-center justify-between pb-2 border-b">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (isSelected) {
                                      setSelectedQuestionIds(selectedQuestionIds.filter(id => id !== q.id));
                                    } else {
                                      setSelectedQuestionIds([...selectedQuestionIds, q.id]);
                                    }
                                  }}
                                  className={`w-5 h-5 rounded border flex items-center justify-center text-xs font-black ${
                                    isSelected ? "bg-indigo-600 text-white border-indigo-600" : "border-slate-300 dark:border-slate-700"
                                  }`}
                                >
                                  {isSelected && "✓"}
                                </button>
                                <span className="text-[10px] font-black uppercase bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 px-2 py-0.5 rounded">
                                  প্রশ্ন {qIdx + 1} • {q.type.replace("_", " ")}
                                </span>
                                
                                <span className="text-[10px] font-black uppercase bg-amber-50 dark:bg-amber-950/40 text-amber-800 px-2 py-0.5 rounded">
                                  {q.difficulty}
                                </span>

                                {q.duplicateHash && (
                                  <span className="text-[9px] font-black bg-rose-50 dark:bg-rose-950/40 text-rose-700 px-2 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                                    <AlertCircle className="w-3 h-3" />
                                    <span>অনুরূপ প্রশ্ন ব্যাংকে আছে</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex gap-1">
                                <button
                                  onClick={() => {
                                    if (isEditing) {
                                      setEditingQuestionId(null);
                                    } else {
                                      setEditingQuestionId(q.id);
                                      setEditedText(q.questionText);
                                      setEditedExplanation(q.explanation);
                                      setEditedData(q.questionData);
                                    }
                                  }}
                                  className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-400"
                                >
                                  แก้ไข/ปรับปรุง (Edit/Refine)
                                </button>
                              </div>
                            </div>

                            {/* CORE QUESTION TEXT */}
                            {isEditing ? (
                              <div className="space-y-3 font-bold text-xs bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border">
                                <div className="space-y-1">
                                  <label className="text-slate-600 dark:text-slate-400">প্রশ্নের বিবরণ (Question Text):</label>
                                  <input
                                    type="text"
                                    value={editedText}
                                    onChange={(e) => setEditedText(e.target.value)}
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl font-bold"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="text-slate-600 dark:text-slate-400">উত্তরের ব্যাখ্যা (Explanation):</label>
                                  <textarea
                                    value={editedExplanation}
                                    onChange={(e) => setEditedExplanation(e.target.value)}
                                    rows={2}
                                    className="w-full p-2.5 bg-white dark:bg-slate-900 border rounded-xl"
                                  />
                                </div>

                                {/* AI REFINEMENT INPUT PROMPT */}
                                <div className="pt-2 border-t space-y-2">
                                  <label className="text-[10px] uppercase text-indigo-600 tracking-wider block font-bold">
                                    এআই দিয়ে সংশোধন বা পরিবর্তন নির্দেশ করুন (Instruction)
                                  </label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="যেমন: অপশনগুলোকে সহজ বাংলায় রূপান্তর করুন বা ভুল সংশোধন করুন..."
                                      value={refinementText}
                                      onChange={(e) => setRefinementText(e.target.value)}
                                      className="flex-1 p-2 bg-white dark:bg-slate-900 border rounded-xl text-xs"
                                    />
                                    <button
                                      type="button"
                                      disabled={isRefining === q.id}
                                      onClick={() => handleQuestionRefine(q.id)}
                                      className="px-3 py-2 bg-indigo-600 text-white rounded-xl text-xs flex items-center gap-1"
                                    >
                                      {isRefining === q.id ? "প্রক্রিয়াধীন..." : "রিফাইন"}
                                    </button>
                                  </div>
                                </div>

                                <div className="flex justify-end gap-1.5 pt-2">
                                  <button
                                    onClick={() => setEditingQuestionId(null)}
                                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border rounded-lg text-slate-600 dark:text-slate-400"
                                  >
                                    বাতিল
                                  </button>
                                  <button
                                    onClick={() => {
                                      setGeneratedQuestions(
                                        generatedQuestions.map((x) =>
                                          x.id === q.id
                                            ? { ...x, questionText: editedText, explanation: editedExplanation }
                                            : x
                                        )
                                      );
                                      setEditingQuestionId(null);
                                      showToast("প্রশ্ন সফলভাবে ড্রাফট সেভ হয়েছে।", "success");
                                    }}
                                    className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg"
                                  >
                                    সংরক্ষণ
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-2">
                                <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 leading-relaxed font-sans select-text">
                                  {q.questionText}
                                </h4>

                                {/* QUESTION TYPE SPECIFIC RENDERER */}
                                {q.questionData && q.questionData.options && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300 pt-1">
                                    {q.questionData.options.map((opt: string, optIdx: number) => {
                                      const isCorrect = 
                                        q.questionData.correctIndex === optIdx ||
                                        (Array.isArray(q.questionData.correctIndices) && q.questionData.correctIndices.includes(optIdx));
                                      return (
                                        <div
                                          key={optIdx}
                                          className={`p-2.5 rounded-xl border text-[11px] font-bold text-left flex items-start gap-2 ${
                                            isCorrect
                                              ? "bg-emerald-50 dark:bg-emerald-950/40/50 border-emerald-300 text-emerald-800"
                                              : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/80"
                                          }`}
                                        >
                                          <span className="font-black font-mono shrink-0 text-slate-400">
                                            {String.fromCharCode(65 + optIdx)}.
                                          </span>
                                          <span className="line-clamp-2">{opt}</span>
                                          {isCorrect && <Check className="w-3.5 h-3.5 text-emerald-600 ml-auto shrink-0 mt-0.5" />}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}

                                {/* TRUE / FALSE */}
                                {q.type === "true_false" && q.questionData && (
                                  <div className="flex gap-2 pt-1">
                                    <span className={`px-3 py-1.5 rounded-xl border font-black text-[11px] ${
                                      q.questionData.correctAnswer ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/80"
                                    }`}>
                                      সত্য (True) {q.questionData.correctAnswer && "✓"}
                                    </span>
                                    <span className={`px-3 py-1.5 rounded-xl border font-black text-[11px] ${
                                      !q.questionData.correctAnswer ? "bg-emerald-50 border-emerald-300 text-emerald-800" : "bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-slate-800/80"
                                    }`}>
                                      মিথ্যা (False) {!q.questionData.correctAnswer && "✓"}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* SOURCE CITATION ACCENT PANEL */}
                            {q.sourceExcerpt && (
                              <div className="bg-indigo-50/40 dark:bg-indigo-950/20 border-l-4 border-indigo-500 rounded-r-xl p-3.5 text-[11px] space-y-1.5">
                                <div className="flex items-center gap-1 text-indigo-800 dark:text-indigo-300 font-extrabold text-[10px]">
                                  <Quote className="w-3.5 h-3.5" />
                                  <span>পাঠ্যপুস্তক থেকে সরাসরি উদ্ধৃতি (Source Grounded Citation)</span>
                                  <span className="ml-auto bg-indigo-100 dark:bg-indigo-950 px-2 py-0.5 rounded font-black font-mono">
                                    পৃষ্ঠা নং {q.pageNumber}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 italic font-mono select-text font-medium leading-relaxed">
                                  &ldquo;{q.sourceExcerpt}&rdquo;
                                </p>
                              </div>
                            )}

                            {/* SOLUTION EXPLANATION */}
                            {!isEditing && q.explanation && (
                              <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1">
                                <span className="font-extrabold text-slate-700 dark:text-slate-300 shrink-0">ব্যাখ্যা (Solution):</span>
                                <span className="select-text font-medium">{q.explanation}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SUBTAB VIEW: GENERATION HISTORIC JOBS IN THIS PDF */}
                {activeWorkspaceTab === "history" && (
                  <div className="bg-white dark:bg-slate-900 border rounded-2xl p-5 space-y-4 max-h-[600px] overflow-y-auto">
                    <h3 className="font-extrabold text-xs text-slate-800 dark:text-slate-200 pb-2 border-b">এই পিডিএফ থেকে ইতোপূর্বে জেনারেটকৃত রেকর্ড তালিকা</h3>
                    
                    {workspaceJobs.length === 0 ? (
                      <div className="text-center py-16 text-slate-400 space-y-2">
                        <History className="w-12 h-12 text-slate-200 mx-auto" />
                        <p>এই ডকুমেন্ট হতে পূর্বে কোনো এআই প্রশ্ন তৈরি করা হয়নি।</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {workspaceJobs.map((job) => (
                          <div key={job.id} className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl border flex items-center justify-between text-xs font-bold">
                            <div>
                              <span className="font-black text-slate-900 dark:text-slate-100 block">{job.topic}</span>
                              <span className="text-[10px] text-slate-400 font-normal">
                                {new Date(job.createdAt).toLocaleString()} • {job.questionCount}টি প্রশ্ন • টাইপ: {job.questionType}
                              </span>
                            </div>
                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px]">
                              {job.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}

      {/* METADATA RE-EDIT FORM MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
          <form onSubmit={handleEditMetadataSubmit} className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 border space-y-4 text-xs font-bold">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-indigo-600" />
                <span>ডকুমেন্ট মেটাডাটা সংস্করণ করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300">ডকুমেন্ট শিরোনাম *</label>
                <input
                  type="text"
                  required
                  value={showEditModal.title}
                  onChange={(e) => setShowEditModal({ ...showEditModal, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400">বর্ণনা / বিবরণ</label>
                <textarea
                  value={showEditModal.description || ""}
                  onChange={(e) => setShowEditModal({ ...showEditModal, description: e.target.value })}
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">শ্রেণি</label>
                  <select
                    value={showEditModal.classId || "4"}
                    onChange={(e) => setShowEditModal({ ...showEditModal, classId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                  >
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nameBangla}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">বিষয়</label>
                  <select
                    value={showEditModal.subjectId || "1"}
                    onChange={(e) => setShowEditModal({ ...showEditModal, subjectId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                  >
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.nameBangla}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400">অধ্যায় / মডিউল (Chapter)</label>
                  <input
                    type="text"
                    value={showEditModal.chapter || ""}
                    onChange={(e) => setShowEditModal({ ...showEditModal, chapter: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400">টপিক / বিষয়বস্তু</label>
                  <input
                    type="text"
                    value={showEditModal.topic || ""}
                    onChange={(e) => setShowEditModal({ ...showEditModal, topic: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                disabled={isEditingMetadata}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              >
                {isEditingMetadata ? "আপডেট হচ্ছে..." : "মেটাডাটা আপডেট করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UPLOAD NEW TEXTBOOK PDF MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
          <form onSubmit={handleUploadSubmit} className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 border space-y-4 text-xs font-bold">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <UploadCloud className="w-4.5 h-4.5 text-indigo-600" />
                <span>নতুন পাঠ্যপুস্তক পিডিএফ লাইব্রেরিতে আপলোড করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* DRAG & DROP AREA */}
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => document.getElementById("pdf-file-upload")?.click()}
              className={`border-2 border-dashed p-6 rounded-2xl text-center cursor-pointer transition-all ${
                dragActive
                  ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40/30"
                  : uploadFile
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40/10"
                  : "border-slate-300 dark:border-slate-700 hover:border-slate-400 bg-slate-50 dark:bg-slate-950"
              }`}
            >
              <input
                id="pdf-file-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
                className="hidden"
              />
              <UploadCloud className={`w-10 h-10 mx-auto ${uploadFile ? "text-emerald-500" : "text-slate-400"}`} />
              
              {uploadFile ? (
                <div className="space-y-1.5 pt-2">
                  <p className="font-extrabold text-slate-950 text-xs">{uploadFile.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono">{(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-1 pt-2">
                  <p className="font-extrabold text-slate-800 dark:text-slate-200">পিডিএফ ফাইল ড্র্যাগ করে এখানে ড্রপ করুন অথবা ব্রাউজ করুন</p>
                  <p className="text-[10px] text-slate-400">সর্বোচ্চ আকার ২৫ মেগাবাইট (25MB)</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-slate-700 dark:text-slate-300">ডকুমেন্ট শিরোনাম (Title) *</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="যেমন: ৯ম শ্রেণি পদার্থবিজ্ঞান ৩য় অধ্যায়"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400">ডকুমেন্ট বিবরণ / ডেসক্রিপশন</label>
                <textarea
                  value={docDescription}
                  onChange={(e) => setDocDescription(e.target.value)}
                  placeholder="পিডিএফ এর মূল উদ্দেশ্য ও কভার তথ্য..."
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">টার্গেট শ্রেণি *</label>
                  <select
                    value={docClassId}
                    onChange={(e) => setDocClassId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                  >
                    <option value="">-- শ্রেণি সিলেক্ট করুন --</option>
                    {classes.map(c => <option key={c.id} value={c.id}>{c.nameBangla}</option>)}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 dark:text-slate-300">টার্গেট বিষয় *</label>
                  <select
                    value={docSubjectId}
                    onChange={(e) => setDocSubjectId(e.target.value)}
                    required
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                  >
                    <option value="">-- বিষয় সিলেক্ট করুন --</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.nameBangla}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400">অধ্যায় / মডিউল (Chapter - Optional)</label>
                  <input
                    type="text"
                    value={docChapter}
                    onChange={(e) => setDocChapter(e.target.value)}
                    placeholder="যেমন: ৩য় অধ্যায়"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-slate-400">পাঠ্য টপিক (Topic - Optional)</label>
                  <input
                    type="text"
                    value={docTopic}
                    onChange={(e) => setDocTopic(e.target.value)}
                    placeholder="যেমন: ওহমের সূত্র ও কারেন্ট"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                বাতিল করুন
              </button>
              <button
                type="submit"
                disabled={isUploading}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              >
                {isUploading ? "আপলোড হচ্ছে..." : "আপলোড শুরু করুন"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ADD QUESTIONS TO TARGET QUIZ MODAL */}
      {showAddToQuizModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs font-sans">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-indigo-600" />
                <span>টার্গেট কুইজ নির্বাচন করুন (Add to Quiz)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddToQuizModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:text-slate-400 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
              আপনি আপনার তৈরি করা **{selectedQuestionIds.length}টি প্রশ্ন** নিচের যেকোনো একটি লাইভ কুইজে সরাসরি কুইজ প্রশ্ন হিসেবে পাবলিশ করতে যাচ্ছেন।
            </p>

            <div className="space-y-3 font-bold text-xs">
              <div className="space-y-1">
                <label className="text-slate-600 dark:text-slate-400">কুইজের তালিকা (Quizzes):</label>
                <select
                  value={selectedQuizId}
                  onChange={(e) => setSelectedQuizId(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="">-- একটি কুইজ সিলেক্ট করুন --</option>
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title} ({quiz.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 text-xs font-bold">
              <button
                type="button"
                onClick={() => setShowAddToQuizModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
              >
                বাতিল করুন
              </button>
              <button
                type="button"
                onClick={handleAddSelectedToQuiz}
                disabled={isSavingSelected || !selectedQuizId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700"
              >
                {isSavingSelected ? "সংরক্ষণ হচ্ছে..." : "পাবলিশ ও কুইজে যোগ করুন"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
