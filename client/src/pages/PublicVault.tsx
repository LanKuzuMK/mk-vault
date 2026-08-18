/* Public collection: visitors can browse published projects without receiving any management capabilities. */
import { useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Copy, FolderOpenDot, KeyRound, Search, Share2, Sparkles, Star } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { copyProjectLink, shareProjectLink } from "@/lib/linkActions";
import { shouldRetryTransientRequest, transientRequestRetryDelay } from "@/lib/queryRetry";

const sealMark = "/manus-storage/mk-vault-seal_74861e0b.png";
const archiveTile = "/manus-storage/mk-vault-archive-tile_29e0d335.jpg";

type Category = "Game" | "Tool" | "App" | "Portfolio" | "Other";
type PublicProject = { id: string; url: string; title: string; category: Category; note: string; featuredRank: number };

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

function PublicProjectCard({ project, index }: { project: PublicProject; index: number }) {
  const [imageState, setImageState] = useState<"screenshot" | "favicon" | "fallback">("screenshot");
  const image = imageState === "screenshot" ? screenshotUrl(project.url) : imageState === "favicon" ? faviconUrl(project.url) : "";

  async function copyLink() {
    const copied = await copyProjectLink(project.url);
    copied ? toast.success("Project link copied.") : toast.error("The link could not be copied. Please copy it from the address shown on the card.");
  }

  async function shareLink() {
    const result = await shareProjectLink(project);
    if (result === "copied") toast.success("Sharing is unavailable here, so the project link was copied.");
    if (result === "unavailable") toast.error("Sharing is unavailable in this browser.");
  }

  return (
    <article className={`vault-card public-vault-card group relative overflow-hidden ${project.featuredRank > 0 ? "public-vault-card--featured" : ""}`}>
      <a href={project.url} target="_blank" rel="noreferrer" className="block cursor-pointer" aria-label={`Visit ${project.title}`}>
      <div className="vault-card-thumb">
        {image ? <img src={image} alt={`Preview of ${project.title}`} loading="lazy" referrerPolicy="no-referrer" onError={() => setImageState((previous) => previous === "screenshot" ? "favicon" : "fallback")} /> : <div className="relative z-10 flex h-full items-center justify-center"><img className="h-12 w-12 rounded-full border border-[#c9a24b]/40 bg-[#0b0a10]/80 p-2 object-contain" src={faviconUrl(project.url) || sealMark} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(event) => { event.currentTarget.src = sealMark; }} /></div>}
        <span className="vault-mono absolute left-4 top-4 z-10 border border-[#c9a24b]/25 bg-[#0b0a10]/75 px-2 py-1 text-[10px] font-medium tracking-[0.12em] text-[#dfc37b] backdrop-blur-sm">No. {String(index + 1).padStart(3, "0")}</span>
        {project.featuredRank > 0 && <span className="vault-mono absolute right-4 top-4 z-10 inline-flex items-center gap-1 border border-[#dfc37b]/45 bg-[#221b12]/85 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.12em] text-[#f1d98e] backdrop-blur-sm"><Star className="h-3 w-3 fill-current" /> Featured {String(project.featuredRank).padStart(2, "0")}</span>}
        <img className="absolute bottom-3 right-3 z-10 h-8 w-8 opacity-70" src={sealMark} alt="" />
      </div>
      <div className="relative z-10 flex min-h-36 flex-col p-5">
        <div className="mb-3 flex items-start justify-between gap-3"><span className={`inline-flex border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.15em] ${categoryStyle(project.category)}`}>{project.category}</span><ArrowUpRight className="public-card-visit h-4 w-4 text-[#c9a24b]" /></div>
        <h2 className="mb-2 line-clamp-1 text-base font-bold tracking-[-0.025em] text-[#f3eee3]">{project.title}</h2>
        <p className="vault-mono mb-3 truncate text-[11px] text-[#8f8999]">{prettyDomain(project.url)}</p>
        <p className="mt-auto line-clamp-2 border-t border-[#c9a24b]/10 pt-3 pr-20 text-xs leading-5 text-[#aba6b0]">{project.note || "Open project"}</p>
      </div>
      </a>
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5" aria-label={`Share options for ${project.title}`}>
        <button type="button" onClick={() => { void copyLink(); }} className="grid h-8 w-8 place-items-center border border-[#c9a24b]/22 bg-[#0b0a10]/80 text-[#d8c994] backdrop-blur-sm transition-colors hover:border-[#c9a24b]/65 hover:bg-[#c9a24b]/15 hover:text-[#fff3ce] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a24b]" aria-label={`Copy link to ${project.title}`} title="Copy link"><Copy className="h-3.5 w-3.5" /></button>
        <button type="button" onClick={() => { void shareLink(); }} className="grid h-8 w-8 place-items-center border border-[#c9a24b]/22 bg-[#0b0a10]/80 text-[#d8c994] backdrop-blur-sm transition-colors hover:border-[#c9a24b]/65 hover:bg-[#c9a24b]/15 hover:text-[#fff3ce] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c9a24b]" aria-label={`Share ${project.title}`} title="Share link"><Share2 className="h-3.5 w-3.5" /></button>
      </div>
    </article>
  );
}

