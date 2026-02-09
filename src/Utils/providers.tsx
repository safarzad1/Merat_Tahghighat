"use client";

import { useEffect } from "react";

export function ScriptProvider() {
  useEffect(() => {
    const loadScript = (src: string, attempt = 1): Promise<void> => {
      const maxAttempts = 3;
      const backoffMs = 500 * attempt;

      return new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${src}"]`);
        if (existingScript) return resolve();

        const script = document.createElement("script");
        script.src = src;
        script.async = true;
        script.type = "text/javascript";

        script.onload = () => resolve();
        script.onerror = () => {
          if (attempt < maxAttempts) {
            setTimeout(() => {
              script.remove();
              loadScript(src, attempt + 1).then(resolve).catch(reject);
            }, backoffMs);
          } else {
            reject(new Error(`Failed to load: ${src}`));
          }
        };

        document.head.appendChild(script);
      });
    };

    const loadStyles = (href: string) => {
      if (!document.querySelector(`link[href="${href}"]`)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        document.head.appendChild(link);
      }
    };

    const initializeStimulsoft = async () => {
      try {
        const reportsUrl = "/vendor/stimulsoft.reports.js";
        const viewerUrl = "/vendor/stimulsoft.viewer.js";
        const designerUrl = "/vendor/stimulsoft.designer.js";

        const viewerCssUrl = "/vendor/stimulsoft.viewer.office2013.lightgrayblue.css";
        const designerCssUrl = "/vendor/stimulsoft.designer.office2013.lightgrayblue.css";

        loadStyles(viewerCssUrl);
        loadStyles(designerCssUrl);

        // load JS
        await loadScript(reportsUrl);
        await loadScript(viewerUrl);
        await loadScript(designerUrl);

        // ⏳ صبر کم تا Stimulsoft آماده بشه
        await new Promise(r => setTimeout(r, 200));

        // ⛔ در اینجا دیگر Stimulsoft وجود دارد
        // if (window.Stimulsoft) {
        //   window.Stimulsoft.Base.StiLicense.loadFromFile("/stimulsoft/license.key");
        // }

        // اعلام آماده شدن
        window.dispatchEvent(new CustomEvent("stimulsoft-ready"));
      } catch (error) {
        console.error("Error loading Stimulsoft:", error);
        setTimeout(initializeStimulsoft, 2000);
      }
    };

    initializeStimulsoft();
  }, []);

  return null;
}
