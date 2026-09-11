async function postJson(url, body = {}) {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data?.error || data?.message || "خطا در ارتباط با سرور");
    }
    return data;
}

export function GetKhabarList(userId, page, sizepage, indexsort, ascdesc, search) {
    return postJson("/Api/Akhbar/GetKhabarList", {
        userId, page, sizepage, indexsort, ascdesc, search,
    });
}

export function GetKhabar(shomareKhabar, userId) {
    return postJson("/Api/Akhbar/GetKhabar", { shomareKhabar, userId });
}

export function GetAkhbarLookups(userId) {
    return postJson("/Api/Akhbar/GetLookups", { userId });
}

export function InsertKhabar(payload) {
    return postJson("/Api/Akhbar/InsertKhabar", payload);
}

export function UpdateKhabar(payload) {
    return postJson("/Api/Akhbar/UpdateKhabar", payload);
}

export function DeleteKhabar(shomareKhabar, userId) {
    return postJson("/Api/Akhbar/DeleteKhabar", { shomareKhabar, userId });
}

export function InsertNoghteKhabarkhiz(onvan, createUserId) {
    return postJson("/Api/Akhbar/InsertNoghteKhabarkhiz", { onvan, createUserId });
}

export function SearchAkhbarAshkhas(shomareKhabar, userId, search, page = 1, sizePage = 10) {
    return postJson("/Api/Akhbar/SearchAshkhas", { shomareKhabar, userId, search, page, sizePage });
}

export function GetKhabarAshkhas(shomareKhabar, userId) {
    return postJson("/Api/Akhbar/GetKhabarAshkhas", { shomareKhabar, userId });
}

export function InsertKhabarShakhs(shomareKhabar, shomarehParvandeh, createUserId) {
    return postJson("/Api/Akhbar/InsertKhabarShakhs", { shomareKhabar, shomarehParvandeh, createUserId });
}

export function DeleteKhabarShakhs(khabarShakhsId, userId) {
    return postJson("/Api/Akhbar/DeleteKhabarShakhs", { khabarShakhsId, userId });
}

export async function UploadKhabarPeyvast(shomareKhabar, userId, file) {
    const form = new FormData();
    form.append("shomareKhabar", String(shomareKhabar));
    form.append("userId", String(userId));
    form.append("file", file);

    const res = await fetch("/Api/Akhbar/UploadPeyvast", {
        method: "POST",
        body: form,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error || data?.message || "خطا در بارگذاری پیوست");
    return data;
}

export function GetKhabarPeyvastha(shomareKhabar, userId) {
    return postJson("/Api/Akhbar/GetPeyvastha", { shomareKhabar, userId });
}

export function DeleteKhabarPeyvast(khabarPeyvastId, userId) {
    return postJson("/Api/Akhbar/DeletePeyvast", { khabarPeyvastId, userId });
}

export function GetKhabarPeyvastUrl(shomareKhabar, userId, fileName) {
    const q = new URLSearchParams({
        shomareKhabar: String(shomareKhabar),
        userId: String(userId),
        fileName: String(fileName),
    });
    return `/Api/Akhbar/GetPeyvastFile?${q.toString()}`;
}
