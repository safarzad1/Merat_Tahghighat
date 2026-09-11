"use client";

import { useState } from "react";
import Breadcrumbkhabar from '@/component/Breadcrumb/Breadcrumb'
import { Home, Newspaper } from "lucide-react";

const page = () => {
    const [Tozihat, setTozihat] = useState('');
    return (
        <div>
            <div className="bg-sky-200 mt-1 mx-1 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        { label: "داشبورد", href: "/Dashboard", icon: <Home className="w-4 h-4" /> },
                        { label: "مدیریت اخبار", icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />

            </div>
        </div>
    );
}

export default page;