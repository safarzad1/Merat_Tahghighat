export type MailFolder = "inbox" | "archive" | "trash" | "important";

export type MailMessage = {
    id: string;

    subject: string;
    body: string; // HTML یا متن

    senderName: string;
    senderId: string;
    senderEmail?: string | null;

    createdAt: string;

    isRead: boolean;
    isNew: boolean;

    isImportant?: boolean;
    isStarred?: boolean;

    dateTimeRead: string | null;

    attachmentsCount: number;

    preview?: string;
    text?: string;

    // ✅ فقط پوشه‌های واقعی (important پوشه نیست، یک فیلتره)
    folder?: "inbox" | "archive" | "trash";
};
