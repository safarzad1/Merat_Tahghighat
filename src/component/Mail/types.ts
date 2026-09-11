export type MailFolder = "inbox" | "archive" | "trash" | "important";

export type MailMessage = {
    id: string;
    subject: string;
    body: string;
    senderName: string;
    senderId: string;
    senderEmail?: string | null;
    createdateTime: string;
    isRead: boolean;
    isNew: boolean;
    isImportant?: boolean;
    isStarred?: boolean;
    dateTimeRead: string | null;
    attachmentsCount: number;
    preview?: string;
    text?: string;
    folder?: "inbox" | "archive" | "trash" | "spam" | "sent";
};
