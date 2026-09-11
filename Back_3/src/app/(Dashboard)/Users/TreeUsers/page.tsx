"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { CityTree } from "@/Lib/ApiServiceUsers";
import { ChevronLeft, ChevronDown, Folder, FolderKey, FolderOpen } from "lucide-react";

/** =========================
 * Types
 * ========================= */
type FlatItem = {
    ID: number;
    PID: number;     // ریشه‌ها PID=0
    Name: string;
    IsHoze: number;  // ✅ int (0/1)
};

type TreeNode = FlatItem & { children: TreeNode[] };

type TreeProps = {
    nodes?: TreeNode[];                  // ✅ optional تا undefined کرش نده
    expanded: Set<number>;
    onToggle: (id: number) => void;
    onSelect: (node: TreeNode) => void;
    selectedId: number | null;
    level?: number;
};

/** =========================
 * Helpers
 * ========================= */
function buildTree(items: FlatItem[], rootPid: number = 0): TreeNode[] {
    const map = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    for (const it of items) {
        map.set(it.ID, { ...it, children: [] });
    }

    for (const it of items) {
        const node = map.get(it.ID)!;

        const isRoot = it.PID === rootPid || it.PID === 0;
        if (isRoot) {
            roots.push(node);
            continue;
        }

        const parent = map.get(it.PID);
        if (parent) parent.children.push(node);
        else roots.push(node);
    }

    return roots;
}

function flattenIds(nodes: TreeNode[], acc: number[] = []) {
    for (const n of nodes) {
        acc.push(n.ID);
        if (n.children?.length) flattenIds(n.children, acc);
    }
    return acc;
}

/**
 * خروجی CityTree را به FlatItem استاندارد تبدیل می‌کند.
 * ✅ فرض: IsHoze در API int است (0/1).
 * اگر کلیدها متفاوت بودند، اینجا map کن.
 */
