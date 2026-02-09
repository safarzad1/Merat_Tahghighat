import MessageList from "@/component/Mail/MessageList";
import { mockMessages } from "@/component/Mail/mock";

export default function TrashPage() {
    const messages = mockMessages.filter((m) => m.folder === "trash");
    return <MessageList title="زباله‌دان" messages={messages} />;
}
