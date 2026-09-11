
"use client";

import { useEffect, useState } from "react";
import Breadcrumbkhabar from "@/component/Breadcrumb/Breadcrumb";
import { HomeIcon, Newspaper, User2Icon } from "lucide-react";
import { ReportTahghighat } from '@/Lib/ApiServiceReport'
import DynamicTable from "@/component/DataTable/CustomTable1";
import { useRouter } from "next/navigation";

const page = () => {

    const router = useRouter();
    const [data, setData] = useState<any[]>([]);



    const loadData = async () => {
        const result = await ReportTahghighat();
        if (result.status == 200) {
            setData(result.data);
        }
        else if (result.status == 401) {
            router.push("Login");
        }
    }


    useEffect(() => {
        loadData()

    }, []);



    return (
        <>

            <div className="bg-sky-200 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        { label: "داشبورد", href: "/MainPage", icon: <HomeIcon className="w-4 h-4" /> },
                        { label: "مدیریت تحقیقات", href: "/TahghighatManage", icon: <Newspaper className="w-4 h-4" /> },
                        { label: "گزارش مدیریتی", icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />
            </div>


            <div className="bg-white m-1 py-2 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
                <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-2">

                    <div className="m-5">
                        <DynamicTable
                            title="گزارش تحقیقات"
                            columns={[
                                { title: "نام استان", field: "Name", width: "100px" },
                                { title: "تعداد کل ", field: "CountKolErja", width: "100px" },
                                { title: "ارسال به ستاد", field: "CountErsalBeSetad", width: "100px" },
                                { title: "کارتابل رئیس دفتر", field: "Kartabl_RaisDafter", width: "120px" },
                                { title: "برگشت رئیس دفتر", field: "Kartabl_RaisDafter_Bargast", width: "150px" },
                                { title: "کارتایل شورای تحقیق", field: "Kartabl_ShorayeTahghigh", width: "200px" },
                                { title: "تایید شورای تحقیق", field: "Kartabl_ShorayeTahghigh_Taid", width: "100px" },
                                { title: "برگشت شورای تحقیق", field: "Kartabl_ShorayeTahghigh_Bargash", width: "100px" },
                                { title: " کارتابل کارشناس", field: "Kartabl_Kartabl_Karshenas", width: "100px" },
                                { title: "عدم نیاز به تحقیق ", field: "Kartabl_AdamEmkan", width: "100px" },

                            ]}
                            data={data}
                            totalRecord={4}
                            page={1}
                            recordsPerPage={10}
                            search={""}
                            // onPageChange={(newPage: number) => setPage(newPage)}

                            // onSortChange={handleSortChange}
                            rowClassName={(_row: any, idx: number) =>
                                `${idx % 2 === 0 ? "bg-white" : "bg-gray-100"} hover:bg-gray-200`
                            }
                            rowKeyField="ShomarehParvandeh"
                            onRowMouseLeave={() => { }}


                        />

                    </div>
                </div>
            </div>





        </>
    );
}

export default page;