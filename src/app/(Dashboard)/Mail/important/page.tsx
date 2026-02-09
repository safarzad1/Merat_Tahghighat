import MessageList from "@/component/Mail/MessageList";
import { mockMessages } from "@/component/Mail/mock";

export default function ImportantPage() {
    const messages = mockMessages.filter((m) => m.مهم);
    return <MessageList title="مهم" messages={messages} />;
}
