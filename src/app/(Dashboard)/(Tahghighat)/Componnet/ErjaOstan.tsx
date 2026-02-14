"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import DescriptionWithModal from "./DescriptionWithModal";
import { CircleAlert, Delete } from "lucide-react";
import { useConfirm } from "@/Utils/ConfirmModalContext";
import { DeleteErjabyId, GetTahghighByID, JambandiOstan1 } from "@/Lib/ApiService";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import TahghighatStateModal from "./TahghighatStateModal";
import { GetFileNamePic } from "@/Lib/ApiServiceNameha";

interface TahghighItem {
  ErjaId: number;
  ID: number;
  CountKolErja: number;
  CountErjaShahrestan: number;
  CountErjaShahrestanDone: number;
  CountErjaMohaghegh: number;
  CountErjaMohagheghDone: number;
  CountErja: number;
  ErjaLastStat: number;
  IsDone: boolean;
  ShomarehParvandeh: string;
  FirstName: string;
  LastName: string;
  NameHozeh: string;
  MahalSender_NameFarsi: string;
  MahalReciver_NameFarsi: string;
  CreateDateTime: string;
  Description: string;
}

interface FehrestErjaParvandehProps {
  erjaParentId: number;
}

/** خروجی سرویس JambandiOstan1 */
type JambandiResponse = {
  ID?: string | number;
  ErjaId?: string | number;
  Jambandi?: string;
  Page1?: string;
  Page2?: string;
  PasokhSoal1?: string;
  CreateDateTime?: string;
  CreateUserId?: string;
  LastEditDateTime?: string | null;
  LastEditUserId?: string | null;
};

type PanelTab = "Jambandi" | "Page1" | "Page2";
type ViewerItem = { url: string; label: string };

const SWIPE_THRESHOLD = 60;

