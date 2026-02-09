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

// -----------------------------------------------------------------
export async function InsertMessageMail(OnvanPayam, Payam, isSend, userId) {
    try {
        const res = await fetch("/Api/Mail/InsertMessage", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ OnvanPayam, Payam, isSend, userId }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}

// -----------------------------------------------------------------
export async function InsertMessageUserMail(messageId, senderUserId, reciverUserId, userId) {
    try {
        const res = await fetch("/Api/Mail/InsertMessageUser", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messageId, senderUserId, reciverUserId, userId }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}

// -----------------------------------------------------------------
export async function InsertMessageFilesMail(messageId, fileName, captionName, mMType, userId) {
    try {
        const res = await fetch("/Api/Mail/InsertMessageFiles", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ messageId, fileName, captionName, mMType, userId }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}

// -----------------------------------------------------------------
export async function GetUsersFromGroup(idGroup) {
    try {
        const res = await fetch("/Api/Mail/GetUsersGroupMail", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ idGroup }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}


// -----------------------------------------------------------------
export async function MessageInbox(userId) {
    try {
        const res = await fetch("/Api/Mail/GetMessageInbox", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ userId }),
        });

        const data = await res.json();
        return data;
    } catch (error) {
        console.error("خطا در انجام فرآیند:", error);
        throw error;
    }
}