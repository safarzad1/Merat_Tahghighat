import MailShell from "@/component/Mail/MailShell";

export default function MailLayout({ children }: { children: React.ReactNode }) {
    return <MailShell>{children}</MailShell>;
}
