export type MailFolder =
    | "inbox"
    | "sent"
    | "drafts"
    | "archive"
    | "spam"
    | "trash"
    | "starred"
    | "important";

export type MailMessage = {
    id: string;
    folder: MailFolder;

    فرستنده: string;
    ایمیل_فرستنده?: string;

    گیرنده?: string;
    موضوع: string;
    پیشنمایش: string;
    متن: string;

    خوانده_شده: boolean;
    ستاره_دار: boolean;
    مهم: boolean;
    دارای_پیوست: boolean;

    تاریخ: string; // نمایش ساده
};
