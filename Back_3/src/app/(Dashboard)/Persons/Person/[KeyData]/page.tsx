"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useParams } from "next/navigation";
import { decryptText } from "@/Lib/cryptoUtil";
import Breadcrumbkhabar from "@/component/Breadcrumb/Breadcrumb";
import { DockIcon, HomeIcon, Newspaper, Pencil } from "lucide-react";
import { GetPersonByUserID } from '@/Lib/ApiServiseHamkari'
import Image from "next/image";

const page = () => {

    type UserForm = {
        PersonId: number;
        FirstName: string;
        LastName: string;
        CodeMelli: string;
        FatherName: string;
        TelHamrah: string;
        TarikhTavalod: string;
        ShomareShenasnameh: string;
        SerialShenasnameh: string;
        MahalTavalod: string;
        MahalSodor: string;
        Jensiyat: number;
        Taahol: number;
        Jensiyat_NameFarsi: string;
        Taahol_NameFarsi: string;
        CreateUserName: string;
    };

    const [form, setForm] = useState<UserForm>({
        PersonId: 0,
        FirstName: "",
        LastName: "",
        CodeMelli: "",
        FatherName: "",
        TelHamrah: "",
        TarikhTavalod: "",
        ShomareShenasnameh: "",
        SerialShenasnameh: "",
        MahalTavalod: "",
        MahalSodor: "",
        Jensiyat: 0,
        Taahol: 0,
        Jensiyat_NameFarsi: "",
        Taahol_NameFarsi: "",
        CreateUserName: "",
    });

    const [data, setData] = useState<any[]>([]);
    const [imgSrc, setImgSrc] = useState("/images/person.png");

    const params = useParams();
    const router = useRouter();
    const user = useSelector((state: RootState) => state.user);

    const loadData = async (personid: number) => {
        const result = await GetPersonByUserID(personid, user.UserId);
        console.log(result);
        if (result.status === 401) {
            router.push("/Login");
        }
        setForm({
            PersonId: result.data[0].PersonId,
            CodeMelli: result.data[0].CodeMelli,
            FirstName: result.data[0].FirstName,
            LastName: result.data[0].LastName,
            FatherName: result.data[0].FatherName,
            TelHamrah: result.data[0].TelHamrah,
            TarikhTavalod: result.data[0].TarikhTavalod,
            ShomareShenasnameh: result.data[0].ShomareShenasnameh,
            SerialShenasnameh: result.data[0].SerialShenasnameh,
            MahalTavalod: result.data[0].MahalTavalod,
            MahalSodor: result.data[0].MahalSodor,
            Jensiyat: result.data[0].Jensiyat,
            Taahol: result.data[0].Taahol,
            Jensiyat_NameFarsi: result.data[0].Jensiyat_NameFarsi,
            Taahol_NameFarsi: result.data[0].Taahol_NameFarsi,
            CreateUserName: result.data[0].CreateUserName,
        })

    }

    useEffect(() => {
        const keyData = params?.KeyData as string;
        if (keyData) {
            try {
                const personId = Number(decryptText(decodeURIComponent(keyData)));
                loadData(personId);
            } catch (err) {
                console.error("❌ خطا در رمزگشایی شناسه:", err);
            }
        }
    }, [params]);

    return (
        <>
            <div className="bg-sky-200 mt-1 mx-1 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        { label: 'داشبورد', href: '/Dashboard', icon: <HomeIcon className="w-4 h-4" /> },
                        { label: 'مشخصات فردی', href: '/Dashboard', icon: <DockIcon className="w-4 h-4" /> },
                        // { label: data, icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />
            </div>

            <div className="bg-gray-100 m-1 py-2 px-2 flex justify-center items-start">
                <div className="bg-white w-[370mm] h-[297mm] shadow-lg rounded-lg p-5">
                    <div className="relative p-0.5 border-4 border-gray-600 rounded-md">

                        <button
                            className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-blue-600 text-white 
                   flex items-center justify-center shadow-md hover:bg-blue-700 transition"
                        >
                            <Pencil
                                // onClick={() =>
                                //     // setModalPerson(true)
                                // }
                                size={15} className="cursor-pointer" />
                        </button>
                        {/* <div className="p-0.5 border-4 border-gray-600 rounded-md"> */}
                        {/* <div className="p-1 border-2 border-gray-400 rounded-sm"> */}

                        <div className="bg-white">
                            <h2 className="text-lg mb-2 mr-10 titr text-purple-500">مشخصــات فــردی</h2>


                            <div className="grid grid-cols-5  border-gray-500">

                                <div className="border-l border-r border-t border-gray-400 px-2 py-1 text-[16px]">نام:
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.FirstName}
                                    </span>
                                </div>
                                <div className="border-l border-r border-t border-gray-400 px-2 py-1 text-[16px]">نام خانوادگی:
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.LastName}
                                    </span>
                                </div>
                                <div className="border-l border-r border-t border-gray-400 px-2 py-1">نام پدر:
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.FatherName}
                                    </span>
                                </div>
                                <div className="border-l border-r border-t border-gray-400 px-2 py-1">شماره ملی :
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.CodeMelli}
                                    </span>
                                </div>
                                <div className="flex justify-center -mt-8">
                                    <div className="w-[84px] h-[84px] rounded-full bg-white border border-gray-200 shadow-md flex items-center justify-center">
                                        <Image
                                            src={imgSrc}
                                            alt="پروفایل"
                                            width={84}
                                            height={84}
                                            className="rounded-full object-cover"
                                            unoptimized
                                            onError={() => setImgSrc("/images/person.png")}
                                        />
                                    </div>
                                </div>

                            </div>
                            <div className="grid grid-cols-5 border-gray-500">
                                <div className="border-b border-l border-r border-t border-gray-400 px-2 py-1">شماره شناسنامه:
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.ShomareShenasnameh}
                                    </span>
                                </div>
                                <div className="border-b border-l border-r border-t border-gray-400 px-2 py-1 text-[16px]">تاریخ تولد :
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.TarikhTavalod}
                                    </span>
                                </div>
                                <div className="border-b border-l border-r border-t border-gray-400 px-2 py-1 text-[16px]"> محل تولد :
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.MahalTavalod}
                                    </span>
                                </div>
                                <div className="border-b border-l border-r border-t border-gray-400 px-2 py-1 text-[16px]"> محل صدور :
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.MahalSodor}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-5 border-gray-500">

                                <div className="border-b border-l border-r border-gray-400 px-2 py-1 text-[16px]">
                                    <span className="whitespace-nowrap"> وضعیت جنسیت :</span>

                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center mr-3">
                                            <input type="checkbox" className="ml-1" />
                                            مرد
                                        </label>

                                        <label className="flex items-center">
                                            <input type="checkbox" className="ml-1" />
                                            زن
                                        </label>

                                    </div>
                                </div>
                                <div className="border-b border-l border-r border-gray-400 px-2 py-1 text-[16px]">
                                    <span className="whitespace-nowrap"> وضعیت تأهل :</span>

                                    <div className="flex items-center gap-3">
                                        <label className="flex items-center mr-3 text-[14px]">
                                            <input type="checkbox" className="ml-1" readOnly />
                                            مجرد
                                        </label>

                                        <label className="flex items-center text-[14px]">
                                            <input type="checkbox" className="ml-1" readOnly />
                                            متاهل
                                        </label>
                                        <label className="flex items-center text-[14px]">
                                            <input type="checkbox" className="ml-1" readOnly />
                                            فوت شده
                                        </label>
                                    </div>
                                </div>
                                <div className="border-b border-l border-r border-gray-400 px-2 py-1 text-[16px]">
                                    دین و مذهب :
                                    <span className="text-blue-500 text-[18px] px-1">
                                        اسلام - شیعه
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-4 border-l border-r border-t border-gray-500">
                                <div className="border-b border-l border-r border-gray-400 px-2 py-1">آخرین مدرک تحصیلی:
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {/* {form.ShomareShenasnameh} */}
                                    </span>
                                </div>
                                <div className="border-b border-l border-r border-gray-400 px-2 py-1 text-[16px]">رشته تحصیلی :
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {/* {form.TarikhTavalod} */}
                                    </span>
                                </div>
                                <div className="border-b border-l border-r border-gray-400 px-2 py-1 text-[16px]"> گرایش تحصیلی  :
                                    <span className="text-blue-500 text-[18px] px-1">
                                        {form.MahalTavalod}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>
                    {/* </div> */}
                </div>
                {/* </div> */}
            </div >


        </>
    );
}

export default page;
