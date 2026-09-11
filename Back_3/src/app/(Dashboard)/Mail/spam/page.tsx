import MessageList from "@/component/Mail/MessageList";
import { mockMessages } from "@/component/Mail/mock";

export default function SpamPage() {
    const messages = mockMessages.filter((m) => m.folder === "spam");
    return <MessageList title="هرزنامه" messages={messages} />;
}