function normalizeCityTree(raw: any): FlatItem[] {
    const arr: any[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
            ? raw.data
            : Array.isArray(raw?.items)
                ? raw.items
                : [];

    return arr
        .map((x) => {
            const id = x?.ID ?? x?.Id ?? x?.id ?? x?.MahalId ?? x?.CityId ?? x?.NodeId;
            const pid =
                x?.PID ?? x?.Pid ?? x?.pid ?? x?.ParentID ?? x?.ParentId ?? x?.parentId ?? x?.ParentMahalId;
            const name = x?.Name ?? x?.name ?? x?.Title ?? x?.title ?? x?.NameMahal ?? x?.CityName;

            // ✅ IsHoze
            const isHoze = x?.IsHoze ?? x?.isHoze ?? x?.ISHOZE ?? x?.Is_Hoze;

            if (id == null || name == null) return null;

            return {
                ID: Number(id),
                PID: pid == null ? 0 : Number(pid),
                Name: String(name).trim(),
                IsHoze: Number(isHoze ?? 0),
            } as FlatItem;
        })
        .filter(Boolean) as FlatItem[];
}

/** =========================
 * Tree Component
 * ========================= */
function Tree({
    nodes = [], // ✅ اگر undefined بود، []
    expanded,
    onToggle,
    onSelect,
    selectedId,
    level = 0,
}: TreeProps) {
    return (
        <div>
            {nodes.map((node) => {
                const hasChildren = (node.children?.length ?? 0) > 0;
                const isOpen = expanded.has(node.ID);
                const isSelected = selectedId === node.ID;

                const isHoze1 = Number(node.IsHoze) === 1;
                const isPid1 = Number(node.PID) === 1;

                const IconComp = isHoze1 ? FolderKey : isPid1 ? FolderOpen : Folder;

                const iconClass = isHoze1
                    ? "text-red-700"
                    : isPid1
                        ? "text-blue-700"
                        : "text-gray-700";


                // ✅ آیکن همون Folder بماند (یا اگر خواستی برای Hoze/ PID آیکن متفاوت هم می‌تونی بدهی)
                const FolderIcon = Folder;


                return (
                    <div key={node.ID} className="select-none">
                        <div
                            className={[
                                "flex items-center gap-2 rounded-xl px-2 py-1 cursor-pointer",
                                isSelected ? "bg-blue-100" : "hover:bg-gray-100",
                            ].join(" ")}
                            style={{ paddingRight: 8 + level * 18 }}
                            onClick={() => onSelect(node)}
                        >
                            {/* فلش فقط برای نودهایی که بچه دارند */}
                            {hasChildren ? (
                                <button
                                    type="button"
                                    className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onToggle(node.ID);
                                    }}
                                    title={isOpen ? "بستن" : "باز کردن"}
                                >
                                    {isOpen ? <ChevronDown size={16} /> : <ChevronLeft size={16} />}
                                </button>
                            ) : (
                                <span className="w-6 h-6" />
                            )}


                            <IconComp
                                size={18}
                                className={`${hasChildren ? "" : "opacity-70"} ${iconClass}`}
                            />


                            <span className="text-[14px] text-green-800">{node.Name}</span>
                        </div>

                        {/* فرزندان */}
                        {hasChildren && isOpen && (
                            <Tree
                                nodes={node.children}
                                expanded={expanded}
                                onToggle={onToggle}
                                onSelect={onSelect}
                                selectedId={selectedId}
                                level={level + 1}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

/** =========================
 * Page
 * ========================= */
export default function Page() {
    const user = useSelector((state: RootState) => state.user);

    const [flatData, setFlatData] = useState<FlatItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const tree = useMemo(() => buildTree(flatData, 0), [flatData]);

    // ✅ دفعه اول همه بسته
    const [expanded, setExpanded] = useState<Set<number>>(new Set());

    const [selected, setSelected] = useState<TreeNode | null>(null);

    const toggle = (id: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        const allIds = flattenIds(tree);
        setExpanded(new Set(allIds));
    };

    const collapseAll = () => {
        setExpanded(new Set()); // ✅ همه بسته
    };

    useEffect(() => {
        const mahal = user?.Mahal;
        if (!mahal) return;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const res = await CityTree(mahal);

                // axios-like
                const raw = (res as any)?.data ?? res;

                const normalized = normalizeCityTree(raw);

                setFlatData(normalized);
                setSelected(null);
                setExpanded(new Set()); // ✅ با هر بار لود، دوباره همه بسته
            } catch (e: any) {
                setError(e?.message ?? "خطا در دریافت داده");
                setFlatData([]);
                setExpanded(new Set());
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.Mahal]);

    return (
        <div dir="rtl" className="bg-white m-1 py-2 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
            <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-2 p-3">
                {/* <div className="flex items-center justify-between gap-2 flex-wrap">

                    <div className="flex gap-2">
                        <button
                            type="button"
                            className="px-3 py-2 rounded-xl border hover:bg-gray-100 text-sm"
                            onClick={expandAll}
                            disabled={loading || tree.length === 0}
                        >
                            باز کردن همه
                        </button>
                        <button
                            type="button"
                            className="px-3 py-2 rounded-xl border hover:bg-gray-100 text-sm"
                            onClick={collapseAll}
                            disabled={loading || tree.length === 0}
                        >
                            بستن همه
                        </button>
                    </div>
                </div> */}

                {loading && <div className="mt-2 text-sm text-gray-500">در حال دریافت داده‌ها...</div>}
                {error && <div className="mt-2 text-sm text-red-600">❌ {error}</div>}

                <div className="mt-3 flex flex-row-reverse gap-4">
                    {/* جزئیات (سمت چپ) */}
                    <main className="flex-1 border rounded-2xl p-4">
                        <div className="font-semibold mb-3">جزئیات انتخاب</div>

                        {selected ? (
                            <div className="space-y-2 text-sm">
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-24">ID:</span>
                                    <span className="font-medium">{selected.ID}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-24">PID:</span>
                                    <span className="font-medium">{String(selected.PID)}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-24">Name:</span>
                                    <span className="font-medium">{selected.Name}</span>
                                </div>
                                <div className="flex gap-2">
                                    <span className="text-gray-500 w-24">IsHoze:</span>
                                    <span className="font-medium">{selected.IsHoze}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500">
                                هنوز چیزی انتخاب نشده. از Tree سمت راست یک مورد را انتخاب کن.
                            </div>
                        )}
                    </main>

                    {/* Tree (سمت راست) */}
                    <aside className="w-full md:w-[360px] border rounded-2xl p-3 bg-gray-50">
                        {(!loading && tree.length === 0) ? (
                            <div className="text-sm text-gray-500">داده‌ای برای نمایش وجود ندارد.</div>
                        ) : (
                            <Tree
                                nodes={tree} // ✅ همیشه آرایه است
                                expanded={expanded}
                                onToggle={toggle}
                                onSelect={(n) => setSelected(n)}
                                selectedId={selected?.ID ?? null}
                            />
                        )}
                    </aside>
                </div>
            </div>
        </div>
    );
}
