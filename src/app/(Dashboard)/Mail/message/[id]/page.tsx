// app/Mail/message/[id]/page.tsx
import MessagePageClient from "./MessagePageClient";
import { decryptText } from "@/Lib/cryptoUtil";

type Params = { id: string };

export default async function Page({
    params,
}: {
    params: Params | Promise<Params>;
}) {
    console.log("➡️ Page HIT");

    const p = await params;

    console.log("➡️ params:", p);
    console.log("➡️ encrypted id:", p?.id);

    const encrypted = decodeURIComponent(p.id);
    const plain = decryptText(encrypted);
    const decodedId = String(plain);

    console.log("➡️ decodedId:", decodedId);

    return <MessagePageClient id={decodedId} />;
}