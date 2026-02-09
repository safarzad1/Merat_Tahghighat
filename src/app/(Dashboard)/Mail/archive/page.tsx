import MessageList from "@/component/Mail/MessageList";
import { mockMessages } from "@/component/Mail/mock";

export default function ArchivePage() {
    const messages = mockMessages.filter((m) => m.folder === "archive");
    return <MessageList title="آرشیو" messages={messages} />;
}
