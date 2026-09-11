"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { EntekhabatCitys } from "@/Lib/ApiServiceEntekhabat";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    ChevronDown,
    Folder,
    FolderKey,
    FolderOpen,
    Newspaper,
    HomeIcon,
} from "lucide-react";
import Breadcrumbkhabar from "@/component/Breadcrumb/Breadcrumb";

import FehrestUsersClient from "./FehrestDavtalab";

type FlatItem = {
    ID: number;
    PID: number;
    Name: string;
    Value: number; // ✅ کد حوزه
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
            const id = x?.ID ?? x?.Id ?? x?.id;
            const pid = x?.PID ?? x?.Pid ?? x?.pid ?? 0;
            const name = x?.Name ?? x?.name ?? x?.Title ?? x?.title;
            const value = x?.Value ?? x?.value ?? 0;

            if (id == null || name == null) return null;

            return {
                ID: Number(id),
                PID: Number(pid ?? 0),
                Name: String(name).trim(),
                Value: Number(value ?? 0),
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

                const isRoot = node.PID === 0;
                const IconComp = hasChildren ? FolderOpen : isRoot ? FolderKey : Folder;

                const iconClass = hasChildren
                    ? "text-blue-700"
                    : isRoot
                        ? "text-red-700"
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
                            title={`Value: ${node.Value}`}
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

export default function Page() {
    const user = useSelector((state: RootState) => state.user);
    const router = useRouter();

    const [flatData, setFlatData] = useState<FlatItem[]>([]);
    const [loadingTree, setLoadingTree] = useState(false);
    const [errorTree, setErrorTree] = useState<string>("");
    const tree = useMemo(() => buildTree(flatData, 0), [flatData]);
    const [expanded, setExpanded] = useState<Set<number>>(new Set());
    const [selected, setSelected] = useState<TreeNode | null>(null);
    const [reloadTick, setReloadTick] = useState(0);


    const toggle = (id: number) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };


    useEffect(() => {
        const mahal = Number(user?.Mahal ?? 0);
        if (!mahal) return;

        (async () => {
            try {
                setLoadingTree(true);
                setErrorTree("");

                const res = await EntekhabatCitys(31210, mahal);
                if ((res as any)?.status === 401) {
                    router.push("/Login");
                    return;
                }

                const raw = (res as any)?.data ?? res;
                const normalized = normalizeCityTree(raw);

                setFlatData(normalized);
                setSelected(null);
                setExpanded(new Set());
            } catch (e: any) {
                setErrorTree(e?.message ?? "خطا در دریافت داده");
                setFlatData([]);
                setSelected(null);
                setExpanded(new Set());
            } finally {
                setLoadingTree(false);
            }
        })();
    }, [user?.Mahal, router]);

    const mahal = Number(user?.Mahal ?? 0);
    const CodeEntekhabat = 31210;
    const CodeHozeh = selected ? Number(selected.Value ?? 0) : 0;

    return (
        <>
            <div className="bg-sky-200 mt-1 mx-1 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        { label: "داشبورد", href: "/MainPage", icon: <HomeIcon className="w-4 h-4" /> },
                        { label: "فهرست پیش ثبت نام", icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />
            </div>

            <div dir="rtl" className="bg-white m-1 py-0 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
                <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-2 p-3">
                    {loadingTree && <div className="mt-0 text-sm text-gray-500">در حال دریافت داده‌ها...</div>}
                    {errorTree && <div className="mt-2 text-sm text-red-600">❌ {errorTree}</div>}

                    <div className="mt-1 flex flex-row-reverse gap-4">
                        <main className="flex-1 border rounded-2xl px-4 py-3">
                            <main className="flex-1 border rounded-2xl px-4 py-3">
                                <FehrestUsersClient
                                    key={`${mahal}-${CodeEntekhabat}-${selected?.ID ?? 0}-${reloadTick}`} // ✅ هر کلیک => ریمونت
                                    mahal={mahal}
                                    CodeEntekhabat={CodeEntekhabat}
                                    CodeHozeh={CodeHozeh}
                                    Natije={0}
                                    value={0}
                                    reloadTick={reloadTick}
                                />
                            </main>

                        </main>

                        <aside className="w-full md:w-[280px] border rounded-2xl p-3 bg-gray-50">
                            {!loadingTree && tree.length === 0 ? (
                                <div className="text-sm text-gray-500">داده‌ای برای نمایش وجود ندارد.</div>
                            ) : (
                                <Tree
                                    nodes={tree}
                                    expanded={expanded}
                                    onToggle={toggle}
                                    onSelect={(n) => {
                                        setSelected(n);
                                        setReloadTick((t) => t + 1); // ✅ حتی اگر CodeHozeh=0 باشد هم لیست ریلود می‌شود
                                    }}

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
