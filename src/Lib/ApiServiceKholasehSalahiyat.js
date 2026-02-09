export async function InsertAshkhasKholasehSalahiyat(shomarehParvandeh, codeEntekhabat
    , tagSalahiyat, kholasehMatlab, createUserId) {
    console.log(id, shomarehParvandeh, codeEntekhabat
        , tagSalahiyat, kholasehMatlab, createUserId);
    try {
        const res = await fetch("/Api/Davtalabs/KholasehSalahiyat/InsertKholasehSalahiyat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",

            },
            body: JSON.stringify({
                shomarehParvandeh, codeEntekhabat
                , tagSalahiyat, kholasehMatlab, createUserId
            }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}
// -----------------------------------------------------------------
export async function GetAshkhasKholasehSalahiyat(shomarehParvandeh, codeEntekhabat) {
    try {
        const res = await fetch("/Api/Davtalabs/KholasehSalahiyat/GetKholasehSalahiyat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",

            },
            body: JSON.stringify({
                shomarehParvandeh, codeEntekhabat
            }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}
// -----------------------------------------------------------------
export async function GetAshkhasKholasehSalahiyatByTag(
    shomarehParvandeh, codeEntekhabat, tagSalahiyat) {
    try {
        const res = await fetch("/Api/Davtalabs/KholasehSalahiyat/GetKholasehSalahiyat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",

            },
            body: JSON.stringify({
                shomarehParvandeh, codeEntekhabat, tagSalahiyat
            }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}
// -----------------------------------------------------------------








