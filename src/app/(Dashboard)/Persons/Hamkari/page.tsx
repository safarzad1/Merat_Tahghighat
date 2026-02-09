"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { CityTree } from "@/Lib/ApiServiceUsers";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronDown,
    Folder,
    FolderKey,
    FolderOpen,
    Newspaper,
    HomeIcon,
    CheckCircle,
} from "lucide-react";
import Breadcrumbkhabar from "@/component/Breadcrumb/Breadcrumb";
import FehrestPerson from "./FehrestPerson";

/** =========================
 * Types
 * ========================= */
type FlatItem = {
    ID: number;
    PID: number; // ریشه‌ها PID=0
    Name: string;
    IsHoze: number; // int (0/1)
    CityId: number; // ✅ اینو می‌خوای برای FehrestPerson
};

type TreeNode = FlatItem & { children: TreeNode[] };

type TreeProps = {
    nodes?: TreeNode[];
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

/**
 * خروجی CityTree را به FlatItem استاندارد تبدیل می‌کند.
 * ✅ CityId را هم می‌گیرد (اگر نبود، از ID استفاده می‌کند)
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
            const id =
                x?.ID ?? x?.Id ?? x?.id ?? x?.MahalId ?? x?.NodeId ?? x?.CityTreeId;

            const pid =
                x?.PID ??
                x?.Pid ??
                x?.pid ??
                x?.ParentID ??
                x?.ParentId ??
                x?.parentId ??
                x?.ParentMahalId ??
                0;

            const name =
                x?.Name ??
                x?.name ??
                x?.Title ??
                x?.title ??
                x?.NameMahal ??
                x?.CityName;

            const isHoze =
                x?.IsHoze ?? x?.isHoze ?? x?.ISHOZE ?? x?.Is_Hoze ?? 0;

            // ✅ CityId از API (اگر نبود = همان ID)
            const cityId =
                x?.CityId ??
                x?.CityID ??
                x?.cityId ??
                x?.MahalId ??
                x?.MahalID ??
                id;

            if (id == null || name == null) return null;

            return {
                ID: Number(id),
                PID: pid == null ? 0 : Number(pid),
                Name: String(name).trim(),
                IsHoze: Number(isHoze ?? 0),
                CityId: Number(cityId ?? id),
            } as FlatItem;
        })
        .filter(Boolean) as FlatItem[];
}

function Tree({
    nodes = [],
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
                                    {isOpen ? (
                                        <ChevronDown size={16} />
                                    ) : (
                                        <ChevronLeft size={16} />
                                    )}
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
    const router = useRouter();

    const [flatData, setFlatData] = useState<FlatItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>("");

    const tree = useMemo(() => buildTree(flatData, 0), [flatData]);

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

    useEffect(() => {
        const mahal = user?.Mahal;

        if (!mahal) return;

        (async () => {
            try {
                setLoading(true);
                setError("");

                const res = await CityTree(mahal);
                if (res.status === 401) {
                    router.push("/Login");
                }
                const raw = (res as any)?.data ?? res;
                const normalized = normalizeCityTree(raw);

                setFlatData(normalized);
                setSelected(null);
                setExpanded(new Set());
            } catch (e: any) {
                setError(e?.message ?? "خطا در دریافت داده");
                setFlatData([]);
                setSelected(null);
                setExpanded(new Set());
            } finally {
                setLoading(false);
            }
        })();
    }, [user?.Mahal]);

    // ✅ CityId انتخاب‌شده برای FehrestPerson
    const selectedCityId = selected ? Number(selected.CityId ?? selected.ID) : null;
    // alert(selectedCityId);

    return (
        <>
            <div className="bg-sky-200 mt-1 mx-1 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        {
                            label: "داشبورد",
                            href: "/Dashboard",
                            icon: <HomeIcon className="w-4 h-4" />,
                        },
                        { label: "همکاران", icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />
            </div>

            <div
                dir="rtl"
                className="bg-white m-0 py-0 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl"
            >
                <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-2 p-3">
                    {loading && (
                        <div className="mt-0 text-sm text-gray-500">
                            در حال دریافت داده‌ها...
                        </div>
                    )}
                    {error && <div className="mt-2 text-sm text-red-600">❌ {error}</div>}

                    <div className="mt-0 flex flex-row-reverse gap-4">
                        <main className="bg-sky-50 flex-1 border rounded-2xl px-4 py-0">
                            {selectedCityId ? (
                                <FehrestPerson
                                    mahal={selectedCityId}     // ✅ فقط CityId
                                    key={selectedCityId}       // ✅ با تغییر CityId، دوباره اجرا/ری‌مونت میشه
                                />
                            ) : (
                                <div className="text-sm text-gray-500 p-2">
                                    لطفا محل را انتخاب نمایید
                                </div>
                            )}
                        </main>

                        {/* Tree (سمت راست) */}
                        <aside className="w-full md:w-[360px] border rounded-2xl p-3 bg-gray-50">
                            {!loading && tree.length === 0 ? (
                                <div className="text-sm text-gray-500">
                                    داده‌ای برای نمایش وجود ندارد.
                                </div>
                            ) : (
                                <Tree
                                    nodes={tree}
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
        </>
    );
}
