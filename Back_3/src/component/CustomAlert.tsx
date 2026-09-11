import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/component/Alert/alert-dialog";

// تعریف انواع آلرت
type AlertType = "info" | "warning" | "error" | "success";

interface CustomAlertProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title?: string;
    description?: string;
    type?: AlertType;
    confirmText?: string;
    cancelText?: string;
    showCancel?: boolean;
}

const CustomAlert = ({
    isOpen,
    onClose,
    onConfirm,
    title = "پیام سیستم",
    description = "",
    type = "info",
    confirmText = "تایید",
    cancelText = "انصراف",
    showCancel = true,
}: CustomAlertProps) => {

    // تنظیم رنگ‌ها بر اساس نوع آلرت
    const getTypeStyles = () => {
        switch (type) {
            case "error":
                return {
                    titleColor: "text-red-600",
                    btnBg: "bg-red-600 hover:bg-red-700",
                    icon: "⚠️",
                };
            case "warning":
                return {
                    titleColor: "text-yellow-600",
                    btnBg: "bg-yellow-600 hover:bg-yellow-700",
                    icon: "⚠️",
                };
            case "success":
                return {
                    titleColor: "text-green-600",
                    btnBg: "bg-green-600 hover:bg-green-700",
                    icon: "✅",
                };
            case "info":
            default:
                return {
                    titleColor: "text-blue-600",
                    btnBg: "bg-blue-600 hover:bg-blue-700",
                    icon: "ℹ️",
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className={`flex items-center gap-2 ${styles.titleColor}`}>
                        <span>{styles.icon}</span>
                        {title}
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-right text-gray-700 leading-7">
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    {showCancel && (
                        <AlertDialogCancel onClick={onClose} className="cursor-pointer">
                            {cancelText}
                        </AlertDialogCancel>
                    )}
                    <AlertDialogAction
                        onClick={() => {
                            if (onConfirm) onConfirm();
                            onClose();
                        }}
                        className={`cursor-pointer ${styles.btnBg}`}
                    >
                        {confirmText}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default CustomAlert;