function PublicCatalogLoading() {
  return <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Loading published project records">{[0, 1, 2].map((index) => <div key={index} className="public-card-skeleton" style={{ animationDelay: `${index * 90}ms` }}><div className="public-card-skeleton-thumb" /><div className="space-y-3 p-5"><div className="h-3 w-16 border border-[#c9a24b]/15 bg-[#c9a24b]/8" /><div className="h-5 w-4/5 bg-[#f3eee3]/8" /><div className="h-3 w-2/5 bg-[#f3eee3]/6" /><div className="mt-7 h-px bg-[#c9a24b]/10" /><div className="h-3 w-full bg-[#f3eee3]/5" /></div></div>)}</section>;
}

export default function PublicVault() {
  const projects = trpc.publicCatalog.list.useQuery(undefined, {
    retry: shouldRetryTransientRequest,
    retryDelay: transientRequestRetryDelay,
    refetchOnReconnect: "always",
    refetchOnWindowFocus: false,
  });
  const records = (projects.data ?? []) as PublicProject[];
  const featuredCount = records.filter((project) => project.featuredRank > 0).length;

  return (
    <div className="vault-shell">
      <header className="vault-hero border-b border-[#c9a24b]/15">
        <div className="container relative py-6 sm:py-8 lg:py-10">
          <nav className="flex items-center justify-between gap-4" aria-label="Visitor navigation">
            <Link href="/" className="flex items-center gap-3 text-[#f3eee3]" aria-label="MK Vault public archive home"><span className="grid h-11 w-11 place-items-center border border-[#c9a24b]/45 bg-[#0b0a10]/60 p-1.5"><img className="h-full w-full object-contain" src={sealMark} alt="" /></span><span><span className="vault-wordmark block text-lg font-semibold tracking-[0.18em]">MK Vault</span><span className="vault-mono mt-0.5 block text-[9px] uppercase tracking-[0.2em] text-[#a7a0ac]">Things I&apos;ve chosen to share</span></span></Link>
            <Link href="/admin" className="inline-flex h-10 items-center border border-[#c9a24b]/25 bg-[#16141c]/65 px-3 text-xs font-semibold uppercase tracking-[0.11em] text-[#d2cbd5] transition-colors hover:border-[#c9a24b]/55 hover:bg-[#c9a24b]/10 hover:text-[#f3eee3]"><KeyRound className="mr-2 h-3.5 w-3.5 text-[#c9a24b]" /> Admin access</Link>
          </nav>
          <div className="max-w-3xl pb-9 pt-18 sm:pb-12 sm:pt-24 lg:pb-16 lg:pt-28"><p className="vault-mono mb-5 text-[10px] font-medium uppercase tracking-[0.24em] text-[#dfc37b]">My public work</p><h1 className="vault-display max-w-2xl text-4xl leading-[1.18] font-semibold tracking-[-0.04em] text-[#f3eee3] sm:text-5xl lg:text-6xl">Things I&apos;ve made, kept in one place.</h1><p className="mt-5 max-w-xl text-sm leading-7 text-[#b9b4be] sm:text-base">This is a small collection of projects I&apos;ve chosen to share. Open any link to see the work.</p></div>
          <div className="vault-rule max-w-4xl" />
        </div>
      </header>
      <main className="container pb-24 pt-8 sm:pt-10 lg:pt-14">
        <section className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#c9a24b]/15 pb-8"><div><p className="vault-mono mb-3 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.2em] text-[#dfc37b]"><FolderOpenDot className="h-4 w-4" /> What I&apos;ve shared</p><h2 className="vault-display text-2xl font-semibold tracking-[-0.035em] text-[#f3eee3] sm:text-3xl">My project links</h2></div><div className="flex items-center gap-2"><span className="vault-mono border border-[#c9a24b]/20 bg-[#16141c] px-3 py-2 text-[10px] uppercase tracking-[0.13em] text-[#b9b0bf]">{records.length} shared {records.length === 1 ? "link" : "links"}</span>{featuredCount > 0 && <span className="vault-mono inline-flex items-center gap-1 border border-[#dfc37b]/35 bg-[#dfc37b]/8 px-3 py-2 text-[10px] uppercase tracking-[0.13em] text-[#f1d98e]"><Sparkles className="h-3 w-3" /> {featuredCount} featured</span>}</div></section>
        {projects.isLoading ? <PublicCatalogLoading /> : projects.error ? <section className="border border-[#e8590c]/35 bg-[#e8590c]/8 px-6 py-12 text-center"><Search className="mx-auto h-6 w-6 text-[#ffb4a2]" /><h2 className="vault-display mt-4 text-xl text-[#f3eee3]">I couldn&apos;t load my shared links.</h2><p className="mt-2 text-sm text-[#b9b4be]">Please try again shortly.</p></section> : records.length ? <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" aria-label="Published project records">{records.map((project, index) => <PublicProjectCard key={project.id} project={project} index={index} />)}</section> : <section className="relative overflow-hidden border border-[#c9a24b]/22 bg-[#16141c]"><div className="absolute inset-0 opacity-25" style={{ backgroundImage: `linear-gradient(90deg, rgba(22,20,28,.95), rgba(22,20,28,.6)), url(${archiveTile})`, backgroundPosition: "center", backgroundSize: "cover" }} /><div className="relative grid min-h-72 items-center gap-8 px-7 py-12 sm:px-12 lg:grid-cols-[1fr_auto]"><div><p className="vault-mono text-[10px] uppercase tracking-[0.2em] text-[#dfc37b]">My shelf · 000</p><h2 className="vault-display mt-3 text-3xl text-[#f3eee3]">I haven&apos;t shared any projects yet.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-[#b1acb7]">When I&apos;m ready to share something, I&apos;ll add it here.</p></div><div className="vault-mono border-l border-[#c9a24b]/25 pl-5 text-[10px] uppercase leading-6 tracking-[0.14em] text-[#8f8998]"><span className="block text-[#c9a24b]">How I share</span><span className="block">01 · Pick a project</span><span className="block">02 · Share its link</span><span className="block">03 · Keep it current</span></div></div></section>}
      </main>
      <footer className="container border-t border-[#c9a24b]/12 py-6 text-center"><p className="vault-mono text-[9px] uppercase tracking-[0.16em] text-[#696370]">MK Vault · My project links</p></footer>
    </div>
  );
}
