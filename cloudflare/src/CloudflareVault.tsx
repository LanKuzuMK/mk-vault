import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArchiveRestore, ArrowUpRight, Check, CloudDownload, CloudUpload, Copy, FolderArchive, Globe2, KeyRound, LockKeyhole, LogOut, Pencil, Plus, RefreshCw, Share2, Star, Trash2 } from "lucide-react";

type Category = "Game" | "Tool" | "App" | "Portfolio" | "Other";
type Project = { id: string; url: string; title: string; category: Category; note: string; isPublished: boolean; featuredRank: number; createdAt: string; updatedAt: string };
type PublicProject = Pick<Project, "id" | "url" | "title" | "category" | "note" | "featuredRank">;

const categories: Category[] = ["Game", "Tool", "App", "Portfolio", "Other"];
const seal = "/assets/mk-vault-seal.png";
const isAdminRoute = window.location.pathname.startsWith("/admin");

function domain(url: string) { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } }
function categoryClass(category: Category) { return ({ Game: "border-amber-400/35 bg-amber-300/8 text-amber-200", Tool: "border-sky-300/30 bg-sky-200/8 text-sky-100", App: "border-violet-300/25 bg-violet-200/8 text-violet-100", Portfolio: "border-rose-300/25 bg-rose-200/8 text-rose-100", Other: "border-stone-300/25 bg-stone-200/8 text-stone-200" })[category]; }

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { credentials: "include", headers: { "content-type": "application/json", ...(init?.headers ?? {}) }, ...init });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as { error?: string } | null;
    throw new Error(body?.error || "The vault request could not be completed.");
  }
  return response.json() as Promise<T>;
}

