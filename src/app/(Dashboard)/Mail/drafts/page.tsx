import MessageList from "@/component/Mail/MessageList";
import { mockMessages } from "@/component/Mail/mock";

export default function DraftsPage() {
    const messages = mockMessages.filter((m) => m.folder === "drafts");
    return <MessageList title="پیش‌نویس‌ها" messages={messages} />;
}
