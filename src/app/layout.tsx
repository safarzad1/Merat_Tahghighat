import "@/Styles/globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "مرآت",
  description: "سامانه مرآت",
  icons: {
    icon: "/images/LogoMerat.png",
    shortcut: "/images/LogoMerat.png",
    apple: "/images/LogoMerat.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}