import MessageList from "@/component/Mail/MessageList";
import { mockMessages } from "@/component/Mail/mock";

export default function InboxPage() {
    const messages = mockMessages.filter((m) => m.folder === "inbox");
    return <MessageList title="صندوق ورودی" messages={messages} />;
}
