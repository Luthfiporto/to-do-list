"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { 
  Check, 
  ListTodo, 
  Plus, 
  Trash2, 
  Edit3, 
  Search, 
  Calendar, 
  Sparkles, 
  Clock, 
  Copy, 
  Volume2, 
  VolumeX, 
  Bookmark, 
  Briefcase, 
  User, 
  ShoppingCart, 
  Flame, 
  GraduationCap, 
  CheckCircle2,
  X,
  RefreshCw,
  TrendingUp,
  Play,
  Pause,
  RotateCcw,
  Users,
  Target
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";

// Interface untuk data tugas
interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "tinggi" | "sedang" | "rendah";
  category: string;
  dueDate?: string;
  createdAt: string;
}

// Daftar kategori bawaan dengan ikon dan styling warna
const DEFAULT_CATEGORIES = [
  { name: "Pekerjaan", color: "text-blue-600 bg-blue-50 border-blue-100", labelColor: "bg-blue-600", icon: Briefcase },
  { name: "Pribadi", color: "text-purple-600 bg-purple-50 border-purple-100", labelColor: "bg-purple-600", icon: User },
  { name: "Belanja", color: "text-amber-600 bg-amber-50 border-amber-100", labelColor: "bg-amber-600", icon: ShoppingCart },
  { name: "Kesehatan", color: "text-emerald-600 bg-emerald-50 border-emerald-100", labelColor: "bg-emerald-600", icon: Flame },
  { name: "Belajar", color: "text-rose-600 bg-rose-50 border-rose-100", labelColor: "bg-rose-600", icon: GraduationCap },
];

const PRESET_TASKS: Task[] = [
  {
    id: "demo-1",
    title: "Membaca penjelasan detail arsitektur Next.js 15",
    completed: false,
    priority: "tinggi",
    category: "Belajar",
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Besok
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-2",
    title: "Menyiapkan berkas rapat tinjauan bulanan tim",
    completed: false,
    priority: "tinggi",
    category: "Pekerjaan",
    dueDate: new Date().toISOString().split('T')[0], // Hari ini
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo-3",
    title: "Belanja mingguan: sayuran sehat, susu oat, kopi",
    completed: true,
    priority: "sedang",
    category: "Belanja",
    dueDate: new Date().toISOString().split('T')[0],
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: "demo-4",
    title: "Olahraga kardio ringan & peregangan pagi",
    completed: false,
    priority: "rendah",
    category: "Kesehatan",
    dueDate: "",
    createdAt: new Date().toISOString(),
  }
];

