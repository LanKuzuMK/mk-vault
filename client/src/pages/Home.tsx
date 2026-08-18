/* MK Vault / Royal Ledger: project links are ceremonial archival records, never generic tiles. */
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  ArchiveRestore,
  ArrowUpRight,
  Check,
  ChevronDown,
  CloudDownload,
  CloudUpload,
  Copy,
  Download,
  FilePlus2,
  FolderArchive,
  Globe2,
  LogIn,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { trpc } from "@/lib/trpc";
import { copyProjectLink, shareProjectLink } from "@/lib/linkActions";
import { shouldRetryTransientRequest, transientRequestRetryDelay } from "@/lib/queryRetry";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = "Game" | "Tool" | "App" | "Portfolio" | "Other";

type VaultEntry = {
  id: string;
  url: string;
  title: string;
  category: Category;
  note: string;
  createdAt: string;
};

type Draft = Omit<VaultEntry, "id" | "createdAt">;

const categories: Category[] = ["Game", "Tool", "App", "Portfolio", "Other"];
const storageKey = "mk-vault-entries-v1";
const fallbackTile = "/manus-storage/mk-vault-fallback-tile_ac296a2d.jpg";
const archiveTile = "/manus-storage/mk-vault-archive-tile_29e0d335.jpg";
const sealMark = "/manus-storage/mk-vault-seal_74861e0b.png";
const blankDraft: Draft = { url: "", title: "", category: "App", note: "" };

function safeEntries(value: unknown): VaultEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is VaultEntry => {
    if (!entry || typeof entry !== "object") return false;
    const candidate = entry as Partial<VaultEntry>;
    return typeof candidate.url === "string" && typeof candidate.title === "string";
  }).map((entry) => ({
    id: entry.id || crypto.randomUUID(),
    url: entry.url,
    title: entry.title,
    category: categories.includes(entry.category) ? entry.category : "Other",
    note: entry.note || "",
    createdAt: entry.createdAt || new Date().toISOString(),
  }));
}

