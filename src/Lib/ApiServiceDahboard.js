// -----------------------------------------------------------------
export async function TahghighatAmar(mahal) {
    console.log(mahal);
    try {
        const res = await fetch("/Api/Dashoard/TahghighatAmar", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",

            },
            body: JSON.stringify({ mahal }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}

// -----------------------------------------------------------------

// -----------------------------------------------------------------
export async function AkhbarDashboard(userId) {
    try {
        const res = await fetch("/Api/Dashoard/AkhbarDashboard", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        return await res.json();
    } catch (error) {
        console.error("خطا در دریافت داشبورد اخبار:", error);
        throw error;
    }
}

// -----------------------------------------------------------------
export async function MainDashboardOverview(userId) {
    try {
        const res = await fetch("/Api/Dashoard/MainOverview", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId }),
        });
        return await res.json();
    } catch (error) {
        console.error("خطا در دریافت نمای کلی داشبورد:", error);
        throw error;
    }
}
