import Breadcrumbkhabar from "@/component/Breadcrumb/Breadcrumb";
import { HomeIcon, Newspaper } from "lucide-react";

const page = () => {
    return (
        <>
            <div className="bg-green-300 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        { label: "داشبورد", href: "/Dashboard", icon: <HomeIcon className="w-4 h-4" /> },
                        { label: "مدیریت کاربران", icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />
            </div>
            <div className="bg-white m-1 py-2 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
                <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-2">

                </div>
            </div>

        </>
    );
}

export default page;