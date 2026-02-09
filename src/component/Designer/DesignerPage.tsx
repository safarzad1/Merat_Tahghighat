"use client";

import { useEffect, useState, useRef } from "react";
import '@/Styles/globals.css'

type StimulsoftWindow = typeof window & {
    Stimulsoft?: Record<string, unknown>;
};

export default function DesignerPage() {
    const [ready, setReady] = useState(false);
    const initializedRef = useRef(false);

    useEffect(() => {
        const createHeader = () => {
            const header = document.createElement("div");
            header.id = "designer-header";
            header.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 60px;
        background-color: #2c3e50;
        color: white;
        display: flex;
        align-items: center;
        padding-left: 20px;
        padding-right: 20px;
        box-sizing: border-box;
        box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        z-index: 10000;
      `;

            header.innerHTML = `
        <h2 style="margin: 0; margin-right: auto; font-size: 20px; font-weight: 600;">
          طراح گزارش (Designer)
        </h2>
        <a href="/Dashboard" class="shabnam" style="
          padding: 8px 16px;
          background-color: #e74c3c;
          color: white;
          text-decoration: none;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          border: none;
          transition: all 0.3s ease;
          display: inline-block;
        ">
          ← بازگشت به صفحه اصلی
        </a>
      `;

            document.body.insertBefore(header, document.body.firstChild);
        };

        function initializeDesigner() {
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
                } catch {
                    // Sample report not found, continue with empty report
                }

                const designer = new (w.Stimulsoft as any).Designer.StiDesigner();
                designer.report = report;
                designer.renderHtml("designer-container");

                setTimeout(() => {
                    if (!document.getElementById("designer-header")) {
                        createHeader();
                    }

                    const container = document.getElementById("designer-container");
                    if (container) {
                        container.style.paddingTop = "60px";
                        container.style.boxSizing = "border-box";
                        container.style.height = "calc(100vh)";
                    }

                    document.body.style.paddingTop = "60px";
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
            initializeDesigner();
        };

        window.addEventListener("stimulsoft-ready", handleReady);

        // If already loaded, initialize immediately
        const w = window as StimulsoftWindow;
        if (w.Stimulsoft) {
            initializeDesigner();
        }

        return () => {
            window.removeEventListener("stimulsoft-ready", handleReady);
        };
    }, []);

    return (
        <div
            id="designer-container"
            style={{
                width: "100vw",
                height: "100vh",
                visibility: ready ? "visible" : "hidden",
                backgroundColor: "#ffffff"
            }}
        />
    );
}
