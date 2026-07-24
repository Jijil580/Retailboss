"use client";

import { Download, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
      setHidden(false);
    };
    const installed = () => {
      setInstallPrompt(null);
      setHidden(true);
    };
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  if (!installPrompt || hidden) return null;

  async function install() {
    await installPrompt?.prompt();
    const choice = await installPrompt?.userChoice;
    if (choice?.outcome === "accepted") setInstallPrompt(null);
  }

  return (
    <aside className="pwa-install-prompt" aria-label="Install Shape of You app">
      <span className="pwa-install-icon"><Download size={19} /></span>
      <span><strong>Install Shape of You</strong><small>Use it like an app from Chrome</small></span>
      <button className="pwa-install-action" onClick={install} type="button">Install</button>
      <button className="pwa-install-close" onClick={() => setHidden(true)} type="button" aria-label="Hide install prompt"><X size={16} /></button>
    </aside>
  );
}
