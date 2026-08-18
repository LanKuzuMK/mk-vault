export type ShareableProject = {
  title: string;
  url: string;
  note?: string;
};

async function writeClipboardText(value: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const temporaryInput = document.createElement("textarea");
  temporaryInput.value = value;
  temporaryInput.dataset.allowCopy = "true";
  temporaryInput.setAttribute("readonly", "");
  temporaryInput.style.position = "fixed";
  temporaryInput.style.opacity = "0";
  document.body.appendChild(temporaryInput);
  temporaryInput.select();
  const copied = document.execCommand("copy");
  temporaryInput.remove();

  if (!copied) throw new Error("Clipboard is unavailable");
}

export async function copyProjectLink(url: string) {
  try {
    await writeClipboardText(url);
    return true;
  } catch {
    return false;
  }
}

export async function shareProjectLink(project: ShareableProject) {
  const shareData: ShareData = {
    title: project.title,
    text: project.note ? `${project.title} — ${project.note}` : project.title,
    url: project.url,
  };

  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return "shared" as const;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled" as const;
    }
  }

  return (await copyProjectLink(project.url)) ? "copied" as const : "unavailable" as const;
}
