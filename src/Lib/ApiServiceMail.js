// -----------------------------------------------------------------
export async function MailGroup(mahal, userId) {
    try {
        const res = await fetch("/Api/Mail/GetMailGroup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ mahal, userId }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}