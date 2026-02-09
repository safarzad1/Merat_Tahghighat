"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { decryptText } from "@/Lib/cryptoUtil";
import Breadcrumbkhabar from '@/component/Breadcrumb/Breadcrumb'
import { Home, Newspaper, CardSimIcon, PlusCircle, Check, CheckCircle, Download } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import DescriptionWithModal from '../../Componnet/DescriptionWithModal';
import ErjaHozeh from '../../Componnet/ErjaHozeh'
import ModalEjraBeMohaghegh from '../../Componnet/EjraBeMohaghegh'
import ErjaMohaghegh from '../../Componnet/ErjaMohaghegh'
import { useConfirm } from "@/Utils/ConfirmModalContext";
import InputUserDropdown from '@/component/Objects/DropDownCitys'
import PersianDateInput from '@/component/Objects/InputPersianDatePicker'
import { useRouter } from "next/navigation";
import { ErjaBeMohaghegh } from '@/Lib/ApiService';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetTahghighByID } from '@/Lib/ApiService'
import { GetCityFare, Update_ErjaParvandeh, GetJambandiForHozeh } from "@/Lib/ApiService";
import RichTextEditor from '@/component/Tiptap'
import { GetFileNamePic } from '@/Lib/ApiServiceNameha'

export default function ParvandehPage() {

    const { showConfirm } = useConfirm();
    const [erjaId, setErjaId] = useState(0);
    const [erjaParentId, setErjaParentId] = useState(0);
    const [CityMarkaz, setCityMarkaz] = useState<number | null>(null);
    const [CodeMohaghegh, setCodeMohaghegh] = useState<number | null>(null);
    const [tarikh, settarikh] = useState<string | null>(null);
    const [ModalOpenErsalParvandeh, setModalOpenErsalParvandeh] = useState(false);
    const [Mahal, SetMahal] = useState(0);
    const [UserId, SetUserId] = useState(0);

    // const [errorTozihat, seterrorTozihat] = useState(false);
    const [tozihat, setTozihat] = useState("");
    const [ModalOpenErjaBeHozeh, setModalOpenErjaBeHozeh] = useState(false);
    const [ModalOpenErjaBeMohaghegh, setModalOpenErjaBeMohaghegh] = useState(false);

    const [isOpen1, setIsOpen1] = useState(false);
    const [isOpen2, setIsOpen2] = useState(false);
    const router = useRouter();
    const params = useParams();
    const [JambandiForHozeh, setJambandiForHozeh] = useState<string>("");

    const [onvanparvandeh, setonvanparvandeh] = useState<string>("");
    const [data, setData] = useState<any[]>([]);
    const [refreshKeyErjaShahrestan, setrefreshKeyErjaShahrestan] = useState(0);

    const [refreshKeyErjaMohaghegh, setrefreshKeyErjaMohaghegh] = useState(0);
    const [countShahr, setCountShahr] = useState(0);

    const [errorMohaghegh, setErrorMohaghegh] = useState<boolean>(false);
    const [errorTarikh, seterrorTarikh] = useState<boolean>(false);
    const [FileName, setFileName] = useState("");
    const user = useSelector((state: RootState) => state.user);

    const downloadfilenameh = async () => {


        try {

            const result = await GetFileNamePic(FileName, 2);


            if (!result || !(result instanceof Blob)) {
                alert("خطا در دریافت فایل.");
                return;
            }
            const url = window.URL.createObjectURL(result);
            const link = document.createElement("a");
            link.href = url;
            link.download = FileName; // نام فایل دانلود شده
            link.style.display = "none";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("خطا در دانلود فایل:", error);
            alert("خطا در دانلود فایل. لطفاً دوباره امتحان کنید.");
        }
    };

    const openModalJambandi = async () => {
        const result = await GetJambandiForHozeh(erjaId);
        const items = Array.isArray(result) ? result : result?.data ?? [];

        const content: any = {
            type: "doc",
            content: [],
        };

        items.forEach((item: any, index: number) => {
            const userName = item.CreateUserName ?? "";
            const jambandi = item.JambandiEghdam ?? "";
            const NameMahal = item.NameMahal ?? "";

            const paragraph = {
                type: "paragraph",
                content: [

                    {
                        type: "text",
                        text: `${userName} (${NameMahal})`,
                        marks: [
                            {
                                type: "highlight",
                            },
                        ],
                    },
                    {
                        type: "text",
                        text: `  :: ${jambandi}`,
                    },
                ],
            };

            content.content.push(paragraph);
        });

        setJambandiForHozeh(content);
        setModalOpenErsalParvandeh(true);
    };

    const GetSharestan = async (mahal: number) => {

        const result = await GetCityFare(mahal);
        if (result.status == 200) {
            setCountShahr(result.data.length);
        }

    }

    const SendParvandeh = async (erjaid: number, sharheghdam: string, Userid: number) => {
        const result = await Update_ErjaParvandeh(erjaid, true, 2, sharheghdam, Userid);
        if (result.status == 200) {
            router.push("/TahghighatManage");
        }
    }


    useEffect(() => {

        SetMahal(user.Mahal);
        SetUserId(user.UserId);
        setCodeMohaghegh(0);
        setErrorMohaghegh(true);
        seterrorTarikh(true);
        const keyData = params?.KeyData as string;
        if (keyData) {
            try {
                const erjaId = Number(decryptText(decodeURIComponent(keyData)));
                setErjaId(erjaId);
                loadData(erjaId);
                GetSharestan(user.Mahal);

            } catch (err) {
                console.error("❌ خطا در رمزگشایی شناسه:", err);
            }
        }
    }, [params, user]);


    const loadData = async (erjaid: number) => {
        try {

            const result = await GetTahghighByID(erjaid, 0, 0);
            if (result.status == 200) {
                setFileName(result.data[0].FileName);
                setonvanparvandeh("پرونده " + result.data[0].FirstName + " " + result.data[0].LastName + " " + " حوزه  " + result.data[0].NameOstan + " - " + result.data[0].NameHozeh);
                setData(result.data || []);
                setErjaParentId(result.data[0].ErjaParentId);
                setData(prev => {
                    const newData = [...prev];
                    newData[0].CountErjaMohaghegh = newData[0].CountErjaMohaghegh;
                    return newData;
                });


            } else if (result.status === 401) {
                router.push("/Login");
            } else {
                setData([]);
            }
        } catch (err) {
            console.error(err);
            setData([]);
        }
    };


    const saveErjaMohaghegh = async (isInsert: number) => {

        seterrorTarikh(false);
        setErrorMohaghegh(false);

        if (!CodeMohaghegh || CodeMohaghegh === 0) {
            setErrorMohaghegh(true);
            return;
        }

        if (!tarikh) {
            seterrorTarikh(true);
            return;
        }

        const result = await ErjaBeMohaghegh(erjaId, erjaParentId, CodeMohaghegh, tarikh, tozihat, UserId, isInsert);

        if (result.data[0].InSuccess == true) {
            setModalOpenErjaBeMohaghegh(false);
            setrefreshKeyErjaMohaghegh(prev => prev + 1);
            setCodeMohaghegh(0);
            settarikh("");
            await loadData(erjaId);
        }

        else if (result.data[0].IsSuccess == false && result.data[0].Status == 201) {
            showConfirm(
                "آیا از ارجاع مجدد اطمینان دارید؟",
                () => saveErjaMohaghegh(1),
                "هشدار!",
                "warning"
            )
        }

    }

    const saveErjaHozeh = async (mahalSender: number,
        mahalReciver: number, isInsert: number
    ) => {

        try {

            const res = await fetch("/Api/Tahghigh/InsertErjaTahghigh", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    perjaid: erjaId,
                    mahalSender,
                    mahalReciver,
                    description: tozihat,
                    userId: UserId,
                    isInsert: isInsert,
                }),
            });

            const result = await res.json();

            if (res.ok) {
                if (result.data[0].IsSuccess == false) {
                    showConfirm(
                        "آیا از ارجاع مجدد اطمینان دارید؟",
                        () => saveErjaHozeh(user.Mahal, mahalReciver, 1),
                        "هشدار!",
                        "warning"
                    )
                }

                setModalOpenErjaBeHozeh(false);
                loadData(erjaId);
                setrefreshKeyErjaShahrestan(prev => prev + 1);

            } else {
                alert("⚠️ خطا در ذخیره اطلاعات");
            }
        } catch (err) {
            console.error(err);
            alert("❌ خطا در برقراری ارتباط با سرور");
        }
    };
    return (
        <>
            <div className="bg-sky-200 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        { label: "داشبورد", href: "/MainPage", icon: <Home className="w-4 h-4" /> },
                        { label: "مدیریت تحقیقات", href: "/TahghighatManage", icon: <Newspaper className="w-4 h-4" /> },
                        { label: onvanparvandeh, icon: <CardSimIcon className="w-4 h-4" /> },
                    ]}
                />
            </div>

            <div className="bg-white m-1 py-2 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
                <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-2">

                    {data.length > 0 && (
                        <div className={`h-12 p-2 rounded-lg shadow w-full items-center gap-4 ${data[0].IsDone === true
                                ? "bg-green-100"
                                : data[0].ErjaLastState === 3
                                    ? "bg-yellow-100"
                                    : "bg-gray-200"
                            }`}>
                            <div className="flex gap-5 whitespace-nowrap items-center justify-between">

                                <div className="flex gap-5">
                                    <p
                                        onClick={
                                            () => {
                                                setFileName(data[0].FileName);
                                                downloadfilenameh();
                                            }
                                        }
                                        className="flex gap-2  bg-purple-800 py-1 rounded-2xl px-5 cursor-pointer">
                                        <span className="flex-1 text-white text-[13px] "> کاربرگ تحقیق                     </span>
                                        <span className="flex text-white"> <Download height={20} /></span>

                                    </p>
                                    <p>
                                        <span className="font-semibold text-blue-600 text-[13px]">ارسال کننده :</span>
                                        <span className="text-gray-700 text-[15px] mr-2">{data[0].MahalSender_NameFarsi}</span>
                                    </p>

                                    <div>
                                        <span className="font-semibold text-blue-600 text-[13px]">توضیحات :</span>
                                        <DescriptionWithModal status="info" description={data[0].Description} />
                                    </div>

                                    <p>
                                        <span className="font-semibold text-blue-600 text-[13px]">زمان ارجاع :</span>
                                        <span className="text-gray-700 text-[14px] mr-2">{data[0].CreateDateTime}</span>
                                    </p>

                                    <p>
                                        <span className="font-semibold text-blue-600 text-[13px]"> مشاهده وضیت :</span>
                                        <span className="text-gray-700 text-[14px] mr-2">{data[0].JambandiEghdam}</span>
                                    </p>
                                </div>

                                {/* سمت چپ: دکمه‌ها */}
                                {(data[0].IsDone == false && data[0].CountErjaMohaghegh == data[0].CountErjaMohagheghDone && data[0].CountErjaMohagheghDone > 0 &&
                                    data[0].CountErja == data[0].CountErjaDone && (
                                        <div className="flex gap-2">
                                            <button
                                                onClick={async () => {
                                                    openModalJambandi();
                                                }
                                                }
                                                className="flex items-center gap-1 mx-3 p-2 px-6 rounded-2xl bg-green-700 text-white shadow hover:bg-green-800 transition-colors cursor-pointer">
                                                <Check className="w-4 h-4" />
                                                ارسال پرونده
                                            </button>

                                        </div>

                                    ))}

                            </div>
                        </div>
                    )}

                    {data.length > 0 && countShahr > 0 && (
                        <div className="mx-5 border rounded-xl shadow-sm bg-slate-100">
                            {/* سربرگ پنل */}
                            <div className="flex items-center justify-between p-3 select-none hover:bg-gray-100 hover:rounded-xl transition-colors">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-purple-600 w-5 h-5" />
                                    <h2
                                        onClick={() => setIsOpen1(!isOpen1)}
                                        className="cursor-pointer Roya text-[18px] text-purple-800 font-semibold flex items-center gap-2"
                                    >
                                        ارجاع به شهرستان فرعی
                                        <span className="bg-gray-400 text-white rounded-full w-7 h-7 flex items-center justify-center">
                                            {data[0].CountErja || 0}
                                        </span>
                                        <span className="bg-green-700 text-white rounded-full w-7 h-7 flex items-center justify-center">
                                            {data[0].CountErjaDone || 0}
                                        </span>
                                    </h2>
                                </div>

                                {data[0].IsDone == false && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setModalOpenErjaBeHozeh(true)}
                                            className="flex items-center gap-1 p-2 px-4 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-colors text-sm cursor-pointer"
                                        >
                                            <PlusCircle className="w-4 h-4" />
                                            ارجاع به شهرستان
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* محتوای بازشونده */}
                            {isOpen1 && (
                                <div className="border-t">
                                    <ErjaHozeh
                                        key={refreshKeyErjaShahrestan}
                                        erjaParentId={data[0].ErjaId}
                                        typeLevel="shahrestan" // ✅ سطح فعلی شهرستان است
                                        onChangeCountErjaHozeh={(count, doneCount) => {
                                            setData(prev => {
                                                const newData = structuredClone(prev);
                                                if (newData[0]) {
                                                    newData[0].CountErja = count;
                                                    newData[0].CountErjaDone = doneCount;
                                                }
                                                return newData;
                                            });
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}





                    {data.length > 0 && (
                        <div className="mx-5 border rounded-xl shadow-sm bg-slate-100">
                            <div
                                className="flex items-center justify-between p-3 select-none hover:bg-gray-100 hover:rounded-xl transition-colors"

                            >
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="text-purple-600 w-5 h-5" />
                                    <h2
                                        onClick={() => setIsOpen2(!isOpen2)}
                                        className="cursor-pointer  Roya text-[18px] text-purple-800 font-semibold flex items-center gap-2">
                                        ارجاع به محقق ویژه شهرستان
                                        <span className="bg-gray-400 text-white rounded-full w-7 h-7 flex items-center justify-center">
                                            {data[0].CountErjaMohaghegh || 0}
                                        </span>
                                        <span className="bg-green-700 text-white rounded-full w-7 h-7 flex items-center justify-center">
                                            {data[0].CountErjaMohagheghDone || 0}
                                        </span>
                                    </h2>
                                </div>

                                {(data[0].IsDone == false && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => { setModalOpenErjaBeMohaghegh(true) }
                                            }
                                            className="flex items-center gap-1 p-2 px-4 bg-blue-600 text-white rounded-xl shadow hover:bg-blue-700 transition-colors text-sm cursor-pointer">
                                            <PlusCircle className="w-4 h-4" />
                                            ارجاع به محقق ویژه شهرستان
                                        </button>

                                    </div>

                                ))}

                            </div>

                            {data.length > 0 && isOpen2 && (
                                <div className="border-t">
                                    <ErjaMohaghegh key={refreshKeyErjaMohaghegh}
                                        erjaId={data[0].ErjaId}
                                        onChangeCountJambandi={(countjambandi) => {
                                            const newData = [...data];
                                            newData[0] = {
                                                ...newData[0],
                                                CountErjaMohagheghDone: countjambandi
                                            };

                                            setData(newData);
                                        }}
                                        onChangeCountMohaghegh={(countmohaghegh) => {
                                            const newData = [...data];
                                            newData[0] = {
                                                ...newData[0],
                                                CountErjaMohaghegh: countmohaghegh
                                            };

                                            setData(newData);
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )}


                </div>

            </div >




            {/* مودال افزودن آیتم */}
            {
                data.length > 0 && ModalOpenErjaBeHozeh && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* پس‌زمینه نیمه شفاف */}
                        <div
                            className="absolute inset-0 bg-black opacity-40"
                            onClick={() => setModalOpenErjaBeHozeh(false)}
                        ></div>

                        {/* محتوای مودال */}
                        <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-96 relative">
                            <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
                                <h2 className="text-lg font-bold">افزودن ارجاع جدید</h2>
                            </div>
                            <hr className="mb-3 text-blue-800" />

                            <InputUserDropdown
                                label="شهرستان حوزه فرعی"
                                pCityId={data[0].MahalReciver}
                                CityIdNo={data[0].MahalReciver}
                                IsMarkaz={0}
                                onSelect={(info) => {
                                    setCityMarkaz(info ? info.id : null);
                                }}
                                error={CityMarkaz === null}
                                errorMessage={CityMarkaz === null ? "لطفاً شهرستان را انتخاب کنید" : ""}
                            />

                            <textarea
                                className="text-[15px] w-full h-24 border border-gray-300 rounded p-2 mb-2 resize-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
                                placeholder="توضیحات ارجاع پرونده "
                                value={tozihat || ""}
                                onChange={(e: any) => setTozihat(e.target.value)}
                            />

                            {/* دکمه‌ها */}
                            <div className="flex justify-end gap-2 mt-5">
                                <button
                                    className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded cursor-pointer"
                                    onClick={() => setModalOpenErjaBeHozeh(false)}
                                >
                                    انصراف
                                </button>
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded cursor-pointer"
                                    onClick={() => (saveErjaHozeh(user.Mahal, CityMarkaz || 0, 0))}
                                >
                                    تایید
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* مودال افزودن آیتم */}
            {
                data.length > 0 && ModalOpenErjaBeMohaghegh && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center">
                        {/* پس‌زمینه نیمه شفاف */}
                        <div
                            className="absolute inset-0 bg-black opacity-40"
                            onClick={() => setModalOpenErjaBeMohaghegh(false)}
                        ></div>

                        {/* محتوای مودال */}
                        <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-96 relative">
                            <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
                                <h2 className="text-lg font-bold">افزودن ارجاع جدید</h2>
                            </div>
                            <hr className="mb-3 text-blue-800" />

                            <ModalEjraBeMohaghegh
                                codeEntekhabat={31210}
                                label="محقق"
                                mahal={data[0].MahalReciver}
                                noeHamkari={2}
                                vije={1}
                                onSelect={(info) => {
                                    setCodeMohaghegh(info ? info.id : null);
                                    setErrorMohaghegh(false);
                                }}
                                error={errorMohaghegh}
                                errorMessage={errorMohaghegh ? "لطفاً محقق را انتخاب کنید" : ""}
                            />

                            <div className="">
                                <PersianDateInput
                                    label="مهلت انجام"
                                    // value={tarikh ?? undefined}
                                    allowPastDates={false}
                                    onChange={(v: any) => {
                                        settarikh(v)
                                        seterrorTarikh(false);
                                    }
                                    }
                                    error={errorTarikh}
                                    errorMessage={errorTarikh ? "لطفاً تاریخ را انتخاب کنید" : ""} // ✅ پیام خطا
                                />
                            </div>


                            <textarea
                                className="text-[15px] w-full h-24 border border-gray-300 rounded p-2 mb-2 resize-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
                                placeholder="توضیحات ارجاع پرونده "
                                value={tozihat}
                                onChange={(e: any) => setTozihat(e.target.value)}
                            />

                            {/* دکمه‌ها */}
                            <div className="flex justify-end gap-2 mt-5">
                                <button
                                    className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded cursor-pointer"
                                    onClick={() => setModalOpenErjaBeMohaghegh(false)}
                                >
                                    انصراف
                                </button>
                                <button
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded cursor-pointer"
                                    onClick={() => (saveErjaMohaghegh(0))}
                                >
                                    تایید
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {data.length > 0 && ModalOpenErsalParvandeh && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* پس‌زمینه نیمه شفاف */}
                    <div
                        className="absolute inset-0 bg-black opacity-40"
                        onClick={() => setModalOpenErsalParvandeh(false)}
                    ></div>

                    {/* محتوای مودال */}
                    <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[800px] relative max-h-[90vh] overflow-y-auto">
                        <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
                            <h2 className="text-lg font-bold">ثبت جمع بندی </h2>
                        </div>
                        <hr className="mb-3 text-blue-800" />


                        <RichTextEditor height="h-130"
                            content={JambandiForHozeh}
                            onChange={(newContent) => setJambandiForHozeh(newContent)}
                            readOnly={false}
                            justify={true}
                        />


                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded cursor-pointer"
                                onClick={() => setModalOpenErsalParvandeh(false)}
                            >
                                انصراف
                            </button>
                            <button
                                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-2xl cursor-pointer"
                                onClick={() => (SendParvandeh(erjaId, JambandiForHozeh, user.UserId))}

                            >
                                <span className="flex gap-2">
                                    <Check size={15} className="mt-1" />
                                    تایید
                                </span>
                            </button>
                        </div>
                    </div>
                </div >
            )
            }

            {/* مودال افزودن آیتم
            {data.length > 0 && ModalOpenErsalParvandeh && (
                <div className="fixed inset-0 z-50 flex items-start justify-center mt-20">
            <div
                className="absolute inset-0 bg-black opacity-40"
                onClick={() => setModalOpenErsalParvandeh(false)}
            ></div>

            <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[900px]  h-[700px] relative">
                <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
                    <h2 className="text-lg font-bold">ارسال پرونده به استان</h2>
                </div>
                <hr className="mb-3 text-blue-800" />
              

                <RichTextEditor height="h-130"
                    content={JambandiForHozeh} // حالا یک JSON TipTap است
                    onChange={(newContent) => setJambandiForHozeh(newContent)}
                    readOnly={false}
                    justify={true}
                />


             
             

                <div className="flex justify-end gap-2 mt-3">
                    <button
                        className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded cursor-pointer"
                        onClick={() => setModalOpenErsalParvandeh(false)}
                    >
                        انصراف
                    </button>


                    <button
                        className="flex gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-2xl cursor-pointer"
                        onClick={() => (SendParvandeh(erjaId, JambandiForHozeh, user.UserId))}
                    >
                        تایید جمعبندی
                        <CheckCircle />

                    </button>
                </div>
            </div>
        </div >
            )
} */}

        </>
    );
}