export default function TodoPage() {
  // Core List States
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Focus Timer/Pomodoro States
  const [focusSeconds, setFocusSeconds] = useState(1500); // 25 menit
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dynamic Client-side Clock State
  const [currentTime, setCurrentTime] = useState("");

  // New task form states
  const [newTitle, setNewTitle] = useState("");
  const [newPriority, setNewPriority] = useState<"tinggi" | "sedang" | "rendah">("sedang");
  const [newCategory, setNewCategory] = useState("Pekerjaan");
  const [newDueDate, setNewDueDate] = useState("");

  // Filter and search states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"semua" | "aktif" | "selesai">("semua");
  const [filterPriority, setFilterPriority] = useState<"semua" | "tinggi" | "sedang" | "rendah">("semua");
  const [filterCategory, setFilterCategory] = useState("semua");
  const [sortBy, setSortBy] = useState<"terbaru" | "terlama" | "prioritas" | "tenggat">("terbaru");

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

  // Toast / Status notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial states and launch clock interval
  useEffect(() => {
    // 1. Storage setup
    const stored = localStorage.getItem("ais_todos_tasks");
    const storedSound = localStorage.getItem("ais_todos_sound");
    
    let loadedTasks = PRESET_TASKS;
    if (stored) {
      try {
        loadedTasks = JSON.parse(stored);
      } catch (_) {
        loadedTasks = PRESET_TASKS;
      }
    } else {
      localStorage.setItem("ais_todos_tasks", JSON.stringify(PRESET_TASKS));
    }

    let isSoundOn = true;
    if (storedSound !== null) {
      isSoundOn = storedSound === "true";
    }

    // Set state safely (async setTimeout delay to prevent cascading renders)
    setTimeout(() => {
      setTasks(loadedTasks);
      setSoundEnabled(isSoundOn);
      setIsLoaded(true);
    }, 0);

    // 2. Real-time Clock tick
    const tickClock = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tickClock();
    const clockInterval = setInterval(tickClock, 1000);

    return () => {
      clearInterval(clockInterval);
    };
  }, []);

  // Pomodoro Countdown Logic
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setFocusSeconds((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            playStateChime("complete");
            showToast("Sesi Fokus Berakhir! Beristirahatlah sejenak ☕");
            return 1500;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTimerRunning]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    playStateChime("add");
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setFocusSeconds(1500);
    playStateChime("delete");
  };

  // Save tasks to localStorage on change
  const saveToLocalStorage = (updatedTasks: Task[]) => {
    localStorage.setItem("ais_todos_tasks", JSON.stringify(updatedTasks));
    setTasks(updatedTasks);
  };

  // Sound feedback synthesizer
  function playStateChime(type: "complete" | "delete" | "add") {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      const playTone = (freq: number, start: number, duration: number, toneType: OscillatorType = "sine", volumeScale = 0.05) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = toneType;
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(volumeScale, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.start(start);
        osc.stop(start + duration);
      };

      const now = ctx.currentTime;
      if (type === "complete") {
        playTone(523.25, now, 0.12, "sine", 0.06); // C5
        playTone(659.25, now + 0.06, 0.12, "sine", 0.06); // E5
        playTone(880.00, now + 0.12, 0.22, "sine", 0.06); // A5
      } else if (type === "delete") {
        playTone(392.00, now, 0.1, "triangle", 0.05); // G4
        playTone(293.66, now + 0.05, 0.15, "triangle", 0.05); // D4
      } else if (type === "add") {
        playTone(587.33, now, 0.08, "sine", 0.04); // D5
        playTone(783.99, now + 0.04, 0.15, "sine", 0.05); // G5
      }
    } catch (_) {
      // Audio autoplay blocked before user gesture
    }
  }

  // Show status notification
  function showToast(message: string) {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  }

  // Toggle sound setting
  const toggleSound = () => {
    const nextState = !soundEnabled;
    setSoundEnabled(nextState);
    localStorage.setItem("ais_todos_sound", String(nextState));
    showToast(nextState ? "Suara diaktifkan 🔊" : "Suara dimatikan 🔇");
  };

  // Action: Add new task
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: Task = {
      id: "task-" + Date.now(),
      title: newTitle.trim(),
      completed: false,
      priority: newPriority,
      category: newCategory,
      dueDate: newDueDate || undefined,
      createdAt: new Date().toISOString(),
    };

    const updated = [newTask, ...tasks];
    saveToLocalStorage(updated);
    
    // Clear form
    setNewTitle("");
    setNewDueDate("");
    
    playStateChime("add");
    showToast("Tugas berhasil ditambahkan ✨");
  };

  // Action: Toggle completion
  const handleToggleComplete = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextState = !t.completed;
        if (nextState) {
          playStateChime("complete");
        }
        return { ...t, completed: nextState };
      }
      return t;
    });
    saveToLocalStorage(updated);
  };

  // Action: Simple deletion
  const handleDeleteTask = (id: string, title: string) => {
    const updated = tasks.filter(t => t.id !== id);
    saveToLocalStorage(updated);
    playStateChime("delete");
    showToast(`"${title.slice(0, 15)}..." dihapus 🗑️`);
  };

  // Action: Toggle Inline Editing
  const startEditing = (id: string, text: string) => {
    setEditingId(id);
    setEditingTitle(text);
  };

  const handleSaveEdit = (id: string) => {
    if (!editingTitle.trim()) return;
    const updated = tasks.map(t => {
      if (t.id === id) {
        return { ...t, title: editingTitle.trim() };
      }
      return t;
    });
    saveToLocalStorage(updated);
    setEditingId(null);
    showToast("Tugas berhasil diperbarui!");
  };

  // Action: Duplicate Task
  const handleDuplicateTask = (task: Task) => {
    const duplicated: Task = {
      ...task,
      id: "task-" + Date.now(),
      title: `${task.title} (Salinan)`,
      completed: false,
      createdAt: new Date().toISOString(),
    };
    const updated = [duplicated, ...tasks];
    saveToLocalStorage(updated);
    playStateChime("add");
    showToast("Tugas disalin 📋");
  };

  // Action: Load Mock Presets
  const handleLoadPresets = () => {
    saveToLocalStorage(PRESET_TASKS);
    showToast("Metode latihan dimuat ulang 🔄");
  };

  // Action: Clear completed tasks
  const handleClearCompleted = () => {
    const completedCount = tasks.filter(t => t.completed).length;
    if (completedCount === 0) {
      showToast("Tidak ada tugas selesai yang perlu dihapus");
      return;
    }
    const updated = tasks.filter(t => !t.completed);
    saveToLocalStorage(updated);
    playStateChime("delete");
    showToast(`${completedCount} tugas selesai dibersihkan! 🧹`);
  };

  // Action: Clear all tasks
  const handleClearAll = () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus semua tugas?")) {
      saveToLocalStorage([]);
      showToast("Semua tugas dibersihkan!");
    }
  };

  // Helper date formatter
  const formattedToday = useMemo(() => {
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const months = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    const today = new Date();
    return `${days[today.getDay()]}, ${today.getDate()} ${months[today.getMonth()]}`;
  }, []);

  // Compute stats
  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;
    const active = total - completed;
    const completionPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const highCount = tasks.filter(t => !t.completed && t.priority === "tinggi").length;
    const mediumCount = tasks.filter(t => !t.completed && t.priority === "sedang").length;
    const lowCount = tasks.filter(t => !t.completed && t.priority === "rendah").length;

    return { total, completed, active, completionPercentage, highCount, mediumCount, lowCount };
  }, [tasks]);

  // Derived Category List from data to keep sidebar filters smart
  const activeCategories = useMemo(() => {
    const list = new Set<string>();
    tasks.forEach(t => {
      if (t.category) list.add(t.category);
    });
    return Array.from(list);
  }, [tasks]);

  // Filter & Sort core pipeline
  const filteredAndSortedTasks = useMemo(() => {
    let result = [...tasks];

    // 1. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.title.toLowerCase().includes(q));
    }

    // 2. Filter by Completion State
    if (filterStatus === "aktif") {
      result = result.filter(t => !t.completed);
    } else if (filterStatus === "selesai") {
      result = result.filter(t => t.completed);
    }

    // 3. Filter by Priority State
    if (filterPriority !== "semua") {
      result = result.filter(t => t.priority === filterPriority);
    }

    // 4. Filter by Category
    if (filterCategory !== "semua") {
      result = result.filter(t => t.category === filterCategory);
    }

    // 5. Apply Sorter
    result.sort((a, b) => {
      if (sortBy === "terbaru") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      if (sortBy === "terlama") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortBy === "tenggat") {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      if (sortBy === "prioritas") {
        const priorityWeight = { tinggi: 3, sedang: 2, rendah: 1 };
        return priorityWeight[b.priority] - priorityWeight[a.priority];
      }
      return 0;
    });

    return result;
  }, [tasks, searchQuery, filterStatus, filterPriority, filterCategory, sortBy]);

  // Format Helper for seconds -> "MM:SS"
  const formatTimer = (totSeconds: number) => {
    const minutes = Math.floor(totSeconds / 60);
    const seconds = totSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#f8fafc]">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-sm font-medium text-slate-500 font-sans">Memuat Agenda Anda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans p-4 sm:p-6 md:p-8" id="bento-screen-container">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900 border border-slate-800 text-slate-100 shadow-xl px-5 py-3 rounded-full flex items-center space-x-3 text-xs font-semibold"
            id="global-toast-notif"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto flex flex-col" id="bento-max-container">
        
        {/* Master Bento Header */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4" id="bento-header-pane">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100 flex items-center justify-center">
              <ListTodo className="w-6 h-6 stroke-[2.5]" id="app-logo-icon" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold font-display text-slate-900 tracking-tight" id="app-brand-name">
                Daftar Tugas.
              </h1>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">Asisten Produktivitas Lokal</p>
            </div>
          </div>

          <div className="flex items-center space-x-4 self-stretch sm:self-auto justify-between sm:justify-end border-t border-slate-100 sm:border-0 pt-3 sm:pt-0" id="header-interactive-block">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-900">{formattedToday}</p>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                {stats.active} Tugas Tersisa
              </p>
            </div>
            
            <div className="flex items-center space-x-2" id="utility-audio-action">
              <button
                onClick={toggleSound}
                className={cn(
                  "p-2.5 rounded-xl border transition-all duration-200 cursor-pointer shadow-xs",
                  soundEnabled 
                    ? "bg-indigo-50 border-indigo-100 text-indigo-600 hover:bg-indigo-100/60"
                    : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50"
                )}
                title={soundEnabled ? "Matikan suara interaksi" : "Nyalakan suara interaksi"}
                id="sound-toggle-btn"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>
              <button
                onClick={handleLoadPresets}
                className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl transition-all cursor-pointer flex items-center space-x-1 text-xs font-bold shadow-xs"
                title="Muat ulang contoh data latihan"
                id="reload-presets-btn"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Latihan</span>
              </button>
            </div>
          </div>
        </header>

        {/* Master Responsive Bento Grid Layout System */}
        <div className="grid grid-cols-12 gap-6" id="bento-grid-dashboard">
          
          {/* LEFT SUB-GRID: Focus Work (List & Forms Component, row span equivalents) */}
          <div className="col-span-12 lg:col-span-7 flex flex-col gap-6" id="bento-column-left">
            
            {/* Task list core canvas block */}
            <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xs border border-slate-150 flex flex-col" id="bento-tasks-list-box">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                    <Target className="w-5 h-5 text-indigo-600" />
                    <span>Daftar Fokus</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">Kelola tugas harian dan pencapaian Anda</p>
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-extrabold rounded-full uppercase tracking-wider border border-indigo-100 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse"></span>
                  Sesi Aktif
                </span>
              </div>

              {/* Filtering & Sorting dashboard within task list container */}
              <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 mb-6 space-y-3" id="inner-filter-container">
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Search bar inside list box to maximize screen utility */}
                  <div className="relative flex-1" id="search-input-wrapper">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Cari kata kunci tugas..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-xs font-semibold outline-hidden transition-all"
                      id="search-tasks-input"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                        id="clear-search-btn"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status checklist selection (Semua, Aktif, Selesai) */}
                  <div className="flex rounded-xl bg-slate-200/60 p-1 shrink-0" id="status-filter-group">
                    {(["semua", "aktif", "selesai"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={cn(
                          "px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all cursor-pointer",
                          filterStatus === status
                            ? "bg-white text-indigo-700 shadow-xs"
                            : "text-slate-500 hover:text-slate-800"
                        )}
                        id={`status-tab-${status}`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional controls: category filter, priority filter, sorter dropdown in neat flex list */}
                <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-slate-200/40 text-[11px]" id="selectors-column">
                  
                  {/* Sorter selection */}
                  <div className="flex items-center space-x-1" id="sorting-dropdown-box">
                    <span className="font-semibold text-slate-400">Urutan:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-600 focus:outline-hidden hover:border-slate-300 cursor-pointer text-xs"
                      id="sorting-select"
                    >
                      <option value="terbaru">Terbaru</option>
                      <option value="terlama">Terlama</option>
                      <option value="prioritas">Prioritas</option>
                      <option value="tenggat">Tenggat</option>
                    </select>
                  </div>

                  {/* Priority selector */}
                  <div className="flex items-center space-x-1" id="priority-filter-box">
                    <span className="font-semibold text-slate-400">Prioritas:</span>
                    <select
                      value={filterPriority}
                      onChange={(e) => setFilterPriority(e.target.value as any)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-600 focus:outline-hidden hover:border-slate-300 cursor-pointer text-xs"
                      id="filter-priority-select"
                    >
                      <option value="semua">Semua</option>
                      <option value="tinggi">Tinggi</option>
                      <option value="sedang">Sedang</option>
                      <option value="rendah">Rendah</option>
                    </select>
                  </div>

                  {/* Category selector */}
                  <div className="flex items-center space-x-1" id="category-filter-box">
                    <span className="font-semibold text-slate-400">Kategori:</span>
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 font-bold text-slate-600 focus:outline-hidden hover:border-slate-300 cursor-pointer text-xs"
                      id="filter-category-select"
                    >
                      <option value="semua">Semua</option>
                      {DEFAULT_CATEGORIES.map(c => (
                        <option key={c.name} value={c.name}>{c.name}</option>
                      ))}
                      {activeCategories
                        .filter(c => !DEFAULT_CATEGORIES.some(dc => dc.name === c))
                        .map(customCat => (
                          <option key={customCat} value={customCat}>{customCat}</option>
                        ))
                      }
                    </select>
                  </div>

                </div>
              </div>

              {/* Tasks List Loop Panel */}
              <div className="space-y-3 min-h-[220px]" id="tasks-items-grid">
                <AnimatePresence initial={false}>
                  {filteredAndSortedTasks.length > 0 ? (
                    filteredAndSortedTasks.map((task) => {
                      const isEditing = editingId === task.id;
                      
                      const catObj = DEFAULT_CATEGORIES.find(c => c.name === task.category);
                      const categoryStyle = catObj ? catObj.color : "bg-slate-100 text-slate-600 border-slate-200";
                      const CategoryIcon = catObj ? catObj.icon : Bookmark;

                      const priorityBadgeStyle = 
                        task.priority === "tinggi" 
                          ? "bg-red-50 text-red-600 border-red-100" 
                          : task.priority === "sedang"
                          ? "bg-amber-50 text-amber-700 border-amber-100"
                          : "bg-emerald-50 text-emerald-600 border-emerald-100";

                      // Calculate friendly dates
                      const getDueDateStatus = (dateStr?: string) => {
                        if (!dateStr) return null;
                        const todayStr = new Date().toISOString().split('T')[0];
                        if (dateStr === todayStr) return { text: "Hari ini", style: "text-amber-600 bg-amber-50 border-amber-100 font-bold" };
                        
                        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
                        if (dateStr === tomorrowStr) return { text: "Besok", style: "text-blue-600 bg-blue-50 border-blue-100 font-bold" };
                        
                        const isOverdue = new Date(dateStr).getTime() < new Date(todayStr).getTime();
                        if (isOverdue) return { text: "Terlewat", style: "text-red-600 bg-red-50 border-red-150 animate-pulse font-bold" };
                        
                        const dateParts = dateStr.split('-');
                        if (dateParts.length === 3) {
                          const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
                          return { text: `${parseInt(dateParts[2])} ${monthNames[parseInt(dateParts[1]) - 1]}`, style: "text-slate-500 bg-slate-100 border-slate-150" };
                        }
                        return { text: dateStr, style: "text-slate-500 bg-slate-100 border-slate-150" };
                      };

                      const dateStatus = getDueDateStatus(task.dueDate);

                      return (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.2 }}
                          className={cn(
                            "p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all duration-300",
                            task.completed 
                              ? "bg-[#fafbfc] border-slate-150/80 opacity-65" 
                              : "bg-white border-slate-100 shadow-xs hover:border-slate-300 hover:shadow-md"
                          )}
                          id={`task-item-${task.id}`}
                        >
                          {/* Left: Complete Checkbox + Title block */}
                          <div className="flex items-start space-x-3.5 flex-1 min-w-0" id={`task-item-left-${task.id}`}>
                            <button
                              onClick={() => handleToggleComplete(task.id)}
                              className={cn(
                                "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-xs",
                                task.completed
                                  ? "bg-indigo-600 border-indigo-600 text-white"
                                  : "bg-white border-slate-300 hover:border-indigo-500 hover:bg-slate-50"
                              )}
                              id={`task-check-${task.id}`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>

                            <div className="flex-1 min-w-0">
                              {isEditing ? (
                                <div className="flex items-center space-x-2 w-full mt-0.5" id={`task-item-editing-${task.id}`}>
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) => setEditingTitle(e.target.value)}
                                    className="w-full px-2.5 py-1.5 bg-white border-2 border-indigo-500 rounded-xl text-sm font-bold text-slate-800 focus:outline-hidden"
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSaveEdit(task.id);
                                      if (e.key === "Escape") setEditingId(null);
                                    }}
                                    autoFocus
                                    id={`task-editor-input-${task.id}`}
                                  />
                                  <button
                                    onClick={() => handleSaveEdit(task.id)}
                                    className="px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 cursor-pointer shadow-xs whitespace-nowrap"
                                    id={`task-save-edit-${task.id}`}
                                  >
                                    OK
                                  </button>
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                                    id={`task-cancel-edit-${task.id}`}
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div>
                                  <p className={cn(
                                    "text-[14px] font-bold text-slate-800 leading-snug break-words pr-2",
                                    task.completed && "text-slate-400 line-through decoration-slate-300 decoration-2"
                                  )} id={`task-title-text-${task.id}`}>
                                    {task.title}
                                  </p>

                                  {/* Badges block */}
                                  <div className="flex flex-wrap gap-2 mt-2" id={`task-badges-${task.id}`}>
                                    <span className={cn(
                                      "inline-flex items-center space-x-1 px-2.5 py-0.5 text-[10px] font-bold rounded-lg border",
                                      categoryStyle
                                    )}>
                                      <CategoryIcon className="w-3 h-3" />
                                      <span>{task.category}</span>
                                    </span>

                                    <span className={cn(
                                      "inline-flex items-center px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-widest rounded-lg border",
                                      priorityBadgeStyle
                                    )}>
                                      {task.priority}
                                    </span>

                                    {dateStatus && (
                                      <span className={cn(
                                        "inline-flex items-center space-x-1 px-2 py-0.5 text-[10px] font-semibold rounded-lg border",
                                        dateStatus.style
                                      )}>
                                        <Calendar className="w-3 h-3" />
                                        <span>{dateStatus.text}</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Right: Quick action buttons */}
                          <div className="flex items-center justify-end space-x-1 shadow-2xs self-end sm:self-auto" id={`task-actions-${task.id}`}>
                            {!task.completed && !isEditing && (
                              <button
                                onClick={() => startEditing(task.id, task.title)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all cursor-pointer"
                                title="Sunting"
                                id={`task-action-edit-${task.id}`}
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {!isEditing && (
                              <button
                                onClick={() => handleDuplicateTask(task)}
                                className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-slate-50 rounded-xl transition-all cursor-pointer"
                                title="Duplikat"
                                id={`task-action-duplicate-${task.id}`}
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteTask(task.id, task.title)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-[#fff1f2] rounded-xl transition-all cursor-pointer"
                              title="Hapus"
                              id={`task-action-delete-${task.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    /* Elegant Custom empty state container mimicking Focus view */
                    <motion.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="py-12 px-4 flex flex-col items-center justify-center text-center bg-white border border-slate-100 rounded-3xl"
                      id="empty-state-card"
                    >
                      <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100 shadow-xs">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-800" id="empty-state-title">
                        {searchQuery || filterPriority !== "semua" || filterCategory !== "semua" || filterStatus !== "semua"
                          ? "Tidak Ada Hasil Pencocokan"
                          : "Semua Agenda Selesai Direnovasi"
                        }
                      </h3>
                      <p className="text-xs text-slate-400 max-w-xs mt-1" id="empty-state-desc">
                        {searchQuery || filterPriority !== "semua" || filterCategory !== "semua" || filterStatus !== "semua"
                          ? "Periksa ejaan kata kunci atau ubah pengaturan dropdown penyaringan di baris filter."
                          : "Kerja luar biasa! Tidak ada tanggungan agenda yang tersisa. Tarik napas sehat atau rekam agenda baru."
                        }
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery("");
                          setFilterStatus("semua");
                          setFilterPriority("semua");
                          setFilterCategory("semua");
                        }}
                        className="mt-4 px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[11px] font-bold transition-all cursor-pointer"
                        id="reset-filters-btn"
                      >
                        Reset Filter
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* List Footer Bulk Clear controllers */}
              <div className="mt-8 pt-5 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs" id="list-inner-header">
                <span className="font-semibold text-slate-400">
                  Total Terdaftar: <span className="text-slate-700">{filteredAndSortedTasks.length}</span> tugas tersaring
                </span>
                <div className="flex items-center space-x-3 text-slate-300">
                  <button
                    onClick={handleClearCompleted}
                    className="font-bold text-indigo-600 hover:text-indigo-800 transition-all cursor-pointer flex items-center gap-1"
                    id="clear-completed-btn"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bersihkan Selesai</span>
                  </button>
                  <span>•</span>
                  <button
                    onClick={handleClearAll}
                    className="font-bold text-rose-500 hover:text-rose-700 transition-all cursor-pointer flex items-center gap-1"
                    id="clear-all-btn"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus Semua</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Core Box: Create New Task Form as a Bento card block */}
            <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xs border border-slate-150" id="task-creator-layoutBox">
              <h2 className="text-md font-extrabold text-slate-900 mb-4 flex items-center space-x-2" id="task-creator-heading">
                <Plus className="w-4 h-4 text-indigo-600 stroke-[3]" />
                <span>Buat Agenda Baru</span>
              </h2>

              <form onSubmit={handleAddTask} className="space-y-4" id="task-creation-form">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Beli kopi arabika, revisi alur kerja UI..."
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-2xl text-xs font-semibold outline-hidden transition-all duration-200 text-slate-800"
                    required
                    id="new-task-title-input"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="meta-selectors-container">
                  {/* Select Priority Block */}
                  <div className="flex flex-col" id="priority-selector-box">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Prioritas</span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(["rendah", "sedang", "tinggi"] as const).map((p) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setNewPriority(p)}
                          className={cn(
                            "py-2 text-[11px] font-bold capitalize rounded-xl border transition-all cursor-pointer",
                            newPriority === p
                              ? p === "tinggi"
                                ? "bg-red-50 border-red-200 text-red-600 font-extrabold"
                                : p === "sedang"
                                ? "bg-amber-50 border-amber-200 text-amber-700 font-extrabold"
                                : "bg-emerald-50 border-emerald-200 text-emerald-600 font-extrabold"
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-500"
                          )}
                          id={`priority-btn-${p}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Choose Category */}
                  <div className="flex flex-col" id="category-selector-box">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Kategori</span>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-[#818cf8] cursor-pointer h-[38px] hover:border-slate-300"
                      id="task-category-select"
                    >
                      {DEFAULT_CATEGORIES.map((cat) => (
                        <option key={cat.name} value={cat.name}>
                          {cat.name}
                        </option>
                      ))}
                      {activeCategories
                        .filter(c => !DEFAULT_CATEGORIES.some(dc => dc.name === c))
                        .map(customCat => (
                          <option key={customCat} value={customCat}>
                            {customCat}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {/* Choose Date Target */}
                  <div className="flex flex-col" id="due-date-selector-box">
                    <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 mb-1.5">Tenggat Waktu</span>
                    <input
                      type="date"
                      value={newDueDate}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer h-[38px] focus:outline-[#818cf8] hover:border-slate-300"
                      id="task-due-date-input"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={!newTitle.trim()}
                    className="w-full px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all shadow-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    id="add-task-submit-btn"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Tambahkan Agenda Sekarang</span>
                  </button>
                </div>
              </form>
            </div>

          </div>

          {/* RIGHT SUB-GRID: Bento Compartments (Widgets & Dashboards, row & col spanning equivalents) */}
          <div className="col-span-12 lg:col-span-5 flex flex-col gap-6" id="bento-column-right">
            
            {/* COMPARTMENT 1: Dynamic Daily Progress (Indigo Theme Card matching Design HTML) */}
            <div className="bg-indigo-600 rounded-[32px] p-8 text-white relative overflow-hidden shadow-md shadow-indigo-100 flex flex-col justify-between min-h-[220px]" id="stat-card-done">
              <div className="relative z-10">
                <p className="text-indigo-200 text-xs font-extrabold uppercase tracking-widest mb-1">
                  Pencapaian Harian
                </p>
                <div className="flex items-baseline space-x-2 mt-2">
                  <h3 className="text-6xl font-extrabold font-display tracking-tight">
                    {stats.completionPercentage}%
                  </h3>
                </div>
                <p className="text-indigo-100 text-xs font-semibold mt-4 max-w-xs leading-relaxed">
                  {stats.completionPercentage >= 100 
                    ? "Sempurna! Semua tugas tuntas. Anda siap merayakan pencapaian hari ini 🎉." 
                    : stats.completionPercentage >= 50
                    ? "Kerja bagus! Lebih dari separuh tugas telah tuntas, pertahankan konsistensi Anda."
                    : "Langkah kecil membawa kemajuan besar. Tuntaskan satu per satu tugas di bawah ini."}
                </p>
                <p className="text-[11px] text-indigo-200/80 mt-2 font-semibold">
                  {stats.completed} dari {stats.total} tugas terselesaikan.
                </p>
              </div>

              {/* Circular SVG Track decoration reflecting the 68% progress circle in design html */}
              <div className="absolute bottom-4 right-4 opacity-15 hidden sm:block pointer-events-none" id="decorative-bento-ring">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    className="text-indigo-800"
                  />
                  <circle
                    cx="56"
                    cy="56"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={276}
                    strokeDashoffset={276 - (276 * stats.completionPercentage) / 100}
                    className="text-white"
                  />
                </svg>
              </div>
            </div>

            {/* COMPARTMENT 2: Deep Focus Pomodoro Timer (Emerald Theme Card matching Design HTML) */}
            <div className="bg-emerald-500 rounded-[32px] p-8 text-white flex flex-col justify-between shadow-md shadow-emerald-50/50 min-h-[220px] relative overflow-hidden" id="bento-focus-timer">
              <div className="flex justify-between items-start">
                <div className="bg-white/20 p-2.5 rounded-2xl flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white" />
                </div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-600/60 px-3 py-1 rounded-full border border-emerald-400/40">
                  Deep Focus
                </span>
              </div>

              <div className="my-5" id="timer-text-display">
                <h3 className="text-5xl font-extrabold tracking-tight font-display">
                  {formatTimer(focusSeconds)}
                </h3>
                <p className="text-emerald-100 text-xs font-semibold mt-1">
                  {isTimerRunning ? "Sesi fokus sedang berjalan • Tetap tenang" : "Sesi Pomodoro 25 Menit Standar"}
                </p>
              </div>

              {/* Interactive buttons to pause/play and restore focus clock */}
              <div className="flex items-center space-x-2 pt-2 border-t border-emerald-400/35" id="timer-controls">
                <button
                  onClick={toggleTimer}
                  className="px-4 py-2 bg-white text-emerald-600 hover:bg-emerald-50 rounded-xl text-xs font-extrabold flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
                  id="timer-play-btn"
                >
                  {isTimerRunning ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  <span>{isTimerRunning ? "Jeda" : "Mulai"}</span>
                </button>

                <button
                  onClick={resetTimer}
                  className="p-2 bg-emerald-600 hover:bg-emerald-700 text-emerald-100 rounded-xl text-xs font-semibold cursor-pointer transition-all"
                  title="Atur Ulang Pengukur"
                  id="timer-reset-btn"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* COMPARTMENT 3: Date & Live UTC Clock (Slate Theme Card matching Design HTML) */}
            <div className="bg-slate-900 rounded-[32px] p-8 text-white flex flex-col items-center justify-center text-center shadow-md shadow-slate-950/20 relative overflow-hidden min-h-[160px]" id="stat-card-priority">
              <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">
                Kalender & Waktu
              </span>
              <div className="text-5xl font-extrabold text-white font-display tracking-tight" id="live-utc-hour">
                {currentTime || "00:00"}
              </div>
              
              <div className="mt-4 pt-4 border-t border-slate-800 w-full flex justify-between items-center text-[11px] text-slate-450 font-semibold px-2">
                <span className="capitalize">{formattedToday}</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Bebas Hambatan
                </span>
              </div>
            </div>

            {/* COMPARTMENT 4: Team members & Active projects mockup (White Card matching Design HTML) */}
            <div className="bg-white rounded-[32px] p-6 sm:p-8 shadow-xs border border-slate-100 flex items-center justify-between min-h-[100px]" id="bento-collaborators-card">
              <div className="flex -space-x-3" id="mockup-avatar-stack">
                <div className="w-10 h-10 rounded-full bg-pink-100 border-4 border-white flex items-center justify-center font-extrabold text-xs text-pink-600">JD</div>
                <div className="w-10 h-10 rounded-full bg-blue-100 border-4 border-white flex items-center justify-center font-extrabold text-xs text-blue-600">MK</div>
                <div className="w-10 h-10 rounded-full bg-amber-100 border-4 border-white flex items-center justify-center font-extrabold text-xs text-amber-600">SR</div>
                <div className="w-10 h-10 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center font-extrabold text-[10px] text-slate-500 bg-slate-100">+4</div>
              </div>

              <div className="text-right">
                <p className="text-xs font-extrabold text-slate-800 flex items-center gap-1 justify-end">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Proyek Alpha</span>
                </p>
                <p className="text-[10px] font-semibold text-slate-400">7 Rekan Aktif Membantu</p>
              </div>
            </div>

          </div>

        </div>

        {/* Exquisite minimal human-facing signature indicator to highlight craft without telemetry noise */}
        <footer className="mt-12 text-center text-[10px] text-slate-400 font-extrabold tracking-wide uppercase" id="credit-footer">
          Didesain dengan Bento Grid • Data Tersimpan Mandiri di Peramban Lokal Anda
        </footer>

      </div>
    </div>
  );
}
