"use client";

import dynamic from "next/dynamic";

const ParvandehPageNoSSR = dynamic(() => import("./ParvandehPage"), {
  ssr: false,
});

export default function Page() {
  return <ParvandehPageNoSSR />;
}
