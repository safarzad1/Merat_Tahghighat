"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import CustomAlert from "./CustomAlert"; // کامپوننتی که قبلا ساختیم

type AlertType = "info" | "warning" | "error" | "success";

interface AlertOptions {
    title: string;
    description: string;
    type?: AlertType;
    onConfirm?: () => void;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
}

interface AlertContextType {
    showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const AlertProvider = ({ children }: { children: ReactNode }) => {
    const [alertState, setAlertState] = useState<{
        isOpen: boolean;
        type: AlertType;
        title: string;
        description: string;
        onConfirm?: () => void;
        confirmText: string;
        cancelText: string;
        showCancel: boolean;
    }>({
        isOpen: false,
        type: "info",
        title: "",
        description: "",
        confirmText: "تایید",
        cancelText: "انصراف",
        showCancel: false,
    });

    const showAlert = ({
        title,
        description,
        type = "info",
        onConfirm,
        confirmText = "تایید",
        cancelText = "انصراف",
        showCancel = false,
    }: AlertOptions) => {
        setAlertState({
            isOpen: true,
            type,
            title,
            description,
            onConfirm,
            confirmText,
            cancelText,
            showCancel,
        });
    };

    const handleClose = () => {
        setAlertState((prev) => ({ ...prev, isOpen: false }));
    };

    return (
        <AlertContext.Provider value={{ showAlert }}>
            {children}

            {/* کامپوننت آلرت فقط یک بار اینجا رندر می‌شود */}
            <CustomAlert
                isOpen={alertState.isOpen}
                onClose={handleClose}
                onConfirm={alertState.onConfirm}
                title={alertState.title}
                description={alertState.description}
                type={alertState.type}
                confirmText={alertState.confirmText}
                cancelText={alertState.cancelText}
                showCancel={alertState.showCancel}
            />
        </AlertContext.Provider>
    );
};

// هوک برای استفاده آسان در کامپوننت‌ها
export const useAlert = () => {
    const context = useContext(AlertContext);
    if (!context) {
        throw new Error("useAlert must be used within an AlertProvider");
    }
    return context;
};