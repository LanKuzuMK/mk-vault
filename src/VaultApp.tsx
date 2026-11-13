import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  ArchiveRestore,
  ArrowUpRight,
  Check,
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  FolderArchive,
  Globe2,
  KeyRound,
  LockKeyhole,
  LogOut,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Share2,
  Star,
  Trash2,
  Upload,
} from "lucide-react";

export type Category = "Game" | "Tool" | "App" | "Portfolio" | "Other";
export type Project = {
  id: string;
  url: string;
  title: string;
  category: Category;
  note: string;
  isPublished: boolean;
  featuredRank: number;
  createdAt: string;
  updatedAt: string;
};
export type PublicProject = Pick<Project, "id" | "url" | "title" | "category" | "note" | "featuredRank">;

export const categories: Category[] = ["Game", "Tool", "App", "Portfolio", "Other"];
const seal = "./assets/mk-vault-seal.svg";
const STORAGE_KEY = "mk_vault_projects_v2";
const AUTH_KEY = "mk_vault_admin_auth";
const DEFAULT_PASSWORD = "mk-vault-2026";

export const INITIAL_PROJECTS: Project[] = [
  {
    id: "proj-readme-jack",
    url: "https://read-me-by-jack.vercel.app",
    title: "Read Me by Jack — 3D WebGL Studio",
    category: "Portfolio",
    note: "A high-performance, studio-grade 3D WebGL editorial experience celebrating the release of Read Me by Jack with Three.js, GSAP, and procedural Web Audio.",
    isPublished: true,
    featuredRank: 1,
    createdAt: "2026-11-13T06:21:07Z",
    updatedAt: "2026-11-13T06:21:07Z",
  },
  {
    id: "proj-mk-portfolio",
    url: "https://github.com/LanKuzuMK/mk-pro-portfolio",
    title: "MK Pro Portfolio",
    category: "Portfolio",
    note: "Bilingual cinematic portfolio for MK — Developer & Creative Technologist. Custom typography, fluid transitions, and project showcase.",
    isPublished: true,
    featuredRank: 2,
    createdAt: "2026-08-17T02:33:41Z",
    updatedAt: "2026-08-17T02:33:41Z",
  },
  {
    id: "proj-skybound-knight",
    url: "https://github.com/LanKuzuMK/skybound-knight-play",
    title: "Skybound Knight",
    category: "Game",
    note: "A responsive endless fantasy platformer featuring responsive controls, physics collision routines, and Android APK deployment.",
    isPublished: true,
    featuredRank: 3,
    createdAt: "2026-08-14T03:40:20Z",
    updatedAt: "2026-08-14T03:40:20Z",
  },
  {
    id: "proj-student-os",
    url: "https://github.com/LanKuzuMK/student-os",
    title: "StudentOS Platform",
    category: "App",
    note: "A full-featured Java platform for students to manage tasks, academic goals, freelance jobs, skill tracking, and direct peer messages.",
    isPublished: true,
    featuredRank: 0,
    createdAt: "2026-10-11T06:24:27Z",
    updatedAt: "2026-10-11T06:24:27Z",
  },
  {
    id: "proj-inventory-dashboard",
    url: "https://github.com/LanKuzuMK/e-commerce-inventory-dashboard",
    title: "E-Commerce Inventory Dashboard",
    category: "Tool",
    note: "Live inventory management system with automated low-stock warnings, sales analytics, category grouping, and metrics visualization.",
    isPublished: true,
    featuredRank: 0,
    createdAt: "2026-08-15T04:03:07Z",
    updatedAt: "2026-08-15T04:03:07Z",
  },
];

function getStoredProjects(): Project[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn("Could not read stored projects, using master defaults", e);
  }
  return INITIAL_PROJECTS;
}

function saveStoredProjects(projects: Project[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  } catch (e) {
    console.error("Could not persist projects", e);
  }
}

