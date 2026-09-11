import MessageList from "@/component/Mail/MessageList";
import { mockMessages } from "@/component/Mail/mock";

export default function SentPage() {
    const messages = mockMessages.filter((m) => m.folder === "sent");
    return <MessageList title="ارسال‌شده" messages={messages} />;
}