const FehrestErjaParvandeh = ({ erjaParentId }: FehrestErjaParvandehProps) => {
  const user = useSelector((state: RootState) => state.user);

  const [Mahal, SetMahal] = useState(0);
  const [UserId, SetUserId] = useState(0);
  const { showConfirm } = useConfirm();
  const router = useRouter();

  const [data, setData] = useState<TahghighItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // مودال تغییرات
  const [open, setOpen] = useState(false);
  const [erjaId, setErjaId] = useState<number | null>(null);

  // پنل جم‌بندی/صفحات
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelErjaId, setPanelErjaId] = useState<number | null>(null);
  const [panelTab, setPanelTab] = useState<PanelTab>("Jambandi");

  const [jambandi, setJambandi] = useState<JambandiResponse | null>(null);
  const [jambandiLoading, setJambandiLoading] = useState(false);
  const [jambandiError, setJambandiError] = useState("");

  // -----------------------------
  // Resolve FileName -> Blob URL (GetFileNamePic)
  // -----------------------------
  const [resolvedFiles, setResolvedFiles] = useState<Record<string, string>>({});
  const [resolvingFiles, setResolvingFiles] = useState<Record<string, boolean>>({});
  const [resolveErrors, setResolveErrors] = useState<Record<string, string>>({});

  // برای جلوگیری از Memory Leak
  const objectUrlsRef = useRef<string[]>([]);

  const cleanupObjectUrls = () => {
    try {
      objectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
    } catch { }
    objectUrlsRef.current = [];
  };

  useEffect(() => {
    return () => {
      cleanupObjectUrls();
    };
  }, []);

  // اگر پنل بسته شد هم می‌تونی پاک کنی (اختیاری)
  useEffect(() => {
    if (!panelOpen) {
      cleanupObjectUrls();
      setResolvedFiles({});
      setResolvingFiles({});
      setResolveErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelOpen]);

  const isAbsoluteLike = (s?: string) => {
    if (!s) return false;
    return s.startsWith("http") || s.startsWith("data:") || s.startsWith("blob:");
  };

  // fallback: فایل‌ها داخل public/uploads
  const fallbackPublicUploads = (name: string) => `/uploads/${name}`;

  const guessMime = (fileName: string) => {
    const ext = (fileName.split(".").pop() || "").toLowerCase();
    if (ext === "png") return "image/png";
    if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
    if (ext === "webp") return "image/webp";
    if (ext === "gif") return "image/gif";
    if (ext === "bmp") return "image/bmp";
    if (ext === "pdf") return "application/pdf";
    return "application/octet-stream";
  };

  const toBlob = (data: any, fileName: string): Blob => {
    // اگر خودش Blob است
    if (data instanceof Blob) return data;

    // اگر ArrayBuffer است
    if (data instanceof ArrayBuffer) {
      return new Blob([data], { type: guessMime(fileName) });
    }

    // اگر Uint8Array یا Buffer-like است
    if (data?.buffer instanceof ArrayBuffer) {
      return new Blob([data], { type: guessMime(fileName) });
    }

    throw new Error("خروجی فایل معتبر نیست (Blob/ArrayBuffer دریافت نشد)");
  };

  const ensureResolved = async (fileName?: string) => {
    if (!fileName) return;

    // اگر از قبل resolve شده
    if (resolvedFiles[fileName]) return;

    // اگر همین الان در حال resolve است
    if (resolvingFiles[fileName]) return;

    // اگر آدرس مطلق بود، مستقیم
    if (isAbsoluteLike(fileName)) {
      setResolvedFiles((prev) => ({ ...prev, [fileName]: fileName }));
      return;
    }

    setResolvingFiles((prev) => ({ ...prev, [fileName]: true }));
    setResolveErrors((prev) => ({ ...prev, [fileName]: "" }));

    try {
      // ✅ سرویس باید Blob یا ArrayBuffer بده
      const res: any = await GetFileNamePic(fileName, user.UserId);

      // axios: res.data = Blob|ArrayBuffer
      // fetch: res = Blob|ArrayBuffer
      const raw = res?.data ?? res;

      const blob = toBlob(raw, fileName);
      const url = URL.createObjectURL(blob);

      objectUrlsRef.current.push(url);
      setResolvedFiles((prev) => ({ ...prev, [fileName]: url }));
    } catch (e: any) {
      setResolveErrors((prev) => ({
        ...prev,
        [fileName]: e?.message || "خطا در دریافت فایل",
      }));

      // fallback اگر سرویس جواب نداد
      setResolvedFiles((prev) => ({ ...prev, [fileName]: fallbackPublicUploads(fileName) }));
    } finally {
      setResolvingFiles((prev) => ({ ...prev, [fileName]: false }));
    }
  };

  // هر وقت jambandi آمد، Page1/Page2 را resolve کن
  useEffect(() => {
    if (jambandi?.Page1) ensureResolved(jambandi.Page1);
    if (jambandi?.Page2) ensureResolved(jambandi.Page2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jambandi?.Page1, jambandi?.Page2]);

  // -----------------------------
  // Viewer (Zoom / Pan / Swipe)
  // -----------------------------
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerItems, setViewerItems] = useState<ViewerItem[]>([]);
  const [viewerIndex, setViewerIndex] = useState(0);

  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState({ x: 0, y: 0 });

  const swipeStartXRef = useRef<number | null>(null);
  const [isSwiping, setIsSwiping] = useState(false);
  const [swipeX, setSwipeX] = useState(0);

  const resetViewerTransform = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSwipeX(0);
    setIsDragging(false);
    setIsSwiping(false);
    swipeStartXRef.current = null;
  };

  const openViewer = (items: ViewerItem[], index: number) => {
    setViewerItems(items);
    setViewerIndex(index);
    setViewerOpen(true);
    resetViewerTransform();
  };

  const closeViewer = () => {
    setViewerOpen(false);
    setViewerItems([]);
    setViewerIndex(0);
    resetViewerTransform();
  };

  const goNextViewer = () => {
    if (!viewerItems.length) return;
    setViewerIndex((i) => (i + 1) % viewerItems.length);
    resetViewerTransform();
  };

  const goPrevViewer = () => {
    if (!viewerItems.length) return;
    setViewerIndex((i) => (i - 1 + viewerItems.length) % viewerItems.length);
    resetViewerTransform();
  };

  // -----------------------------
  // Page Items using resolved URLs
  // -----------------------------
  const pageItems: ViewerItem[] = useMemo(() => {
    const p1Name = jambandi?.Page1;
    const p2Name = jambandi?.Page2;

    const p1Url = p1Name ? (resolvedFiles[p1Name] || fallbackPublicUploads(p1Name)) : "";
    const p2Url = p2Name ? (resolvedFiles[p2Name] || fallbackPublicUploads(p2Name)) : "";

    const p1 = p1Name ? { url: p1Url, label: "Page1" } : null;
    const p2 = p2Name ? { url: p2Url, label: "Page2" } : null;

    return [p1, p2].filter(Boolean) as ViewerItem[];
  }, [jambandi?.Page1, jambandi?.Page2, resolvedFiles]);

  // -----------------------------
  // API Calls
  // -----------------------------
  const loadData = async () => {
    try {
      const result = await GetTahghighByID(0, erjaParentId, 3);

      if (result.status === 200) {
        setData(result.data || []);
      } else if (result.status === 401) {
        router.push("/Login");
      } else {
        setData([]);
      }
    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    SetMahal(user.Mahal);
    SetUserId(user.UserId);
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [erjaParentId, router]);

  const DeleteErja = async (ID: number) => {
    await DeleteErjabyId(ID, UserId);
    loadData();
  };

  const loadJambandi = async (id: number) => {
    setJambandiError("");
    setJambandiLoading(true);

    try {
      const res: any = await JambandiOstan1(Number(id));
      const parsed = res?.data?.data ?? res?.data ?? res;

      // ✅ سرویس شما Array برمی‌گردونه
      const obj = Array.isArray(parsed)
        ? (parsed.find((x: any) => String(x?.ErjaId) === String(id)) ?? parsed[0])
        : parsed;

      setJambandi(obj || null);
    } catch (e: any) {
      console.error(e);
      setJambandiError(e?.message || "خطا در دریافت جم‌بندی");
      setJambandi(null);
    } finally {
      setJambandiLoading(false);
    }
  };

  const openPanel = (id: number) => {
    setPanelErjaId(id);
    setPanelTab("Jambandi");
    setPanelOpen(true);

    // reset
    setJambandi(null);
    setJambandiError("");
    setJambandiLoading(false);

    // فایل‌های قبلی را هم پاک کن تا قاطی نشه
    cleanupObjectUrls();
    setResolvedFiles({});
    setResolvingFiles({});
    setResolveErrors({});

    loadJambandi(id);
  };

  useEffect(() => {
    if (panelOpen && panelTab === "Jambandi" && panelErjaId) {
      loadJambandi(panelErjaId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panelTab]);

  // -----------------------------
  // UI Components
  // -----------------------------
  const ThumbCard = ({ label, fileName }: { label: "Page1" | "Page2"; fileName?: string }) => {
    if (!fileName) {
      return (
        <div className="border rounded-lg p-3 bg-gray-50 text-gray-600">
          <div className="font-semibold mb-2">{label}</div>
          <div className="text-sm">فایلی ثبت نشده</div>
        </div>
      );
    }

    const url = resolvedFiles[fileName] || fallbackPublicUploads(fileName);
    const isLoading = !!resolvingFiles[fileName];
    const err = resolveErrors[fileName];

    return (
      <div className="w-full text-right border rounded-lg p-3 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="font-semibold">{label}</div>

          <div className="flex items-center gap-2">
            {isLoading && <span className="text-xs text-gray-600">در حال دریافت فایل...</span>}
            {!!err && <span className="text-xs text-red-600">{err}</span>}

            <button
              type="button"
              className="text-xs px-3 py-1 rounded bg-gray-100 hover:bg-gray-200"
              onClick={() => ensureResolved(fileName)}
            >
              بروزرسانی فایل
            </button>

            <button
              type="button"
              className="text-xs px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
              onClick={() => {
                const items = pageItems;
                const idx = items.findIndex((x) => x.label === label);
                if (idx >= 0) openViewer(items, idx);
              }}
            >
              نمایش با زوم
            </button>
          </div>
        </div>

        <div className="w-full border rounded-md overflow-hidden bg-gray-100">
          <img
            src={url}
            alt={label}
            className="w-full h-[240px] object-contain"
            onError={(e) => {
              // اگر URL Blob خراب بود یا expire شد، fallback را تست کن
              const img = e.currentTarget as HTMLImageElement;
              const fallback = fallbackPublicUploads(fileName);
              if (img.src !== fallback) img.src = fallback;
            }}
          />
        </div>

        <div className="mt-2 text-xs text-gray-500 break-all">{url}</div>
      </div>
    );
  };

  // -----------------------------
  // Render
  // -----------------------------
  if (loading) return <div>در حال بارگذاری...</div>;
  if (data.length === 0) return <div>داده‌ای وجود ندارد.</div>;

  return (
    <div className="px-1">
      <ul>
        {data.map((item) => (
          <li
            key={item.ErjaId}
            className={`
              my-1 py-1 p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex justify-between items-center
              ${item.IsDone === true ? "bg-green-100" : "bg-white"}
            `}
          >
            <div className="flex gap-5 whitespace-nowrap items-center">
              {item.CountKolErja === 0 && item.IsDone === false ? (
                <p className="cursor-pointer">
                  <Delete
                    onClick={() =>
                      showConfirm(
                        "آیا از حذف ارجاع اطمینان دارید؟",
                        () => DeleteErja(item.ErjaId),
                        "هشدار!",
                        "error"
                      )
                    }
                    className="text-red-500"
                  />
                </p>
              ) : (
                <p>
                  <Delete className="text-gray-700" />
                </p>
              )}

              <p>
                <span className="font-semibold text-blue-600 text-[13px]">ارسال به استان :</span>
                <span className="text-gray-700 text-[15px] mr-2 inline-block min-w-[100px]">
                  {item.MahalReciver_NameFarsi}
                </span>
              </p>

              <p>
                <span className="font-semibold text-blue-600 text-[13px]">زمان ارجاع :</span>
                <span className="text-gray-700 text-[14px] mr-2">{item.CreateDateTime}</span>
              </p>

              <p>
                <span className="font-semibold text-blue-600 text-[13px]"> تعداد ارجاع :</span>
                <span className="text-gray-700 text-[14px] mr-2">{item.CountKolErja}</span>
              </p>

              <p>
                <span className="font-semibold text-blue-600 text-[13px]">ارجاع به شهرستان :</span>
                <span className="text-gray-700 text-[14px] mr-2">{item.CountErjaShahrestan}</span>
              </p>

              <p>
                <span className="font-semibold text-blue-600 text-[13px]">ارجاع به محقق :</span>
                <span className="text-gray-700 text-[14px] mr-2">{item.CountErjaMohaghegh}</span>
              </p>

              <p>
                <span className="font-semibold text-blue-600 text-[13px]">توضیحات :</span>
                <DescriptionWithModal status="info" description={item.Description || ""} />
              </p>

              {/* ✅ دکمه پنل */}
              <button
                type="button"
                onClick={() => openPanel(item.ErjaId)}
                className="px-4 py-1 rounded-md bg-sky-600 text-white text-sm hover:bg-sky-700 transition cursor-pointer"
              >
                جمع بندی استان
              </button>

              {/* مودال تغییرات */}
              <button
                onClick={() => {
                  setOpen(true);
                  setErjaId(item.ErjaId);
                }}
                className="flex items-center gap-1 p-1 px-4 bg-purple-500 text-white rounded shadow hover:bg-purple-700 transition-colors text-sm cursor-pointer"
              >
                <CircleAlert className="w-4 h-4" />
                مشاهده تغییرات
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* ✅ پنل جم‌بندی و صفحات */}
      {panelOpen && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPanelOpen(false)} />
          <div className="absolute top-8 left-1/2 -translate-x-1/2 w-[92%] max-w-[1200px] bg-white rounded-xl shadow-2xl overflow-hidden">
            {/* header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
              <div className="font-bold text-gray-800">پنل نمایش</div>
              <div className="flex gap-2">
                {/* <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => {
                    if (panelErjaId) loadJambandi(panelErjaId);
                  }}
                >
                  بروزرسانی
                </button> */}
                <button
                  className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
                  onClick={() => setPanelOpen(false)}
                >
                  بستن
                </button>
              </div>
            </div>

            {/* tabs */}
            {/* <div className="flex gap-2 px-4 py-3 border-b">
              {(["Jambandi", "Page1", "Page2"] as PanelTab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setPanelTab(t)}
                  className={`px-4 py-1.5 rounded-full text-sm border transition
                    ${panelTab === t ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-gray-100"}
                  `}
                >
                  {t}
                </button>
              ))}
            </div> */}

            {/* body */}
            <div className="p-4 max-h-[75vh] overflow-auto">
              {jambandiLoading && <div className="p-3 text-sm text-gray-600">در حال دریافت اطلاعات...</div>}
              {!!jambandiError && <div className="p-3 text-sm text-red-600">{jambandiError}</div>}

              {!jambandiLoading && !jambandiError && (
                <>
                  {panelTab === "Jambandi" && (
                    <div className="space-y-4">
                      <div className="border rounded-lg p-3 bg-white">
                        <div className="font-semibold mb-2">توضعیحات جمع بندی</div>
                        <div className="text-sm text-gray-800 whitespace-pre-wrap">
                          {jambandi?.Jambandi?.trim() ? jambandi.Jambandi : "—"}
                        </div>


                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <ThumbCard label="Page1" fileName={jambandi?.Page1} />
                        <ThumbCard label="Page2" fileName={jambandi?.Page2} />
                      </div>
                    </div>
                  )}

                  {/* {panelTab === "Page1" && <ThumbCard label="Page1" fileName={jambandi?.Page1} />}
                  {panelTab === "Page2" && <ThumbCard label="Page2" fileName={jambandi?.Page2} />} */}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ✅ Viewer زوم/پن/سوایپ */}
      {viewerOpen && viewerItems.length > 0 && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80"
          onClick={() => {
            if (!isDragging && !isSwiping) closeViewer();
          }}
          onWheel={(e) => {
            e.preventDefault();
            setZoom((prev) => Math.min(Math.max(0.5, prev + (e.deltaY < 0 ? 0.1 : -0.1)), 6));
          }}
        >
          {/* Left */}
          <button
            type="button"
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center text-3xl select-none"
            onClick={(e) => {
              e.stopPropagation();
              goPrevViewer();
            }}
          >
            ‹
          </button>

          {/* Right */}
          <button
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center text-3xl select-none"
            onClick={(e) => {
              e.stopPropagation();
              goNextViewer();
            }}
          >
            ›
          </button>

          {/* Close */}
          <button
            type="button"
            className="absolute top-4 right-4 z-50 text-white bg-black/50 hover:bg-black/80 rounded-full w-10 h-10 flex items-center justify-center text-2xl select-none"
            onClick={(e) => {
              e.stopPropagation();
              closeViewer();
            }}
          >
            ✕
          </button>

          <img
            src={viewerItems[viewerIndex]?.url}
            alt={viewerItems[viewerIndex]?.label}
            draggable={false}
            className="select-none"
            style={{
              height: "92vh",
              width: "auto",
              maxWidth: "96vw",
              objectFit: "contain",
              transform: `scale(${zoom}) translate(${offset.x + (zoom <= 1.05 ? swipeX : 0)}px, ${offset.y}px)`,
              transition: isDragging || isSwiping ? "none" : "transform 0.15s ease",
              cursor: zoom > 1.05 ? (isDragging ? "grabbing" : "grab") : "default",
              borderRadius: 10,
              touchAction: zoom > 1.05 ? "none" : "pan-y",
            }}
            onPointerDown={(e) => {
              // اگر زوم نشده → سوایپ
              if (zoom <= 1.05) {
                setIsSwiping(true);
                swipeStartXRef.current = e.clientX;
                setSwipeX(0);
                return;
              }
              // اگر زوم شده → پن
              setIsDragging(true);
              setStartDrag({ x: e.clientX - offset.x, y: e.clientY - offset.y });
            }}
            onPointerMove={(e) => {
              if (isSwiping && swipeStartXRef.current !== null) {
                const dx = e.clientX - swipeStartXRef.current;
                setSwipeX(dx);
                return;
              }
              if (isDragging && zoom > 1.05) {
                setOffset({ x: e.clientX - startDrag.x, y: e.clientY - startDrag.y });
              }
            }}
            onPointerUp={(e) => {
              if (isSwiping) {
                setIsSwiping(false);

                if (swipeX > SWIPE_THRESHOLD) goPrevViewer();
                else if (swipeX < -SWIPE_THRESHOLD) goNextViewer();

                setSwipeX(0);
                swipeStartXRef.current = null;
                e.stopPropagation();
                return;
              }

              setIsDragging(false);
              e.stopPropagation();
            }}
            onPointerCancel={() => {
              setIsSwiping(false);
              setSwipeX(0);
              swipeStartXRef.current = null;
              setIsDragging(false);
            }}
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/60 px-3 py-1 rounded-full z-50">
            {viewerItems[viewerIndex]?.label} — {viewerIndex + 1} / {viewerItems.length}
          </div>

          <div className="absolute bottom-4 right-4 text-white text-xs bg-black/60 px-3 py-2 rounded-lg z-50 space-y-1">
            <div>🖱️ Wheel: زوم</div>
            <div>🖐️ Drag: حرکت</div>
            <div>↔️ Swipe: جابجایی</div>
          </div>
        </div>
      )}

      {/* مودال تغییرات قبلی */}
      <TahghighatStateModal isOpen={open} onClose={() => setOpen(false)} erjaid={erjaId} />
    </div>
  );
};

export default FehrestErjaParvandeh;
