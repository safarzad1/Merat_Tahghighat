import "@/Styles/globals.css";
import Banner from '@/component/Header/banner'
import Menupage from '@/component/Header/menupage'
import { ConfirmModalProvider } from "@/Utils/ConfirmModalContext";
import { AlertProvider } from "@/component/AlertContext";
import { ToastContainer, toast } from 'react-toastify'; // اصلاح شده
import 'react-toastify/dist/ReactToastify.css';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Banner />
      <Menupage />

      <AlertProvider>
        <ConfirmModalProvider>
          {children}
        </ConfirmModalProvider>
      </AlertProvider>
      <ToastContainer
        position="top-right"
        rtl={true}
        theme="colored"
      />

    </>
  );
}