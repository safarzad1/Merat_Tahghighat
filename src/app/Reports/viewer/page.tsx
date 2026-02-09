"use client";

import { useEffect, useState, useRef } from "react";

type StimulsoftWindow = typeof window & {
  Stimulsoft?: Record<string, unknown>;
};

export default function ViewerPage() {
  const [ready, setReady] = useState(false);
  const [reportTitle, setReportTitle] = useState<string>("گزارش");
  const initializedRef = useRef(false);

  useEffect(() => {
    const createHeader = () => {
      const header = document.createElement("div");
      header.id = "viewer-header";
      header.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 70px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 30px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        z-index: 10000;
        box-sizing: border-box;
      `;

      header.innerHTML = `
        <h1 style="margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 0.5px;">
          ${reportTitle}
        </h1>
        <a href="/" style="
          color: white;
          text-decoration: none;
          font-size: 14px;
          padding: 8px 15px;
          border-radius: 6px;
          background-color: rgba(255, 255, 255, 0.15);
          transition: all 0.3s ease;
          cursor: pointer;
          display: inline-block;
        ">
          ← بازگشت به صفحه اصلی
        </a>
      `;

      document.body.insertBefore(header, document.body.firstChild);
    };

    function initializeViewer() {
      if (initializedRef.current) return;
      initializedRef.current = true;

      const w = window as StimulsoftWindow;
      if (typeof w === "undefined" || !w.Stimulsoft) {
        return;
      }

      try {
        const report = new (w.Stimulsoft as any).Report.StiReport();
        
        try {
          report.loadFile("/reports/sample.mrt");
          setReportTitle(report.reportName || "گزارش");
        } catch {
          // Sample report not found, continue with empty report
        }

        const viewer = new (w.Stimulsoft as any).Viewer.StiViewer();
        viewer.report = report;
        viewer.renderHtml("viewer-container");

        setTimeout(() => {
          if (!document.getElementById("viewer-header")) {
            createHeader();
          }

          const container = document.getElementById("viewer-container");
          if (container) {
            container.style.paddingTop = "70px";
            container.style.boxSizing = "border-box";
            container.style.height = "calc(100vh)";
          }
          
          document.body.style.paddingTop = "70px";
          document.body.style.paddingRight = "0";
          document.body.style.paddingBottom = "0";
          document.body.style.paddingLeft = "0";
          document.body.style.marginTop = "0";
        }, 100);

        setReady(true);
      } catch {
        setReady(false);
      }
    }

    // Wait for stimulsoft-ready event
    const handleReady = () => {
      initializeViewer();
    };

    window.addEventListener("stimulsoft-ready", handleReady);

    // If already loaded, initialize immediately
    const w = window as StimulsoftWindow;
    if (w.Stimulsoft) {
      initializeViewer();
    }

    return () => {
      window.removeEventListener("stimulsoft-ready", handleReady);
    };
  }, [reportTitle]);

  return (
    <div
      id="viewer-container"
      style={{
        width: "100vw",
        height: "100vh",
        visibility: ready ? "visible" : "hidden",
        backgroundColor: "#ffffff"
      }}
    />
  );
}
