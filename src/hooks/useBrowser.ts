import { useCallback, useEffect, useRef } from "react";
import { Browser } from "../browser.js";
import type { BrowserOptions } from "../browser.js";
import { parseSnapshot } from "../parser.js";
import { render } from "../renderer.js";
import type { AppState, InteractiveElement } from "../state/AppState.js";
import type { AppActions, PageData } from "../state/useAppState.js";

export function useBrowser(
  state: AppState,
  actions: AppActions,
  browserOptions?: BrowserOptions,
): {
  navigate: (url: string) => Promise<void>;
  click: (ref: string) => Promise<void>;
  back: () => Promise<void>;
  cleanup: () => Promise<void>;
} {
  const browserRef = useRef<Browser | null>(null);
  const optionsRef = useRef(browserOptions);

  const getBrowser = useCallback(() => {
    if (!browserRef.current) {
      browserRef.current = new Browser(optionsRef.current);
    }
    return browserRef.current;
  }, []);

  const loadPage = useCallback(async (): Promise<PageData | null> => {
    const browser = getBrowser();
    try {
      const [snapshot, url, title] = await Promise.all([
        browser.snapshot({ interactive: true }),
        browser.getUrl(),
        browser.getTitle(),
      ]);

      const nodes = parseSnapshot(snapshot);
      const result = render(nodes);

      const elements: InteractiveElement[] = result.lines
        .filter((line) => line.interactive && line.number !== undefined)
        .map((line) => ({
          ref: result.numberToRef[line.number!]!,
          label: line.number!,
          text: line.text.replace(/^\[\d+\]\s*/, ""),
          type: "link" as const,
        }));

      return {
        url,
        title,
        elements,
        totalLines: result.lines.length,
        numberToRef: result.numberToRef,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      actions.pushStatus(`Error: ${message}`, "error", 5000);
      return null;
    }
  }, [getBrowser, actions]);

  const navigate = useCallback(
    async (url: string) => {
      const browser = getBrowser();
      actions.setLoading(true);
      actions.pushStatus(`Loading ${url}...`, "loading");

      try {
        await browser.open(url);
        const pageData = await loadPage();
        if (pageData) {
          actions.setPage(pageData);
          actions.clearStatus("loading");
        }
      } catch (error) {
        actions.setLoading(false);
        actions.clearStatus("loading");
        const message = error instanceof Error ? error.message : "Unknown error";
        actions.pushStatus(`Failed to load: ${message}`, "error", 5000);
      }
    },
    [getBrowser, loadPage, actions],
  );

  const click = useCallback(
    async (ref: string) => {
      const browser = getBrowser();
      actions.setLoading(true);

      try {
        await browser.click(ref);
        await browser.wait(500);
        const pageData = await loadPage();
        if (pageData) {
          actions.setPage(pageData);
        }
      } catch (error) {
        actions.setLoading(false);
        const message = error instanceof Error ? error.message : "Unknown error";
        actions.pushStatus(`Click failed: ${message}`, "error", 3000);
      }
    },
    [getBrowser, loadPage, actions],
  );

  const back = useCallback(async () => {
    const browser = getBrowser();
    actions.setLoading(true);
    actions.pushStatus("Going back...", "loading");

    try {
      await browser.back();
      await browser.wait(500);
      const pageData = await loadPage();
      if (pageData) {
        actions.setPage(pageData);
        actions.clearStatus("loading");
      }
    } catch (error) {
      actions.setLoading(false);
      actions.clearStatus("loading");
      const message = error instanceof Error ? error.message : "Unknown error";
      actions.pushStatus(`Back failed: ${message}`, "error", 3000);
    }
  }, [getBrowser, loadPage, actions]);

  const cleanup = useCallback(async () => {
    if (browserRef.current) {
      try {
        await browserRef.current.close();
      } catch {
        // Ignore cleanup errors
      }
      browserRef.current = null;
    }
  }, []);

  // Load initial URL on mount
  useEffect(() => {
    if (state.url && state.elements.length === 0 && !state.isLoading) {
      navigate(state.url);
    }
  }, []);

  return { navigate, click, back, cleanup };
}
