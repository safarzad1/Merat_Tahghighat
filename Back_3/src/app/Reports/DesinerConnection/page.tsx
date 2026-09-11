"use client";

import dynamic from "next/dynamic";

const DesignerComponent = dynamic(() => import("@/component/Designer/DesignerPage"), { ssr: false });

export default function Page() {
    return <DesignerComponent />;
}