function tidyUrl(value: string) {
  const supplied = value.trim();
  return /^https?:\/\//i.test(supplied) ? supplied : `https://${supplied}`;
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

function prettyDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function categoryStyle(category: Category) {
  const map: Record<Category, string> = {
    Game: "border-amber-400/35 bg-amber-300/8 text-amber-200",
    Tool: "border-sky-300/30 bg-sky-200/8 text-sky-100",
    App: "border-violet-300/25 bg-violet-200/8 text-violet-100",
    Portfolio: "border-rose-300/25 bg-rose-200/8 text-rose-100",
    Other: "border-stone-300/25 bg-stone-200/8 text-stone-200",
  };
  return map[category];
}

function VaultCard({ entry, index, published, featuredRank, onEdit, onDelete, onTogglePublic, onSetFeatured }: { entry: VaultEntry; index: number; published: boolean; featuredRank: number; onEdit: (entry: VaultEntry) => void; onDelete: (id: string) => void; onTogglePublic: (entry: VaultEntry) => void; onSetFeatured: (entry: VaultEntry, rank: number) => void }) {
  const [imageState, setImageState] = useState<"screenshot" | "favicon" | "fallback">("screenshot");
  const [stamp, setStamp] = useState(false);
  const currentImage = imageState === "screenshot" ? screenshotUrl(entry.url) : imageState === "favicon" ? faviconUrl(entry.url) : "";

  useEffect(() => {
    setStamp(true);
    const timer = window.setTimeout(() => setStamp(false), 430);
    return () => window.clearTimeout(timer);
  }, []);

  const openEntry = () => window.open(entry.url, "_blank", "noopener,noreferrer");

  async function copyLink() {
    const copied = await copyProjectLink(entry.url);
    copied ? toast.success("Project link copied.") : toast.error("The link could not be copied. Please copy it from the record details.");
  }

  async function shareLink() {
    const result = await shareProjectLink(entry);
    if (result === "copied") toast.success("Sharing is unavailable here, so the project link was copied.");
    if (result === "unavailable") toast.error("Sharing is unavailable in this browser.");
  }

  return (
    <article
      className={`vault-card group cursor-pointer ${stamp ? "vault-stamp-in" : ""}`}
      onClick={openEntry}
      onKeyDown={(event) => {
        if (event.target instanceof HTMLElement && event.target.closest("button, [role='menuitem']")) return;
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          openEntry();
        }
      }}
      role="link"
      tabIndex={0}
      aria-label={`Open ${entry.title} in a new tab`}
    >
      <div className="vault-card-thumb">
        {currentImage ? (
          <img
            src={currentImage}
            alt={`Preview of ${entry.title}`}
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImageState((previous) => previous === "screenshot" ? "favicon" : "fallback")}
          />
        ) : (
          <div className="relative z-10 flex h-full items-center justify-center">
            <img className="h-12 w-12 rounded-full border border-[#c9a24b]/40 bg-[#0b0a10]/80 p-2 object-contain" src={faviconUrl(entry.url) || sealMark} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.src = sealMark; }} />
          </div>
        )}
        <div className="absolute left-4 top-4 z-10 flex items-center gap-2">
          <span className="vault-mono border border-[#c9a24b]/25 bg-[#0b0a10]/75 px-2 py-1 text-[10px] font-medium tracking-[0.12em] text-[#dfc37b] backdrop-blur-sm">No. {String(index + 1).padStart(3, "0")}</span>
        </div>
        <img className="absolute bottom-3 right-3 z-10 h-8 w-8 opacity-70 drop-shadow-[0_2px_5px_rgba(0,0,0,0.8)]" src={sealMark} alt="" />
      </div>

      <div className="relative z-10 flex min-h-36 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <span className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${categoryStyle(entry.category)}`}>{entry.category}</span>
          <div className="vault-card-actions" onClick={(event) => event.stopPropagation()}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="grid h-8 w-8 place-items-center border border-[#c9a24b]/20 bg-[#0b0a10]/45 text-[#bdb7c4] transition-colors hover:border-[#c9a24b]/60 hover:text-[#f3eee3] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a24b]" aria-label={`Actions for ${entry.title}`}>
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-36 border-[#c9a24b]/30 bg-[#17151d] text-[#f3eee3]">
                <DropdownMenuItem onClick={() => onEdit(entry)} className="cursor-pointer focus:bg-[#c9a24b]/12 focus:text-[#f3eee3]">
                  <Pencil className="mr-2 h-3.5 w-3.5" /> Edit record
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onTogglePublic(entry)} className="cursor-pointer focus:bg-[#c9a24b]/12 focus:text-[#f3eee3]">
                  <Globe2 className="mr-2 h-3.5 w-3.5" /> {published ? "Remove from public" : "Publish to public"}
                </DropdownMenuItem>
                {published && <>
                  <DropdownMenuSeparator className="bg-[#c9a24b]/15" />
                  <DropdownMenuItem onClick={() => onSetFeatured(entry, 1)} className="cursor-pointer focus:bg-[#c9a24b]/12 focus:text-[#f3eee3]"><Star className={`mr-2 h-3.5 w-3.5 ${featuredRank === 1 ? "fill-current text-[#dfc37b]" : ""}`} /> {featuredRank === 1 ? "Featured · position 01" : "Feature · position 01"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSetFeatured(entry, 2)} className="cursor-pointer focus:bg-[#c9a24b]/12 focus:text-[#f3eee3]"><Star className={`mr-2 h-3.5 w-3.5 ${featuredRank === 2 ? "fill-current text-[#dfc37b]" : ""}`} /> {featuredRank === 2 ? "Featured · position 02" : "Feature · position 02"}</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onSetFeatured(entry, 3)} className="cursor-pointer focus:bg-[#c9a24b]/12 focus:text-[#f3eee3]"><Star className={`mr-2 h-3.5 w-3.5 ${featuredRank === 3 ? "fill-current text-[#dfc37b]" : ""}`} /> {featuredRank === 3 ? "Featured · position 03" : "Feature · position 03"}</DropdownMenuItem>
                  {featuredRank > 0 && <DropdownMenuItem onClick={() => onSetFeatured(entry, 0)} className="cursor-pointer text-[#bdb7c4] focus:bg-[#c9a24b]/12 focus:text-[#f3eee3]"><Star className="mr-2 h-3.5 w-3.5" /> Clear featured position</DropdownMenuItem>}
                </>}
                <DropdownMenuSeparator className="bg-[#c9a24b]/15" />
                <DropdownMenuItem onClick={() => onDelete(entry.id)} className="cursor-pointer text-[#ffb4a2] focus:bg-[#e8590c]/12 focus:text-[#ffcabd]">
                  <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete record
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <h3 className="mb-2 line-clamp-1 text-base font-bold tracking-[-0.025em] text-[#f3eee3]">{entry.title}</h3>
        <p className="vault-mono mb-3 truncate text-[11px] text-[#8f8999]">{prettyDomain(entry.url)}</p>
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-[#c9a24b]/10 pt-3">
          <p className="line-clamp-1 text-xs text-[#aba6b0]">{entry.note || "Recorded without a marginal note."}</p>
          <div className="flex shrink-0 items-center gap-1" onClick={(event) => event.stopPropagation()}>
            <button type="button" onClick={() => { void copyLink(); }} className="grid h-7 w-7 place-items-center border border-[#c9a24b]/18 text-[#c9a24b] transition-colors hover:border-[#c9a24b]/60 hover:bg-[#c9a24b]/10 hover:text-[#fff3ce] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a24b]" aria-label={`Copy link to ${entry.title}`} title="Copy link"><Copy className="h-3.5 w-3.5" /></button>
            <button type="button" onClick={() => { void shareLink(); }} className="grid h-7 w-7 place-items-center border border-[#c9a24b]/18 text-[#c9a24b] transition-colors hover:border-[#c9a24b]/60 hover:bg-[#c9a24b]/10 hover:text-[#fff3ce] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a24b]" aria-label={`Share ${entry.title}`} title="Share link"><Share2 className="h-3.5 w-3.5" /></button>
            <ArrowUpRight className="h-4 w-4 shrink-0 text-[#c9a24b]" />
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Home() {
  const [entries, setEntries] = useState<VaultEntry[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<"All" | Category>("All");
  const [sort, setSort] = useState<"newest" | "alpha">("newest");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(blankDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const remoteStatus = trpc.vaultBackup.status.useQuery(undefined, {
    enabled: isAdmin,
    retry: shouldRetryTransientRequest,
    retryDelay: transientRequestRetryDelay,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
  });
  const remoteSave = trpc.vaultBackup.save.useMutation({
    onSuccess: async (result) => {
      await utils.vaultBackup.status.invalidate();
      toast.success(`${result.entryCount} ${result.entryCount === 1 ? "entry" : "entries"} sealed in the remote vault.`);
    },
    onError: (error) => toast.error(error.message || "Remote backup could not be completed."),
  });
  const remoteRestore = trpc.vaultBackup.restore.useQuery(undefined, {
    enabled: false,
    retry: shouldRetryTransientRequest,
    retryDelay: transientRequestRetryDelay,
  });
  const administratorCatalog = trpc.adminCatalog.list.useQuery(undefined, {
    enabled: isAdmin,
    retry: shouldRetryTransientRequest,
    retryDelay: transientRequestRetryDelay,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
  });
  const publishProject = trpc.adminCatalog.publish.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.adminCatalog.list.invalidate(), utils.publicCatalog.list.invalidate()]);
      toast.success("Record released to the public collection.");
    },
    onError: (error) => toast.error(error.message || "The public record could not be released."),
  });
  const unpublishProject = trpc.adminCatalog.unpublish.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.adminCatalog.list.invalidate(), utils.publicCatalog.list.invalidate()]);
      toast.success("Record removed from the public collection.");
    },
    onError: (error) => toast.error(error.message || "The public record could not be removed."),
  });
  const setFeaturedRank = trpc.adminCatalog.setFeaturedRank.useMutation({
    onSuccess: async (result) => {
      await Promise.all([utils.adminCatalog.list.invalidate(), utils.publicCatalog.list.invalidate()]);
      toast.success(result.featuredRank ? `Record assigned featured position ${result.featuredRank}.` : "Record removed from featured positions.");
    },
    onError: (error) => toast.error(error.message || "The featured position could not be updated."),
  });

  useEffect(() => {
    try {
      setEntries(safeEntries(JSON.parse(localStorage.getItem(storageKey) || "[]")));
    } catch {
      localStorage.removeItem(storageKey);
      toast.error("The local archive could not be read and was reset.");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTyping = target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.tagName === "SELECT";
      if (event.key.toLowerCase() === "n" && !isTyping && !dialogOpen) {
        event.preventDefault();
        openNewRecord();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [dialogOpen]);

  const visibleEntries = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...entries]
      .filter((entry) => (selectedCategory === "All" || entry.category === selectedCategory) && (!query || entry.title.toLowerCase().includes(query)))
      .sort((a, b) => sort === "alpha" ? a.title.localeCompare(b.title) : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [entries, search, selectedCategory, sort]);
  const publishedIds = useMemo(() => new Set(administratorCatalog.data?.map((project) => project.id) ?? []), [administratorCatalog.data]);
  const featuredRanks = useMemo(() => new Map(administratorCatalog.data?.map((project) => [project.id, project.featuredRank]) ?? []), [administratorCatalog.data]);

  function openNewRecord() {
    setEditingId(null);
    setDraft(blankDraft);
    setFormError("");
    setDialogOpen(true);
  }

  function openEditRecord(entry: VaultEntry) {
    setEditingId(entry.id);
    setDraft({ url: entry.url, title: entry.title, category: entry.category, note: entry.note });
    setFormError("");
    setDialogOpen(true);
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const url = tidyUrl(draft.url);
    try {
      new URL(url);
    } catch {
      setFormError("Record a complete web address, such as https://your-project.com.");
      return;
    }
    if (!draft.title.trim()) {
      setFormError("Give this entry a project title before sealing it.");
      return;
    }
    const normalized: Draft = { ...draft, url, title: draft.title.trim(), note: draft.note.trim().slice(0, 160) };
    if (editingId) {
      setEntries((current) => current.map((entry) => entry.id === editingId ? { ...entry, ...normalized } : entry));
      if (publishedIds.has(editingId)) publishProject.mutate({ id: editingId, ...normalized });
      toast.success("The ledger entry was amended.");
    } else {
      setEntries((current) => [{ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...normalized }, ...current]);
      toast.success("Project sealed into the vault.");
    }
    setDialogOpen(false);
  }

  function deleteEntry(id: string) {
    const entry = entries.find((item) => item.id === id);
    if (!entry || !window.confirm(`Remove “${entry.title}” from the vault? This only affects this browser.`)) return;
    setEntries((current) => current.filter((item) => item.id !== id));
    if (publishedIds.has(id)) unpublishProject.mutate({ id });
    toast.success("The ledger entry was removed.");
  }

  function togglePublicCollection(entry: VaultEntry) {
    if (publishedIds.has(entry.id)) {
      unpublishProject.mutate({ id: entry.id });
      return;
    }
    publishProject.mutate({ id: entry.id, url: entry.url, title: entry.title, category: entry.category, note: entry.note });
  }

  function setFeaturedPosition(entry: VaultEntry, featuredRank: number) {
    if (!publishedIds.has(entry.id)) {
      toast.error("Publish this record before assigning a featured position.");
      return;
    }
    setFeaturedRank.mutate({ id: entry.id, featuredRank });
  }

  function exportEntries() {
    const file = new Blob([JSON.stringify({ app: "MK Vault", version: 1, exportedAt: new Date().toISOString(), entries }, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `mk-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
    toast.success(`${entries.length} ${entries.length === 1 ? "entry" : "entries"} exported as a backup.`);
  }

  function startRemoteSession() {
    if (authLoading) return;
    startLogin();
  }

  function backupToR2() {
    if (!isAdmin) {
      startRemoteSession();
      return;
    }
    remoteSave.mutate({ entries });
  }

  async function restoreFromR2() {
    if (!isAdmin) {
      startRemoteSession();
      return;
    }
    const result = await remoteRestore.refetch();
    if (result.error || !result.data) {
      toast.error(result.error?.message || "No remote vault backup could be found.");
      return;
    }
    setEntries(result.data.entries);
    toast.success(`${result.data.entries.length} ${result.data.entries.length === 1 ? "entry" : "entries"} restored from the remote vault.`);
  }

  function importEntries(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const imported = safeEntries(Array.isArray(parsed) ? parsed : parsed.entries);
        if (!imported.length) throw new Error("No compatible entries");
        setEntries((current) => {
          const ids = new Set(current.map((entry) => entry.id));
          const uniqueImported = imported.map((entry) => ({ ...entry, id: ids.has(entry.id) ? crypto.randomUUID() : entry.id }));
          return [...uniqueImported, ...current];
        });
        toast.success(`${imported.length} ${imported.length === 1 ? "entry" : "entries"} added from the backup.`);
      } catch {
        toast.error("That file is not a valid MK Vault backup.");
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  }

  if (authLoading) {
    return <div className="vault-shell grid min-h-screen place-items-center"><div className="vault-mono flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-[#c9a24b]"><RefreshCw className="h-4 w-4 animate-spin" /> Verifying archive access</div></div>;
  }

  if (!isAuthenticated) {
    return <div className="vault-shell grid min-h-screen place-items-center px-5"><section className="w-full max-w-lg border border-[#c9a24b]/28 bg-[#16141c] p-8 text-center shadow-2xl"><img src={sealMark} alt="" className="mx-auto h-14 w-14" /><p className="vault-mono mt-6 text-[10px] uppercase tracking-[0.2em] text-[#dfc37b]">Administrator archive</p><h1 className="vault-display mt-3 text-3xl text-[#f3eee3]">Sign in to manage the record.</h1><p className="mt-4 text-sm leading-7 text-[#aaa4b0]">Visitors can browse public projects without an account. Secure administrator sign-in is required for the private archive and remote backups.</p><div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Button onClick={startRemoteSession} className="rounded-none border border-[#c9a24b] bg-[#c9a24b] text-xs font-bold uppercase tracking-[0.11em] text-[#18131a] hover:bg-[#e0bc67]"><LogIn className="mr-2 h-4 w-4" /> Secure sign in</Button><a href="/" className="inline-flex h-10 items-center justify-center border border-[#c9a24b]/25 px-4 text-xs font-bold uppercase tracking-[0.11em] text-[#d2cbd5] hover:border-[#c9a24b]/55 hover:bg-[#c9a24b]/10">Browse public collection</a></div></section></div>;
  }

  if (!isAdmin) {
    return <div className="vault-shell grid min-h-screen place-items-center px-5"><section className="w-full max-w-lg border border-[#e8590c]/35 bg-[#16141c] p-8 text-center shadow-2xl"><ShieldAlert className="mx-auto h-10 w-10 text-[#ffb4a2]" /><p className="vault-mono mt-6 text-[10px] uppercase tracking-[0.2em] text-[#ffb4a2]">Access restricted</p><h1 className="vault-display mt-3 text-3xl text-[#f3eee3]">This archive is administrator-only.</h1><p className="mt-4 text-sm leading-7 text-[#aaa4b0]">You are signed in, but your account does not have the archive administrator role.</p><a href="/" className="mt-7 inline-flex h-10 items-center border border-[#c9a24b]/25 px-4 text-xs font-bold uppercase tracking-[0.11em] text-[#d2cbd5] hover:border-[#c9a24b]/55 hover:bg-[#c9a24b]/10"><Globe2 className="mr-2 h-4 w-4" /> Browse public collection</a></section></div>;
  }

  return (
    <div className="vault-shell">
      <header className="vault-hero border-b border-[#c9a24b]/15">
        <div className="container relative py-6 sm:py-8 lg:py-10">
          <nav className="flex items-center justify-between gap-4" aria-label="Primary navigation">
            <a href="#archive" className="flex items-center gap-3 text-[#f3eee3]" aria-label="MK Vault archive home">
              <span className="grid h-11 w-11 place-items-center border border-[#c9a24b]/45 bg-[#0b0a10]/60 p-1.5 shadow-[0_0_20px_rgba(201,162,75,0.08)]"><img className="h-full w-full object-contain" src={sealMark} alt="" /></span>
              <span>
                <span className="vault-wordmark block text-lg font-semibold tracking-[0.18em]">MK Vault</span>
                <span className="vault-mono mt-0.5 block text-[9px] uppercase tracking-[0.2em] text-[#a7a0ac]">Administrator project archive</span>
              </span>
            </a>
            <div className="hidden items-center gap-3 sm:flex">
              <a href="/" className="vault-mono hidden items-center gap-1.5 text-[10px] uppercase tracking-[0.13em] text-[#a7a0ac] hover:text-[#dfc37b] lg:inline-flex"><Globe2 className="h-3.5 w-3.5" /> View public collection</a>
              <span className="vault-mono hidden text-[10px] uppercase tracking-[0.13em] text-[#a7a0ac] lg:inline">Administrator · {entries.length} entries</span>
              <Button onClick={openNewRecord} className="h-11 rounded-none border border-[#c9a24b] bg-[#c9a24b] px-4 text-xs font-extrabold uppercase tracking-[0.11em] text-[#18131a] shadow-[0_8px_25px_rgba(0,0,0,0.25)] hover:bg-[#e0bc67] active:scale-[0.97]">
                <Plus className="mr-2 h-4 w-4" /> Seal a project
              </Button>
            </div>
          </nav>

          <div className="max-w-3xl pb-9 pt-18 sm:pb-12 sm:pt-24 lg:pb-16 lg:pt-28">
            <p className="vault-mono mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-[#dfc37b]">My personal project log</p>
            <h1 className="vault-display max-w-2xl text-4xl leading-[1.18] font-semibold tracking-[-0.04em] text-[#f3eee3] sm:text-5xl lg:text-6xl">A place to keep the things I&apos;ve built.</h1>
            <p className="mt-5 max-w-xl text-sm leading-7 text-[#b9b4be] sm:text-base">I use this space to keep my project links, notes, and little reminders in one place.</p>
          </div>
          <div className="vault-rule max-w-4xl" />
        </div>
      </header>

      <main id="archive" className="container pb-24 pt-8 sm:pt-10 lg:pt-14">
        <section className="relative grid gap-7 border-b border-[#c9a24b]/15 pb-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[#c9a24b]">
              <FolderArchive className="h-4 w-4" />
              <p className="vault-mono text-[10px] font-medium uppercase tracking-[0.2em]">The open ledger</p>
            </div>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="vault-display text-2xl font-semibold tracking-[-0.035em] text-[#f3eee3] sm:text-3xl">My saved projects</h2>
                <p className="mt-2 text-sm text-[#9993a0]">{entries.length ? `${entries.length} ${entries.length === 1 ? "link" : "links"} saved here.` : "I'll start by saving one project."}</p>
              </div>
              <span className="vault-mono inline-flex items-center gap-2 border border-[#c9a24b]/20 bg-[#16141c] px-3 py-2 text-[10px] uppercase tracking-[0.13em] text-[#b9b0bf]"><ShieldCheck className="h-3.5 w-3.5 text-[#c9a24b]" /> Administrator verified</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {isAuthenticated ? (
              <>
                <Button variant="outline" onClick={backupToR2} disabled={remoteSave.isPending} className="h-10 rounded-none border-[#c9a24b]/45 bg-[#c9a24b]/10 px-3 text-xs text-[#e5cf91] hover:border-[#c9a24b] hover:bg-[#c9a24b]/18 hover:text-[#fff3ce] disabled:opacity-70"><CloudUpload className="mr-2 h-3.5 w-3.5" /> {remoteSave.isPending ? "Sealing…" : "Backup to R2"}</Button>
                <Button variant="outline" onClick={restoreFromR2} disabled={remoteRestore.isFetching} className="h-10 rounded-none border-[#c9a24b]/25 bg-[#16141c]/65 px-3 text-xs text-[#d2cbd5] hover:border-[#c9a24b]/55 hover:bg-[#c9a24b]/10 hover:text-[#f3eee3] disabled:opacity-70"><CloudDownload className="mr-2 h-3.5 w-3.5 text-[#c9a24b]" /> {remoteRestore.isFetching ? "Restoring…" : "Restore R2"}</Button>
              </>
            ) : (
              <Button variant="outline" onClick={startRemoteSession} disabled={authLoading} className="h-10 rounded-none border-[#c9a24b]/45 bg-[#c9a24b]/10 px-3 text-xs text-[#e5cf91] hover:border-[#c9a24b] hover:bg-[#c9a24b]/18 hover:text-[#fff3ce] disabled:opacity-70"><LogIn className="mr-2 h-3.5 w-3.5" /> Enable R2 backup</Button>
            )}
            <Button variant="outline" onClick={exportEntries} className="h-10 rounded-none border-[#c9a24b]/25 bg-[#16141c]/65 px-3 text-xs text-[#d2cbd5] hover:border-[#c9a24b]/55 hover:bg-[#c9a24b]/10 hover:text-[#f3eee3]"><Download className="mr-2 h-3.5 w-3.5 text-[#c9a24b]" /> Export</Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="h-10 rounded-none border-[#c9a24b]/25 bg-[#16141c]/65 px-3 text-xs text-[#d2cbd5] hover:border-[#c9a24b]/55 hover:bg-[#c9a24b]/10 hover:text-[#f3eee3]"><Upload className="mr-2 h-3.5 w-3.5 text-[#c9a24b]" /> Import</Button>
            <input ref={fileInputRef} onChange={importEntries} accept="application/json,.json" type="file" className="hidden" aria-label="Import MK Vault backup" />
          </div>
        </section>

        {isAuthenticated && (
          <section className="mb-2 flex flex-wrap items-center justify-between gap-3 border-x border-b border-[#c9a24b]/15 bg-[#16141c]/35 px-4 py-3">
            <p className="flex items-center gap-2 text-xs text-[#aaa4b0]"><ShieldCheck className="h-3.5 w-3.5 text-[#c9a24b]" /><span>Signed in as <strong className="font-semibold text-[#e6dcd1]">{user?.name || "vault keeper"}</strong>. Remote backups stay private to this account.</span></p>
            <p className="vault-mono flex items-center gap-1.5 text-[9px] uppercase tracking-[0.12em] text-[#817a87]">{remoteStatus.isLoading ? <RefreshCw className="h-3 w-3 animate-spin" /> : <CloudUpload className="h-3 w-3 text-[#c9a24b]" />}{remoteStatus.data?.exists && remoteStatus.data.savedAt ? `Last sealed ${new Date(remoteStatus.data.savedAt).toLocaleString()}` : "No remote backup yet"}</p>
          </section>
        )}

        <section className="grid gap-4 py-7 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#c9a24b]" />
            <Input value={search} onChange={(event) => setSearch(event.target.value)} className="vault-input h-12 pl-11 pr-12 text-sm" placeholder="Find a project by title…" aria-label="Search projects by title" />
            {search && <button className="absolute right-3 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center text-[#a7a0ac] hover:text-[#f3eee3]" onClick={() => setSearch("")} aria-label="Clear search"><X className="h-4 w-4" /></button>}
          </label>
          <div className="flex items-center justify-between gap-3 sm:justify-start">
            <span className="vault-mono hidden text-[10px] uppercase tracking-[0.16em] text-[#77717e] sm:inline">Order</span>
            <button onClick={() => setSort((current) => current === "newest" ? "alpha" : "newest")} className="flex h-10 items-center gap-2 border border-[#c9a24b]/20 bg-[#16141c]/65 px-3 text-xs text-[#c9c3cf] hover:border-[#c9a24b]/55 hover:text-[#f3eee3]" aria-label="Change sort order">
              <SlidersHorizontal className="h-3.5 w-3.5 text-[#c9a24b]" /> {sort === "newest" ? "Newest first" : "A–Z"}<ChevronDown className="h-3.5 w-3.5 text-[#a7a0ac]" />
            </button>
          </div>
        </section>

        <section className="mb-7 flex flex-wrap gap-2" aria-label="Filter entries by category">
          {(["All", ...categories] as const).map((category) => {
            const active = selectedCategory === category;
            const count = category === "All" ? entries.length : entries.filter((entry) => entry.category === category).length;
            return <button key={category} onClick={() => setSelectedCategory(category)} className={`h-9 border px-3 text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${active ? "border-[#c9a24b] bg-[#c9a24b] text-[#18131a]" : "border-[#c9a24b]/18 bg-[#16141c]/45 text-[#aaa4b0] hover:border-[#c9a24b]/52 hover:text-[#f3eee3]"}`}>
              {category} <span className={`vault-mono ml-1.5 text-[10px] ${active ? "text-[#3a2e16]" : "text-[#77717e]"}`}>{count}</span>
            </button>;
          })}
        </section>

        {visibleEntries.length ? (
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Project records">
            {visibleEntries.map((entry, index) => <VaultCard key={entry.id} entry={entry} index={index} published={publishedIds.has(entry.id)} featuredRank={featuredRanks.get(entry.id) ?? 0} onEdit={openEditRecord} onDelete={deleteEntry} onTogglePublic={togglePublicCollection} onSetFeatured={setFeaturedPosition} />)}
          </section>
        ) : entries.length ? (
          <section className="border border-dashed border-[#c9a24b]/25 bg-[#16141c]/45 px-6 py-18 text-center">
            <Search className="mx-auto h-6 w-6 text-[#c9a24b]" />
            <h3 className="vault-display mt-5 text-xl text-[#f3eee3]">No record answers that search.</h3>
            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#9993a0]">Adjust the title search or return to all categories to reopen the full ledger.</p>
            <Button variant="outline" onClick={() => { setSearch(""); setSelectedCategory("All"); }} className="mt-6 rounded-none border-[#c9a24b]/30 bg-transparent text-[#d9d1dc] hover:bg-[#c9a24b]/10 hover:text-[#f3eee3]">Clear filters</Button>
          </section>
        ) : (
          <section className="relative overflow-hidden border border-[#c9a24b]/22 bg-[#16141c]">
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: `linear-gradient(90deg, rgba(22,20,28,.95), rgba(22,20,28,.6)), url(${archiveTile})`, backgroundPosition: "center", backgroundSize: "cover" }} />
            <div className="relative grid min-h-96 items-center px-7 py-12 sm:px-12 lg:grid-cols-[1fr_auto] lg:gap-12">
              <div className="max-w-xl">
                <span className="grid h-12 w-12 place-items-center border border-[#c9a24b]/42 bg-[#0b0a10]/70"><FilePlus2 className="h-5 w-5 text-[#c9a24b]" /></span>
                <p className="vault-mono mt-7 text-[10px] font-medium uppercase tracking-[0.2em] text-[#dfc37b]">First Entry Awaiting Seal</p>
                <h3 className="vault-display mt-3 text-3xl leading-tight font-semibold tracking-[-0.04em] text-[#f3eee3]">Nothing saved here yet.</h3>
                <p className="mt-4 max-w-md text-sm leading-7 text-[#b1acb7]">I&apos;ll add a project link, a preview, and a note I want to remember. My list stays in this browser until I back it up.</p>
                <Button onClick={openNewRecord} className="mt-7 h-11 rounded-none border border-[#c9a24b] bg-[#c9a24b] px-4 text-xs font-extrabold uppercase tracking-[0.11em] text-[#18131a] hover:bg-[#e0bc67]"><Plus className="mr-2 h-4 w-4" /> Add the first project</Button>
              </div>
              <div className="vault-mono mt-10 border-l border-[#c9a24b]/25 pl-5 text-[10px] uppercase leading-6 tracking-[0.14em] text-[#8f8998] lg:mt-0 lg:w-52">
                <span className="block text-[#c9a24b]">Vault protocol</span>
                <span className="block">01 · Record link</span>
                <span className="block">02 · Receive preview</span>
                <span className="block">03 · Seal R2 backup</span>
              </div>
            </div>
          </section>
        )}
      </main>

      <button onClick={openNewRecord} className="vault-seal-action fixed bottom-5 right-5 z-20 h-14 w-14 sm:hidden" aria-label="Add a project"><img src={sealMark} alt="" className="h-10 w-10 object-contain" /></button>

      <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setFormError(""); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-none border-[#c9a24b]/35 bg-[#17151d] p-0 text-[#f3eee3] shadow-2xl sm:max-w-xl">
          <form onSubmit={handleSave}>
            <DialogHeader className="border-b border-[#c9a24b]/18 bg-[linear-gradient(125deg,rgba(201,162,75,.08),transparent_58%)] px-6 pb-5 pt-6">
              <div className="mb-4 flex items-center gap-3"><img src={sealMark} className="h-9 w-9" alt="" /><span className="vault-mono text-[10px] uppercase tracking-[0.19em] text-[#dfc37b]">{editingId ? "Amend the record" : "Prepare the seal"}</span></div>
              <DialogTitle className="vault-display text-2xl font-semibold tracking-[-0.035em]">{editingId ? "Edit a vault entry" : "Seal a project into the vault"}</DialogTitle>
              <DialogDescription className="pt-2 text-sm leading-6 text-[#a7a0ad]">{editingId ? "Update the details that belong with this build." : "Add the destination, then let the archive keep its preview and context."}</DialogDescription>
            </DialogHeader>
            <div className="space-y-5 px-6 py-6">
              <div className="space-y-2"><Label htmlFor="project-url" className="vault-mono text-[10px] uppercase tracking-[0.14em] text-[#c7b97f]">Project URL <span className="text-[#e8590c]">*</span></Label><Input id="project-url" value={draft.url} onChange={(event) => setDraft({ ...draft, url: event.target.value })} className="vault-input h-11" placeholder="https://your-project.com" autoComplete="url" required /></div>
              <div className="grid gap-5 sm:grid-cols-[1fr_11rem]">
                <div className="space-y-2"><Label htmlFor="project-title" className="vault-mono text-[10px] uppercase tracking-[0.14em] text-[#c7b97f]">Project title <span className="text-[#e8590c]">*</span></Label><Input id="project-title" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} className="vault-input h-11" placeholder="Name the build" maxLength={80} required /></div>
                <div className="space-y-2"><Label className="vault-mono text-[10px] uppercase tracking-[0.14em] text-[#c7b97f]">Category</Label><Select value={draft.category} onValueChange={(category: Category) => setDraft({ ...draft, category })}><SelectTrigger className="vault-input h-11 w-full"><SelectValue /></SelectTrigger><SelectContent className="border-[#c9a24b]/35 bg-[#17151d] text-[#f3eee3]">{categories.map((category) => <SelectItem key={category} value={category} className="focus:bg-[#c9a24b]/12 focus:text-[#f3eee3]">{category}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="space-y-2"><Label htmlFor="project-note" className="vault-mono text-[10px] uppercase tracking-[0.14em] text-[#c7b97f]">Marginal note <span className="text-[#817a88]">optional</span></Label><Input id="project-note" value={draft.note} onChange={(event) => setDraft({ ...draft, note: event.target.value })} className="vault-input h-11" placeholder="A short note for your future self" maxLength={160} /></div>
              {formError && <p role="alert" className="border-l-2 border-[#e8590c] bg-[#e8590c]/8 px-3 py-2 text-xs leading-5 text-[#ffc1ae]">{formError}</p>}
            </div>
            <DialogFooter className="border-t border-[#c9a24b]/18 bg-[#121016] px-6 py-4 sm:justify-between">
              <p className="vault-mono hidden text-[9px] uppercase tracking-[0.13em] text-[#77717e] sm:block">Live thumbnail on save</p>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)} className="rounded-none border-[#c9a24b]/22 bg-transparent text-[#bdb7c4] hover:bg-white/5 hover:text-[#f3eee3]">Cancel</Button><Button type="submit" className="rounded-none border border-[#c9a24b] bg-[#c9a24b] text-xs font-extrabold uppercase tracking-[0.1em] text-[#18131a] hover:bg-[#e0bc67]"><ArchiveRestore className="mr-2 h-3.5 w-3.5" /> {editingId ? "Save amendment" : "Seal entry"}</Button></div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <footer className="container border-t border-[#c9a24b]/12 py-6 text-center"><p className="vault-mono text-[9px] uppercase tracking-[0.16em] text-[#696370]">MK Vault · Local-first by default · Optional private Cloudflare R2 backups</p></footer>
    </div>
  );
}
