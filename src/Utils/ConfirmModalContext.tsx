"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import ConfirmModal from "@/component/ConfirmModal/ConfirmYesNo";

type ConfirmAction = () => void;

interface ConfirmModalContextType {
  showConfirm: (
    message: string,
    action: ConfirmAction,
    header?: string,
    type?: "success" | "warning" | "error"
  ) => void;
}

const ConfirmModalContext = createContext<ConfirmModalContextType | undefined>(undefined);

export const useConfirm = () => {
  const context = useContext(ConfirmModalContext);
  if (!context) throw new Error("useConfirm must be used within ConfirmModalProvider");
  return context;
};

export const ConfirmModalProvider = ({ children }: { children: ReactNode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [header, setHeader] = useState<string | undefined>(undefined);
  const [type, setType] = useState<"success" | "warning" | "error">("success");
  const [onConfirmAction, setOnConfirmAction] = useState<ConfirmAction | null>(null);

  const showConfirm = (
    msg: string,
    action: ConfirmAction,
    hdr?: string,
    t?: "success" | "warning" | "error"
  ) => {
    setMessage(msg);
    setOnConfirmAction(() => action);
    setHeader(hdr);
    setType(t || "success");
    setIsOpen(true);
  };

  return (
    <ConfirmModalContext.Provider value={{ showConfirm }}>
      {children}
      <ConfirmModal
        isOpen={isOpen}
        message={message}
        header={header}
        type={type}
        onConfirm={() => {
          if (onConfirmAction) onConfirmAction();
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </ConfirmModalContext.Provider>
  );
};