function ProjectCard({ project, admin, onEdit, onDelete }: { project: Project | PublicProject; admin?: boolean; onEdit?: (project: Project) => void; onDelete?: (id: string) => void }) {
  const [message, setMessage] = useState("");
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
  return <article className={`vault-card public-vault-card ${project.featuredRank > 0 ? "public-vault-card--featured" : ""}`}>
    <a href={project.url} target="_blank" rel="noreferrer" className="block" aria-label={`Open ${project.title}`}><div className="vault-card-thumb"><img src={seal} alt="" className="absolute bottom-3 right-3 z-10 h-8 w-8 w-auto opacity-70" /><span className="vault-mono absolute left-4 top-4 z-10 border border-[#c9a24b]/25 bg-[#0b0a10]/75 px-2 py-1 text-[10px] tracking-[0.12em] text-[#dfc37b]">{domain(project.url)}</span>{project.featuredRank > 0 && <span className="vault-mono absolute right-4 top-4 z-10 inline-flex items-center gap-1 border border-[#dfc37b]/45 bg-[#221b12]/85 px-2 py-1 text-[9px] uppercase tracking-[0.12em] text-[#f1d98e]"><Star className="h-3 w-3 fill-current" /> Featured {String(project.featuredRank).padStart(2, "0")}</span>}</div></a>
    <div className="relative z-10 flex min-h-40 flex-col p-5"><div className="mb-3 flex items-start justify-between gap-3"><span className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${categoryClass(project.category)}`}>{project.category}</span><ArrowUpRight className="h-4 w-4 text-[#c9a24b]" /></div><h2 className="mb-2 line-clamp-1 text-base font-bold text-[#f3eee3]">{project.title}</h2><p className="mt-auto line-clamp-2 border-t border-[#c9a24b]/10 pt-3 text-xs leading-5 text-[#aba6b0]">{project.note || "Open project"}</p><div className="mt-4 flex items-center gap-2"><button onClick={() => void copy()} className="vault-icon-button" aria-label={`Copy ${project.title}`}><Copy className="h-3.5 w-3.5" /></button><button onClick={() => void share()} className="vault-icon-button" aria-label={`Share ${project.title}`}><Share2 className="h-3.5 w-3.5" /></button>{admin && <><button onClick={() => onEdit?.(full)} className="vault-icon-button" aria-label={`Edit ${project.title}`}><Pencil className="h-3.5 w-3.5" /></button><button onClick={() => onDelete?.(project.id)} className="vault-icon-button text-[#ffb4a2]" aria-label={`Delete ${project.title}`}><Trash2 className="h-3.5 w-3.5" /></button></>}</div><p aria-live="polite" className="mt-3 min-h-4 text-[11px] text-[#dfc37b]">{message}</p></div>
  </article>;
}

function AdminVault() {
  const [projects, setProjects] = useState<Project[]>([]); const [loading, setLoading] = useState(true); const [checkingSession, setCheckingSession] = useState(true); const [authenticated, setAuthenticated] = useState(false); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [editing, setEditing] = useState<Project | null>(null); const [form, setForm] = useState<Omit<Project, "id" | "createdAt" | "updatedAt">>({ url: "", title: "", category: "App", note: "", isPublished: false, featuredRank: 0 }); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => { setLoading(true); try { setProjects(await api<Project[]>("/api/admin/projects")); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to load the administrator vault."); } finally { setLoading(false); } }, []);
  useEffect(() => { api<{ authenticated: boolean }>("/api/admin/session").then(({ authenticated: value }) => setAuthenticated(value)).catch(() => setError("Unable to check the administrator session.")).finally(() => setCheckingSession(false)); }, []);
  useEffect(() => { if (authenticated) void load(); }, [authenticated, load]);
  const openNew = () => { setEditing(null); setForm({ url: "", title: "", category: "App", note: "", isPublished: false, featuredRank: 0 }); };
  const edit = (project: Project) => { setEditing(project); setForm({ url: project.url, title: project.title, category: project.category, note: project.note, isPublished: project.isPublished, featuredRank: project.featuredRank }); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const save = async (event: FormEvent) => { event.preventDefault(); setBusy(true); try { const url = /^https?:\/\//i.test(form.url) ? form.url : `https://${form.url}`; const result = await api<Project>("/api/admin/projects", { method: "POST", body: JSON.stringify({ ...form, url, id: editing?.id, createdAt: editing?.createdAt }) }); setProjects((current) => [result, ...current.filter((project) => project.id !== result.id)]); openNew(); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to save the project."); } finally { setBusy(false); } };
  const remove = async (id: string) => { if (!confirm("Remove this project from the vault?")) return; try { await api("/api/admin/projects?id=" + encodeURIComponent(id), { method: "DELETE" }); setProjects((current) => current.filter((project) => project.id !== id)); } catch (e) { setError(e instanceof Error ? e.message : "Unable to remove the project."); } };
  const remoteBackup = async () => { setBusy(true); try { const entries = projects.map(({ updatedAt: _updatedAt, ...entry }) => entry); await api("/api/admin/backup", { method: "PUT", body: JSON.stringify({ entries }) }); setError("Remote backup sealed in R2."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to create the remote backup."); } finally { setBusy(false); } };
  const restore = async () => { setBusy(true); try { await api("/api/admin/backup", { method: "POST" }); await load(); setError("Remote backup restored."); } catch (e) { setError(e instanceof Error ? e.message : "Unable to restore the remote backup."); } finally { setBusy(false); } };
  const signIn = async (event: FormEvent) => { event.preventDefault(); setBusy(true); try { await api("/api/admin/session", { method: "POST", body: JSON.stringify({ password }) }); setPassword(""); setAuthenticated(true); setError(""); } catch (e) { setError(e instanceof Error ? e.message : "Unable to sign in."); } finally { setBusy(false); } };
  const signOut = async () => { await api("/api/admin/session", { method: "DELETE" }); setAuthenticated(false); setProjects([]); setEditing(null); setError(""); };
  if (checkingSession) return <div className="vault-shell"><main className="container py-16"><p className="vault-mono text-xs uppercase tracking-[0.16em] text-[#c9a24b]"><RefreshCw className="mr-2 inline h-4 w-4 animate-spin" /> Checking private session</p></main></div>;
  if (!authenticated) return <div className="vault-shell"><main className="container py-16"><section className="mx-auto max-w-md border border-[#c9a24b]/20 bg-[#16141c] p-6"><LockKeyhole className="h-6 w-6 text-[#dfc37b]" /><p className="vault-mono mt-5 text-[10px] uppercase tracking-[0.2em] text-[#dfc37b]">Owner sign in</p><h1 className="vault-display mt-3 text-3xl text-[#f3eee3]">Open my private workspace.</h1><p className="mt-3 text-sm leading-6 text-[#aaa4b0]">Enter the administrator password to manage projects and R2 backups.</p><form onSubmit={signIn} className="mt-6 space-y-4"><label className="vault-label">Administrator password<input required autoFocus autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="vault-input mt-2 h-10 w-full px-3" /></label>{error && <p role="alert" className="text-sm text-[#ffb4a2]">{error}</p>}<button disabled={busy} className="vault-primary w-full"><KeyRound className="h-4 w-4" /> {busy ? "Opening…" : "Open workspace"}</button></form></section></main></div>;
  return <div className="vault-shell"><header className="vault-hero border-b border-[#c9a24b]/15"><div className="container py-8"><nav className="flex items-center justify-between gap-4"><a href="/" className="flex items-center gap-3 text-[#f3eee3]"><img src={seal} className="h-11 w-11 border border-[#c9a24b]/45 p-1.5" alt="" /><span><span className="vault-wordmark block text-lg tracking-[0.18em]">MK Vault</span><span className="vault-mono text-[9px] uppercase tracking-[0.2em] text-[#a7a0ac]">Administrator archive</span></span></a><a href="/" className="vault-action"><Globe2 className="h-3.5 w-3.5" /> Public collection</a></nav><div className="max-w-3xl pb-10 pt-20"><p className="vault-mono mb-5 text-[10px] uppercase tracking-[0.24em] text-[#dfc37b]">My personal project log</p><h1 className="vault-display text-4xl text-[#f3eee3] sm:text-5xl">A place to keep the things I&apos;ve built.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#b9b4be]">A private workspace for my project links and backups.</p></div></div></header><main className="container pb-24 pt-8"><section className="grid gap-6 border-b border-[#c9a24b]/15 pb-8 lg:grid-cols-[minmax(0,1fr)_auto]"><div><p className="vault-mono text-[10px] uppercase tracking-[0.2em] text-[#dfc37b]">The open ledger</p><h2 className="vault-display mt-3 text-3xl text-[#f3eee3]">My saved projects</h2></div><div className="flex flex-wrap gap-2"><button onClick={() => void remoteBackup()} disabled={busy} className="vault-action"><CloudUpload className="h-3.5 w-3.5" /> Backup R2</button><button onClick={() => void restore()} disabled={busy} className="vault-action"><CloudDownload className="h-3.5 w-3.5" /> Restore R2</button><button onClick={openNew} className="vault-primary"><Plus className="h-4 w-4" /> Add project</button><button onClick={() => void signOut()} className="vault-action"><LogOut className="h-3.5 w-3.5" /> Lock</button></div></section>{error && <p className="mt-5 border border-[#c9a24b]/25 bg-[#c9a24b]/10 px-4 py-3 text-sm text-[#e6d6a8]">{error}</p>}<section className="mt-8 grid gap-8 lg:grid-cols-[22rem_minmax(0,1fr)]"><form onSubmit={save} className="space-y-4 border border-[#c9a24b]/20 bg-[#16141c] p-5"><div className="flex items-center justify-between"><h3 className="vault-display text-xl text-[#f3eee3]">{editing ? "Edit project" : "New project"}</h3>{editing && <button type="button" onClick={openNew} className="text-xs text-[#c9a24b]">Clear</button>}</div><label className="vault-label">Project URL<input required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="vault-input mt-2 h-10 w-full px-3" placeholder="https://example.com" /></label><label className="vault-label">Title<input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="vault-input mt-2 h-10 w-full px-3" /></label><label className="vault-label">Category<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Category })} className="vault-input mt-2 h-10 w-full px-3">{categories.map((category) => <option key={category}>{category}</option>)}</select></label><label className="vault-label">Note<textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="vault-input mt-2 min-h-24 w-full p-3" maxLength={160} /></label><label className="flex items-center gap-2 text-sm text-[#d2cbd5]"><input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} /> Publish in public collection</label><label className="vault-label">Featured position<select value={form.featuredRank} onChange={(e) => setForm({ ...form, featuredRank: Number(e.target.value) })} className="vault-input mt-2 h-10 w-full px-3"><option value={0}>Not featured</option><option value={1}>Position 01</option><option value={2}>Position 02</option><option value={3}>Position 03</option></select></label><button disabled={busy} className="vault-primary w-full"><Check className="h-4 w-4" /> {busy ? "Saving…" : "Save project"}</button></form><div>{loading ? <p className="vault-mono text-xs uppercase tracking-[0.16em] text-[#c9a24b]"><RefreshCw className="mr-2 inline h-4 w-4 animate-spin" /> Opening the ledger</p> : projects.length ? <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{projects.map((project) => <ProjectCard key={project.id} project={project} admin onEdit={edit} onDelete={remove} />)}</section> : <section className="border border-dashed border-[#c9a24b]/25 p-10 text-center"><FolderArchive className="mx-auto h-6 w-6 text-[#c9a24b]" /><h3 className="vault-display mt-4 text-2xl text-[#f3eee3]">Nothing saved yet.</h3><p className="mt-2 text-sm text-[#9993a0]">Start by adding the first project link.</p></section>}</div></section></main></div>;
}

function PublicVault() {
  const [projects, setProjects] = useState<PublicProject[]>([]); const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  useEffect(() => { api<PublicProject[]>("/api/projects").then(setProjects).catch((e) => setError(e instanceof Error ? e.message : "Unable to load shared projects.")).finally(() => setLoading(false)); }, []);
  const featured = useMemo(() => projects.filter((project) => project.featuredRank > 0).length, [projects]);
  return <div className="vault-shell"><header className="vault-hero border-b border-[#c9a24b]/15"><div className="container py-8"><nav className="flex items-center justify-between gap-4"><a href="/" className="flex items-center gap-3 text-[#f3eee3]"><img src={seal} className="h-11 w-11 border border-[#c9a24b]/45 p-1.5" alt="" /><span><span className="vault-wordmark block text-lg tracking-[0.18em]">MK Vault</span><span className="vault-mono text-[9px] uppercase tracking-[0.2em] text-[#a7a0ac]">Things I&apos;ve chosen to share</span></span></a><a href="/admin/" className="vault-action"><KeyRound className="h-3.5 w-3.5" /> Admin access</a></nav><div className="max-w-3xl pb-10 pt-20"><p className="vault-mono mb-5 text-[10px] uppercase tracking-[0.24em] text-[#dfc37b]">My public work</p><h1 className="vault-display text-4xl text-[#f3eee3] sm:text-5xl">Things I&apos;ve made, kept in one place.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#b9b4be]">This is a small collection of projects I&apos;ve chosen to share. Open any link to see the work.</p></div></div></header><main className="container pb-24 pt-8"><section className="mb-8 flex items-end justify-between gap-4 border-b border-[#c9a24b]/15 pb-8"><div><p className="vault-mono text-[10px] uppercase tracking-[0.2em] text-[#dfc37b]">What I&apos;ve shared</p><h2 className="vault-display mt-3 text-3xl text-[#f3eee3]">My project links</h2></div><span className="vault-mono border border-[#c9a24b]/20 px-3 py-2 text-[10px] uppercase tracking-[0.13em] text-[#b9b0bf]">{projects.length} shared · {featured} featured</span></section>{loading ? <p className="vault-mono text-xs uppercase tracking-[0.16em] text-[#c9a24b]"><RefreshCw className="mr-2 inline h-4 w-4 animate-spin" /> Loading projects</p> : error ? <p className="border border-[#e8590c]/35 bg-[#e8590c]/8 p-6 text-[#ffcabd]">{error}</p> : projects.length ? <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">{projects.map((project) => <ProjectCard key={project.id} project={project} />)}</section> : <section className="border border-dashed border-[#c9a24b]/25 p-12 text-center"><ArchiveRestore className="mx-auto h-7 w-7 text-[#c9a24b]" /><h3 className="vault-display mt-4 text-2xl text-[#f3eee3]">I haven&apos;t shared any projects yet.</h3><p className="mt-2 text-sm text-[#9993a0]">When I&apos;m ready to share something, I&apos;ll add it here.</p></section>}</main></div>;
}

export function CloudflareVault() { return isAdminRoute ? <AdminVault /> : <PublicVault />; }
