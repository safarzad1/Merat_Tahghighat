import MessageViewer from "@/component/Mail/MessageViewer";
import { mockMessages } from "@/component/Mail/mock";

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const msg = mockMessages.find((m) => m.id === id);

    if (!msg) {
        return (
            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
                پیام پیدا نشد.
            </div>
        );
    }

    return <MessageViewer msg={msg} />;
}