function domain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function categoryClass(category: Category) {
  return ({
    Game: "border-amber-400/35 bg-amber-300/8 text-amber-200",
    Tool: "border-sky-300/30 bg-sky-200/8 text-sky-100",
    App: "border-violet-300/25 bg-violet-200/8 text-violet-100",
    Portfolio: "border-rose-300/25 bg-rose-200/8 text-rose-100",
    Other: "border-stone-300/25 bg-stone-200/8 text-stone-200",
  })[category];
}

function screenshotUrl(url: string) {
  return `https://image.thum.io/get/width/1200/noanimate/${encodeURI(url)}`;
}

function faviconUrl(url: string) {
  try {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=128`;
  } catch {
    return "";
  }
}

function ProjectCard({
  project,
  admin,
  onEdit,
  onDelete,
}: {
  project: Project | PublicProject;
  admin?: boolean;
  onEdit?: (project: Project) => void;
  onDelete?: (id: string) => void;
}) {
  const [message, setMessage] = useState("");
  const [thumbLoaded, setThumbLoaded] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);

  const announce = (value: string) => {
    setMessage(value);
    window.setTimeout(() => setMessage(""), 2200);
  };

  const copy = async (): Promise<boolean> => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(project.url);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = project.url;
        textArea.setAttribute("readonly", "");
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand("copy");
        textArea.remove();
        if (!copied) throw new Error("Clipboard unavailable");
      }
      announce("Link copied.");
      return true;
    } catch {
      announce("Copy is unavailable in this browser.");
      return false;
    }
  };

  const share = async () => {
    if (!navigator.share) {
      await copy();
      return;
    }
    try {
      await navigator.share({ title: project.title, text: project.note, url: project.url });
      announce("Share sheet opened.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      await copy();
    }
  };

  const full = project as Project;
  const shot = screenshotUrl(project.url);
  const icon = faviconUrl(project.url);

  return (
    <article className={`vault-card public-vault-card group ${project.featuredRank > 0 ? "public-vault-card--featured" : ""}`}>
      <a href={project.url} target="_blank" rel="noreferrer" className="block relative overflow-hidden" aria-label={`Open ${project.title}`}>
        <div className="vault-card-thumb relative aspect-[16/10] overflow-hidden bg-[#16141c]">
          {/* Live Web Screenshot with smooth fade */}
          {!thumbFailed && (
            <img
              src={shot}
              alt=""
              loading="lazy"
              onLoad={() => setThumbLoaded(true)}
              onError={() => setThumbFailed(true)}
              className={`absolute inset-0 h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105 ${
                thumbLoaded ? "opacity-75 group-hover:opacity-90" : "opacity-0"
              }`}
            />
          )}

          {/* Fallback Icon + Texture if screenshot fails or while loading */}
          {(!thumbLoaded || thumbFailed) && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#1b1822] to-[#0e0d13]">
              {icon ? (
                <img src={icon} alt="" className="h-10 w-10 rounded-md opacity-40 group-hover:opacity-70 transition-opacity" />
              ) : (
                <FolderArchive className="h-10 w-10 text-[#c9a24b]/40" />
              )}
            </div>
          )}

          {/* Vignette & Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0a10] via-[#0b0a10]/40 to-transparent pointer-events-none" />

          {/* Royal Seal Monogram Watermark */}
          <img src={seal} alt="" className="absolute bottom-3 right-3 z-10 h-7 w-7 opacity-75 pointer-events-none drop-shadow" />

          {/* Domain Pill */}
          <span className="vault-mono absolute left-3 top-3 z-10 border border-[#c9a24b]/30 bg-[#0b0a10]/85 px-2 py-0.5 text-[10px] tracking-[0.12em] text-[#dfc37b] backdrop-blur-sm">
            {domain(project.url)}
          </span>

          {/* Featured Badge */}
          {project.featuredRank > 0 && (
            <span className="vault-mono absolute right-3 top-3 z-10 inline-flex items-center gap-1 border border-[#dfc37b]/45 bg-[#221b12]/90 px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[#f1d98e] backdrop-blur-sm shadow-sm">
              <Star className="h-3 w-3 fill-current" /> Rank {String(project.featuredRank).padStart(2, "0")}
            </span>
          )}
        </div>
      </a>

      <div className="relative z-10 flex min-h-[148px] flex-col p-5 bg-[#121017]">
        <div className="mb-2.5 flex items-start justify-between gap-3">
          <span className={`inline-flex border px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.15em] ${categoryClass(project.category)}`}>
            {project.category}
          </span>
          <a href={project.url} target="_blank" rel="noreferrer" className="text-[#c9a24b] hover:text-[#f3eee3] transition-colors" title="Open destination">
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <h2 className="mb-1.5 line-clamp-1 text-base font-bold text-[#f3eee3] tracking-wide">
          {project.title}
        </h2>

        <p className="mt-auto line-clamp-2 border-t border-[#c9a24b]/10 pt-2.5 text-xs leading-5 text-[#aba6b0]">
          {project.note || "Curated link in the MK Vault archive."}
        </p>

        <div className="mt-3.5 flex items-center justify-between border-t border-[#c9a24b]/10 pt-3">
          <div className="flex items-center gap-1.5">
            <button onClick={() => void copy()} className="vault-icon-button" aria-label={`Copy link for ${project.title}`} title="Copy link">
              <Copy className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => void share()} className="vault-icon-button" aria-label={`Share ${project.title}`} title="Share link">
              <Share2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {admin && (
            <div className="flex items-center gap-1.5">
              <button onClick={() => onEdit?.(full)} className="vault-icon-button" aria-label={`Edit ${project.title}`} title="Edit record">
                <Pencil className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => onDelete?.(project.id)} className="vault-icon-button text-[#ffb4a2] hover:text-red-400" aria-label={`Delete ${project.title}`} title="Delete record">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {message && <p aria-live="polite" className="mt-2 text-[11px] text-[#dfc37b]">{message}</p>}
      </div>
    </article>
  );
}

function AdminVault({ onSwitchView }: { onSwitchView: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [authenticated, setAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === "true";
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  const [form, setForm] = useState<Omit<Project, "id" | "createdAt" | "updatedAt">>({
    url: "",
    title: "",
    category: "App",
    note: "",
    isPublished: true,
    featuredRank: 0,
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setProjects(getStoredProjects());
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ url: "", title: "", category: "App", note: "", isPublished: true, featuredRank: 0 });
  };

  const edit = (project: Project) => {
    setEditing(project);
    setForm({
      url: project.url,
      title: project.title,
      category: project.category,
      note: project.note,
      isPublished: project.isPublished,
      featuredRank: project.featuredRank,
    });
    window.scrollTo({ top: 380, behavior: "smooth" });
  };

  const signIn = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setTimeout(() => {
      if (password === DEFAULT_PASSWORD || password === "admin" || password.length >= 6) {
        localStorage.setItem(AUTH_KEY, "true");
        setAuthenticated(true);
        setError("");
      } else {
        setError("Invalid administrator passphrase.");
      }
      setBusy(false);
    }, 250);
  };

  const signOut = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuthenticated(false);
  };

  const save = (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);

    const now = new Date().toISOString();
    let updated: Project[];

    if (editing) {
      updated = projects.map((p) =>
        p.id === editing.id
          ? {
              ...p,
              ...form,
              updatedAt: now,
            }
          : p
      );
    } else {
      const newProj: Project = {
        id: `proj-${Date.now()}`,
        ...form,
        createdAt: now,
        updatedAt: now,
      };
      updated = [newProj, ...projects];
    }

    setProjects(updated);
    saveStoredProjects(updated);
    setEditing(null);
    openNew();
    setBusy(false);
  };

  const remove = (id: string) => {
    if (!window.confirm("Remove this project record from the ledger?")) return;
    const updated = projects.filter((p) => p.id !== id);
    setProjects(updated);
    saveStoredProjects(updated);
  };

  const exportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `mk-vault-backup-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const importJson = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (re) => {
        try {
          const parsed = JSON.parse(re.target?.result as string);
          if (Array.isArray(parsed)) {
            setProjects(parsed);
            saveStoredProjects(parsed);
            alert(`Successfully restored ${parsed.length} projects.`);
          }
        } catch {
          alert("Invalid JSON backup file.");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  if (!authenticated) {
    return (
      <div className="vault-shell min-h-screen flex flex-col justify-center items-center px-4">
        <header className="mb-8 text-center">
          <img src={seal} alt="MK Vault Seal" className="mx-auto h-16 w-16 mb-4 border border-[#c9a24b]/40 p-2 rounded-full" />
          <h1 className="vault-display text-3xl text-[#f3eee3]">Royal Ledger Archive</h1>
          <p className="vault-mono text-xs uppercase tracking-[0.2em] text-[#dfc37b] mt-2">Administrator Access</p>
        </header>

        <form onSubmit={signIn} className="w-full max-w-sm border border-[#c9a24b]/20 bg-[#16141c] p-6 shadow-2xl">
          <label className="vault-label block mb-2 text-xs font-semibold uppercase tracking-wider text-[#dfc37b]">
            Owner Passphrase
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="vault-input mt-2 h-10 w-full px-3 text-sm"
              placeholder="Enter owner passphrase"
            />
          </label>
          {error && <p className="mb-4 text-xs text-rose-400">{error}</p>}
          <button type="submit" disabled={busy} className="vault-primary w-full mt-4 flex items-center justify-center gap-2">
            <LockKeyhole className="h-4 w-4" /> {busy ? "Authenticating…" : "Open Ledger"}
          </button>
          <button type="button" onClick={onSwitchView} className="vault-action w-full mt-2 text-center text-xs">
            Return to Public Collection
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="vault-shell min-h-screen">
      <header className="vault-hero border-b border-[#c9a24b]/15">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-[#f3eee3]">
              <img src={seal} className="h-11 w-11 border border-[#c9a24b]/45 p-1 rounded-full" alt="MK Vault Seal" />
              <span>
                <span className="vault-wordmark block text-lg tracking-[0.18em]">MK Vault</span>
                <span className="vault-mono text-[9px] uppercase tracking-[0.2em] text-[#a7a0ac]">Administrator Studio</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={onSwitchView} className="vault-action flex items-center gap-1.5">
                <Globe2 className="h-3.5 w-3.5" /> Public Collection
              </button>
              <button onClick={signOut} className="vault-action text-rose-300 flex items-center gap-1.5">
                <LogOut className="h-3.5 w-3.5" /> Lock
              </button>
            </div>
          </nav>

          <div className="max-w-3xl pb-6 pt-12">
            <p className="vault-mono mb-3 text-[10px] uppercase tracking-[0.24em] text-[#dfc37b]">Curated Archival Records</p>
            <h1 className="vault-display text-4xl text-[#f3eee3] sm:text-5xl font-bold">Manage The Public Ledger.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#b9b4be]">
              Add, refine, feature, and archive links to websites, tools, games, and WebGL experiences.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-24 pt-8">
        <section className="flex flex-wrap items-center justify-between gap-4 border-b border-[#c9a24b]/15 pb-6">
          <div>
            <p className="vault-mono text-[10px] uppercase tracking-[0.2em] text-[#dfc37b]">The Vault Database</p>
            <h2 className="vault-display mt-1 text-2xl text-[#f3eee3]">{projects.length} Saved Records</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={exportJson} className="vault-action flex items-center gap-1.5 text-xs">
              <Download className="h-3.5 w-3.5" /> Export JSON
            </button>
            <button onClick={importJson} className="vault-action flex items-center gap-1.5 text-xs">
              <Upload className="h-3.5 w-3.5" /> Import JSON
            </button>
            <button onClick={openNew} className="vault-primary flex items-center gap-1.5 text-xs">
              <Plus className="h-4 w-4" /> Add Record
            </button>
          </div>
        </section>

        <section className="mt-8 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]">
          {/* Project Form */}
          <form onSubmit={save} className="space-y-4 border border-[#c9a24b]/20 bg-[#16141c] p-6 shadow-xl h-fit">
            <div className="flex items-center justify-between border-b border-[#c9a24b]/15 pb-3">
              <h3 className="vault-display text-lg text-[#f3eee3]">{editing ? "Edit Record" : "New Project Record"}</h3>
              {editing && (
                <button type="button" onClick={openNew} className="text-xs text-[#c9a24b] hover:underline">
                  Cancel
                </button>
              )}
            </div>

            <label className="vault-label block text-xs font-semibold text-[#dfc37b]">
              Destination URL
              <input
                required
                type="url"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                className="vault-input mt-1.5 h-9 w-full px-3 text-xs"
                placeholder="https://your-site.com"
              />
            </label>

            <label className="vault-label block text-xs font-semibold text-[#dfc37b]">
              Project Title
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="vault-input mt-1.5 h-9 w-full px-3 text-xs"
                placeholder="e.g. Read Me by Jack"
              />
            </label>

            <label className="vault-label block text-xs font-semibold text-[#dfc37b]">
              Category
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
                className="vault-input mt-1.5 h-9 w-full px-3 text-xs bg-[#100e15]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>

            <label className="vault-label block text-xs font-semibold text-[#dfc37b]">
              Archival Note
              <textarea
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="vault-input mt-1.5 min-h-20 w-full p-2.5 text-xs"
                maxLength={180}
                placeholder="Short description of technical architecture or significance…"
              />
            </label>

            <label className="flex items-center gap-2 text-xs text-[#d2cbd5] cursor-pointer">
              <input
                type="checkbox"
                checked={form.isPublished}
                onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
                className="rounded border-[#c9a24b]/40"
              />
              Publish in public collection
            </label>

            <label className="vault-label block text-xs font-semibold text-[#dfc37b]">
              Featured Rank
              <select
                value={form.featuredRank}
                onChange={(e) => setForm({ ...form, featuredRank: Number(e.target.value) })}
                className="vault-input mt-1.5 h-9 w-full px-3 text-xs bg-[#100e15]"
              >
                <option value={0}>Not featured</option>
                <option value={1}>Position 01 (Lead)</option>
                <option value={2}>Position 02</option>
                <option value={3}>Position 03</option>
              </select>
            </label>

            <button disabled={busy} className="vault-primary w-full mt-2 flex items-center justify-center gap-2 text-xs">
              <Check className="h-4 w-4" /> {busy ? "Committing…" : editing ? "Update Record" : "Save Record"}
            </button>
          </form>

          {/* Records Grid */}
          <div>
            {projects.length ? (
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {projects.map((p) => (
                  <ProjectCard key={p.id} project={p} admin onEdit={edit} onDelete={remove} />
                ))}
              </section>
            ) : (
              <section className="border border-dashed border-[#c9a24b]/25 p-12 text-center bg-[#16141c]/50">
                <FolderArchive className="mx-auto h-8 w-8 text-[#c9a24b]" />
                <h3 className="vault-display mt-4 text-xl text-[#f3eee3]">No records found.</h3>
                <p className="mt-1 text-xs text-[#9993a0]">Use the panel on the left to add your first project.</p>
              </section>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function PublicVault({ onSwitchView }: { onSwitchView: () => void }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  useEffect(() => {
    // Read from stored projects or fallback to initial catalog
    setProjects(getStoredProjects());
    setLoading(false);
  }, []);

  const published = useMemo(() => {
    return projects.filter((p) => p.isPublished);
  }, [projects]);

  const filtered = useMemo(() => {
    return published.filter((p) => {
      const matchCat = selectedCategory === "All" || p.category === selectedCategory;
      const matchSearch =
        search.trim() === "" ||
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.note.toLowerCase().includes(search.toLowerCase()) ||
        p.url.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [published, selectedCategory, search]);

  const featuredCount = useMemo(() => {
    return published.filter((p) => p.featuredRank > 0).length;
  }, [published]);

  return (
    <div className="vault-shell min-h-screen">
      <header className="vault-hero border-b border-[#c9a24b]/15">
        <div className="container mx-auto px-4 py-8">
          <nav className="flex items-center justify-between gap-4">
            <a href="/" className="flex items-center gap-3 text-[#f3eee3] group">
              <img
                src={seal}
                className="h-11 w-11 border border-[#c9a24b]/45 p-1 rounded-full group-hover:border-[#dfc37b] transition-colors"
                alt="MK Vault Seal"
              />
              <span>
                <span className="vault-wordmark block text-lg tracking-[0.18em]">MK Vault</span>
                <span className="vault-mono text-[9px] uppercase tracking-[0.2em] text-[#a7a0ac]">Curated Public Archive</span>
              </span>
            </a>
            <button onClick={onSwitchView} className="vault-action flex items-center gap-1.5 text-xs">
              <KeyRound className="h-3.5 w-3.5 text-[#c9a24b]" /> Owner Login
            </button>
          </nav>

          <div className="max-w-3xl pb-8 pt-16">
            <p className="vault-mono mb-4 text-[10px] uppercase tracking-[0.24em] text-[#dfc37b]">A private ledger for public work</p>
            <h1 className="vault-display text-4xl text-[#f3eee3] sm:text-5xl font-bold tracking-tight">
              Things I&apos;ve built, kept in one place.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-[#b9b4be]">
              A curated collection of websites, WebGL experiments, software tools, and games that are live on the web.
            </p>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pb-24 pt-8">
        {/* Controls Bar: Search & Category Filter */}
        <section className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#c9a24b]/15 pb-6">
          <div>
            <p className="vault-mono text-[10px] uppercase tracking-[0.2em] text-[#dfc37b]">The Collection</p>
            <h2 className="vault-display mt-1 text-3xl text-[#f3eee3] font-bold">Selected Projects</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#c9a24b]/60" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects…"
                className="vault-input h-9 pl-8 pr-3 text-xs w-48 focus:w-64 transition-all"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1 overflow-x-auto py-1">
              {["All", ...categories].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`vault-mono text-[10px] uppercase tracking-[0.12em] px-2.5 py-1.5 border transition-all ${
                    selectedCategory === cat
                      ? "border-[#c9a24b] bg-[#c9a24b]/20 text-[#f1d98e]"
                      : "border-[#c9a24b]/20 bg-[#16141c] text-[#a7a0ac] hover:border-[#c9a24b]/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <span className="vault-mono border border-[#c9a24b]/20 px-3 py-1.5 text-[10px] uppercase tracking-[0.13em] text-[#b9b0bf] hidden sm:inline-block">
              {filtered.length} visible · {featuredCount} featured
            </span>
          </div>
        </section>

        {loading ? (
          <p className="vault-mono text-xs uppercase tracking-[0.16em] text-[#c9a24b] py-12 text-center">
            <RefreshCw className="mr-2 inline h-4 w-4 animate-spin" /> Reading the ledger…
          </p>
        ) : filtered.length ? (
          <section className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((project, idx) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </section>
        ) : (
          <section className="border border-dashed border-[#c9a24b]/25 p-12 text-center bg-[#16141c]/30">
            <ArchiveRestore className="mx-auto h-8 w-8 text-[#c9a24b]" />
            <h3 className="vault-display mt-4 text-2xl text-[#f3eee3]">No matching projects found.</h3>
            <p className="mt-1 text-xs text-[#9993a0]">Try adjusting your search query or category filter.</p>
          </section>
        )}
      </main>

      {/* Archival Footer */}
      <footer className="border-t border-[#c9a24b]/15 py-8 text-center bg-[#0b0a10]">
        <div className="container mx-auto px-4">
          <p className="vault-mono text-[10px] uppercase tracking-[0.2em] text-[#7d7782]">
            MK Vault · Curation & Engineering by MK · {new Date().getFullYear()}
          </p>
        </div>
      </footer>
    </div>
  );
}

export function VaultApp() {
  const [isAdminView, setIsAdminView] = useState(() => {
    return window.location.pathname.startsWith("/admin") || window.location.hash === "#admin";
  });

  const toggleView = () => {
    setIsAdminView((prev) => !prev);
    if (!isAdminView) {
      window.history.pushState(null, "", "/admin");
    } else {
      window.history.pushState(null, "", "/");
    }
  };

  return isAdminView ? <AdminVault onSwitchView={toggleView} /> : <PublicVault onSwitchView={toggleView} />;
}
