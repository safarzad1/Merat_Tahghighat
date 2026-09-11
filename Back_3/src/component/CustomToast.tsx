import React from "react";
import { toast } from "react-toastify";
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

interface CustomToastProps {
    message: string;
    title?: string;
    type: "success" | "error" | "warning" | "info";
    closeToast: () => void;
}

const CustomToastBody: React.FC<CustomToastProps> = ({ message, title, type, closeToast }) => {
    let Icon = Info;
    let iconColor = "text-blue-500";
    let borderColor = "border-blue-500";

    if (type === "success") {
        Icon = CheckCircle;
        iconColor = "text-green-500";
        borderColor = "border-green-500";
    } else if (type === "error") {
        Icon = AlertCircle;
        iconColor = "text-red-500";
        borderColor = "border-red-500";
    } else if (type === "warning") {
        Icon = AlertTriangle;
        iconColor = "text-orange-500";
        borderColor = "border-orange-500";
    }

    return (
        <div className={`flex items-start gap-3 bg-white border-r-4 ${borderColor} shadow-lg rounded-lg p-4 min-w-[300px] relative`}>
            <div className={`mt-0.5 ${iconColor}`}>
                <Icon size={20} />
            </div>
            <div className="flex-1">
                {title && <h4 className="font-bold text-sm text-gray-800 mb-1">{title}</h4>}
                <p className="text-sm text-gray-600 leading-relaxed shabnam">{message}</p>
            </div>
            <button
                onClick={closeToast}
                className="text-gray-400 hover:text-gray-600 transition"
                type="button"
            >
                <X size={16} />
            </button>
        </div>
    );
};

export const showToast = {
    success: (message: string, title = "موفقیت") => {
        return toast.success(
            (props) => <CustomToastBody message={message} title={title} type="success" {...props} />,
            {
                icon: false,
                className: "!bg-transparent !p-0 !shadow-none !border-none !rounded-none", // حذف استایل‌های پیش‌فرض توست
            }
        );
    },
    error: (message: string, title = "خطا") => {
        return toast.error(
            (props) => <CustomToastBody message={message} title={title} type="error" {...props} />,
            {
                icon: false,
                className: "!bg-transparent !p-0 !shadow-none !border-none !rounded-none",
            }
        );
    },
    warning: (message: string, title = "هشدار") => {
        return toast.warning(
            (props) => <CustomToastBody message={message} title={title} type="warning" {...props} />,
            {
                icon: false,
                className: "!bg-transparent !p-0 !shadow-none !border-none !rounded-none", // حذف استایل‌های پیش‌فرض توست
            }
        );
    },
    info: (message: string, title = "اطلاعات") => {
        return toast.info(
            (props) => <CustomToastBody message={message} title={title} type="info" {...props} />,
            {
                icon: false,
                className: "!bg-transparent !p-0 !shadow-none !border-none !rounded-none", // حذف استایل‌های پیش‌فرض توست
            }
        );
    },
};