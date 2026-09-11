import type { Metadata } from "next";
import { ScriptProvider } from "../../Utils/providers";
import "../../Styles/globals.css";

export const metadata: Metadata = {
  title: "Stimulsoft Reports",
  description: "Stimulsoft Reports Demo",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <ScriptProvider />
      {children}
    </>

  );
}
