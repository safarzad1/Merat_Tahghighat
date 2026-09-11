"use client";

import { use, useEffect, useState, useRef } from "react";
import DynamicTable from "@/component/DataTable/CustomTable1";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { AddPerson, AddHamkari, GetPersonHamkari, GetPersonHamkariKholaseh, DeletePersonHamkari } from "@/Lib/ApiServiseHamkari";
import { GetUserPic, UploadUserPic } from '@/Lib/ApiServiceUsers'
import { Dock, Download, FileText, MapPin, PanelLeftClose, Phone, PlusCircle, Save, Upload, User2Icon } from "lucide-react";
import FormInput from "@/component/Objects/FormInput1";
import PersianDateInput from '@/component/Objects/InputPersianDatePicker'
import { CheckCircle, Code2Icon } from "lucide-react";
import GetDFNByPID from '@/component/DFN/GetDFNByPID'
import TextArea1 from '@/component/Objects/Textarea1'
import { Bell, Search, Link2, MinusCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import GetCityList from "@/component/Citys/GetCitys";
import { useConfirm } from "@/Utils/ConfirmModalContext";
import { encryptText } from "@/Lib/cryptoUtil";
import { useAlert } from "@/component/AlertContext";
import { IranNationalCode, IranTelHamrahCode } from "@/Lib/ApiService"
import domtoimage from 'dom-to-image';
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { UploadNameh, GetFileNamePic } from '@/Lib/ApiServiceNameha'
import { showToast } from "@/component/CustomToast";


const baseBtn =
    "p-5 h-5 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white";

const inactiveBtn =
    "cursor-pointer bg-purple-100 border-gray-300 text-gray-700 hover:bg-gray-200";

const activeBtn =
    "cursor-pointer border-red-600 text-purple-700 shadow-md";


const LoadingOverlay = () => (
    <div className="absolute inset-0 bg-white bg-opacity-60 flex items-center justify-center backdrop-blur-[1px] z-10">
        <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
    </div>
);

type Props = {
    mahal: number;
};



export default function FehrestUsersClient({ mahal }: Props) {
    const { showAlert } = useAlert();
    const router = useRouter();
    const { showConfirm } = useConfirm();
    const [loadingKey, setLoadingKey] = useState("");

    const user = useSelector((state: RootState) => state.user);
    const [activeRole, setActiveRole] = useState<string | null>(null);
    const [NoeHamkariSelectd, setNoeHamkariSelectd] = useState(0);
    const [OstanLabel, setOstanLabel] = useState("");
    const [NameMahalSelected, setNameMahalSelected] = useState<string>("");

    const [MahalHamkari, setMahalHamkari] = useState(0);
    const [NoeHamkari, setNoeHamkari] = useState(0);
    const [NoeGharardad, setNoeGharardad] = useState(0);
    const [PSathHamkari, setPSathHamkari] = useState(0);
    const [SathHamkari, setSathHamkari] = useState(0);
    const [VaziyatHamkari, setVaziyatHamkari] = useState(0);
    const [RadeTakhasos, setRadeTakhasos] = useState(0);
    const [SharhTakhasos, setSharhTakhasos] = useState("");
    const [errorSathHamkari, seterrorSathHamkari] = useState(false);
    const [errorNoeHamkari, seterrorNoeHamkari] = useState(false);
    const [errorNoeGharardad, seterrorNoeGharardad] = useState(false);
    const [errorVaziyatHamkari, seterrorVaziyatHamkari] = useState(false);
    const [errorRadeTakhasos, seterrorRadeTakhasos] = useState(false);
    const [errorSharhTakhasos, seterrorSharhTakhasos] = useState(false);

    const [imgSrc, setImgSrc] = useState("/images/person.png");
    const [uploading, setUploading] = useState(false);


    const [DataHamkari, setDataHamkari] = useState<any[]>([]);
    const [tarikh, settarikh] = useState<string | null>(null);
    const [ModalOpenUser, setModalOpenUser] = useState(false);
    const [ModalOpenUserHamkari, setModalOpenUserHamkari] = useState(false);
    const [ModalCreateUser, setModalCreateUser] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [page, setPage] = useState<number>(1);
    const [indexsorat, setindexsorat] = useState<number>(1);
    const [descsort, setdescsort] = useState<number>(1);
    const [totalRecord, setTotalRecord] = useState<number>(0);
    const [searchText, setSearchText] = useState<string>("");
    const [CodeMelliSelected, setCodeMelliSelected] = useState<string>("");
    const [ModalOpenNameh, setModalOpenNameh] = useState(false);
    const [FullNameSelected, setFullNameSelected] = useState<string>("");
    const [JensiyatSelected, setJensiyatSelected] = useState<number>(0);
    const [ModalOpenPersons, setModalOpenPersons] = useState(false);

    const sizePage = 10;

    interface PersonFormState {
        HamkariId: number;
        PersonId: number;
        CodeMelli: string;
        TelHamrah: string;
        PhoneNumber: string;
        FirstName: string;
        LastName: string;
        FatherName: string;
        TarikhTavalod: string;
        ShomareShenasnameh: string;
        SerialShenasnameh: string;
        MahalTavalod: string;
        MahalSodor: string;
        Jensiyat: number | null;
        Taahol: number | null;
        Din: number | null;
        Mazhab: number | null;
        MahalHamkari: number | null;
    }

    const [formState, setFormState] = useState<PersonFormState>({
        HamkariId: 0,
        PersonId: 0,
        CodeMelli: "",
        TelHamrah: "",
        PhoneNumber: "",
        FirstName: "",
        LastName: "",
        FatherName: "",
        TarikhTavalod: "",
        ShomareShenasnameh: "",
        SerialShenasnameh: "",
        MahalTavalod: "",
        MahalSodor: "",
        Jensiyat: null,
        Taahol: null,
        Din: null,
        Mazhab: null,
        MahalHamkari: 0
    });
    const [errors, setErrors] = useState<{ [key: string]: boolean }>({});

    const handleChange = (name: string, value: string | number) => {
        setFormState((prev) => ({
            ...prev,
            [name]: value,
        }));

        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: false,
            }));
        }
    };

    const handleExportPNG = async () => {
        try {
            const f1 = await exportNodeToPNGFile("div_image_page1", "page1.png", true);
            if (!f1) return;
            const guidName = uuidv4() + ".png";

            console.log(formState.PersonId);
            const Result = await UploadNameh(formState.PersonId, 31210, guidName, user.UserId, f1.file);
            /* console.log(Result); */

        } catch (err) {
            console.error("❌ خطا:", err);
        }
    };

    const exportNodeToPNGFile = async (nodeId: string, fileName: string, isDownload: boolean) => {
        const node = document.getElementById(nodeId);
        if (!node) {
            console.error(`❌ عنصر با id="${nodeId}" پیدا نشد`);
            return null;
        }

        const scale = 3;
        const width = node.scrollWidth;
        const height = node.scrollHeight;

        const dataUrl = await domtoimage.toPng(node, {
            width: width * scale,
            height: height * scale,
            style: {
                transform: `scale(${scale})`,
                transformOrigin: "top left",
                width: `${width}px`,
                height: `${height}px`,
            },
            bgcolor: "#ffffff",
        });

        if (isDownload) {
            const link = document.createElement('a');
            link.download = 'Export.png';
            link.href = dataUrl;
            link.click();
        }

        const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
            const res = await fetch(dataUrl);
            const blob = await res.blob();
            return new File([blob], fileName, { type: blob.type || "image/png" });
        };

        const file = await dataUrlToFile(dataUrl, fileName);

        const previewUrl = URL.createObjectURL(file);

        return { file, previewUrl };
    };
    const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        let newErrors: { [key: string]: boolean } = {};

        if (!file.type.startsWith("image/")) {
            showAlert({
                type: "error",
                title: "خطا",
                description: "لطفا تصویر با فرمت مناسب انتخاب نمایید",
            });
            // showToast.success("عملیات با موفقیت انجام شد.", "ثبت نام");
            // showToast.error("عملیات با موفقیت انجام شد.", "ثبت نام");
            // showToast.info("عملیات با موفقیت انجام شد.", "ثبت نام");
            // showToast.warning("عملیات با موفقیت انجام شد.", "ثبت نام");

            // showToast.error("این یک تست خطا است");
            e.target.value = "";
            return;
        }

        try {
            if (formState.CodeMelli) {

                const resultvalid = await IranNationalCode(formState.CodeMelli, user.UserId);
                const isValidValue = resultvalid.data[0].IsValid;
                if (!isValidValue) {
                    newErrors["CodeMelli"] = true;
                    setErrors(newErrors);
                    showAlert({
                        type: "error",
                        title: "خطا",
                        description: "فرمت شماره ملی صحیح نیست",
                    });
                    return;
                }
                else {
                    setUploading(true);
                    const localUrl = URL.createObjectURL(file);

                    setImgSrc(localUrl);

                    await UploadUserPic(formState.CodeMelli, user.UserId, file);

                    e.target.value = "";
                    setUploading(false);
                }

            }
            else {
                showAlert({
                    type: "error",
                    title: "خطا",
                    description: "لطفا شماره ملی را وارد نمایید",
                });
            }

        } catch (err: any) {
            alert(err?.message || "خطا در آپلود تصویر");
            setUploading(false);
        }
    };


    const InsertPerson = async (personId: number, codemelli: string
        , firstname: string, lastname: string, namepedar: string
        , tarikhtavalod: string, shomareShenasnameh: string,
        mahaltavalod: string, mahalsodor: string, serialshenasnameh: string
        , telhamrah: string, phonenumber: string, jensiyat: number, taahol: number, din: number, mazhab: number) => {


        let newErrors: { [key: string]: boolean } = {};

        if (!firstname || firstname.trim() === "") {
            newErrors["FirstName"] = true;
        }
        if (!lastname || lastname.trim() === "") {
            newErrors["LastName"] = true;
        }
        // if (!codemelli || codemelli.trim() === "") {
        //     newErrors["CodeMelli"] = true;
        // }

        if (codemelli.length > 0) {
            const resultvalid = await IranNationalCode(codemelli, user.UserId);
            const isValidValue = resultvalid.data[0].IsValid;
            if (!isValidValue) {
                newErrors["CodeMelli"] = true;
            }
        }

        if (telhamrah.trim() !== "") {
            const resultvalid = await IranTelHamrahCode(telhamrah, user.UserId);
            const isValidValue = resultvalid.data[0].IsValid;
            if (!isValidValue) {
                newErrors["TelHamrah"] = true;
            }
        }

        if (telhamrah.trim() == "" && phonenumber.trim() == "") {
            newErrors["TelHamrah"] = true;
            newErrors["Phonenumber"] = true;
        }

        if (jensiyat == 0) {
            newErrors["Jensiyat"] = true;
        }
        if (taahol == 0) {
            newErrors["Taahol"] = true;
        }
        if (din == 0) {
            newErrors["Din"] = true;
        }
        if (mazhab == 0) {
            newErrors["Mazhab"] = true;
        }


        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }



        const result = await AddPerson(personId, codemelli, firstname
            , lastname, namepedar, tarikhtavalod, shomareShenasnameh, serialshenasnameh
            , mahaltavalod, mahalsodor, telhamrah, phonenumber, jensiyat, taahol, din, mazhab, mahal, user.UserId);
        console.log(result);


        if (result.status === 401) {
            router.push("/Login");
        }
        else if (result.data[0].ResultInsert == 200) {
            setFormState(prevState => ({
                ...prevState, // حفظ سایر فیلدها
                PersonId: result.data[0].PersonId
            }));


            showAlert({
                type: "success",
                title: "ثبت موفق",
                description: "شخص جدید با موفقیت ثبت شد - لطفا  در همین صفحه در قسمت پایین همکاری فرد را با افزودن ثبت نمایید: " + formState.PersonId,
            });
            return;
        }
        else if (result.data[0].ResultInsert == 201) {
            showAlert({
                type: "error",
                title: "خطا",
                description: "شماره ملی وارد شده تکراری است . لطفا ابتدا جستجو کنید",
            });
            return;
        }
        else if (result.data[0].ResultInsert == 202) {
            showAlert({
                type: "error",
                title: "خطا",
                description: " تلفن همراه وارد شده تکراری است . لطفا ابتدا جستجو کنید",
            });
            return;
        }

    }


    const InsertHamkar = async (hamkariId: number, personId: number
        , noeHamkari: number, noeGharardad: number
        , mahalHamkari: number, sathHamkari: number, radeTakhasos: number,
        sharhTakhasos: string, vaziyatHamkari: number, userId: number
        , isActive: boolean) => {

        const result = await AddHamkari(hamkariId, personId, noeHamkari, noeGharardad
            , mahalHamkari, sathHamkari, radeTakhasos, sharhTakhasos
            , vaziyatHamkari, userId, isActive);
        if (result.status === 401) {
            router.push("/Login");
        }
        const resulthamkari = await GetPersonHamkariKholaseh(formState.PersonId);
        setDataHamkari(resulthamkari.data);

        setModalOpenUserHamkari(false);

    }


    const DeleteHamkari = async (hamkariId: number, userId: number) => {

        const result = await DeletePersonHamkari(hamkariId, userId);
        if (result.status === 401) {
            router.push("/Login");
        }
        const resulthamkari = await GetPersonHamkariKholaseh(formState.PersonId);
        setDataHamkari(resulthamkari.data);

    }

    const openEditModal = async (row: any) => {
        const result = await GetPersonHamkariKholaseh(row?.PersonId);
        setOstanLabel(user.Mahal.toString().substring(0, 3));
        setDataHamkari(result.data);
        setCodeMelliSelected(row?.CodeMelli ?? "");
        setNameMahalSelected(row?.MahalHamkari_NameFarsi);
        setFullNameSelected(row?.FullName);
        setJensiyatSelected(row?.Jensiyat);
        setFormState({
            HamkariId: row?.HamkariId ?? 0,
            PersonId: row?.PersonId,
            MahalHamkari: row?.MahalHamkari,
            FirstName: String(row?.FirstName ?? "").trim(),
            LastName: String(row?.LastName ?? "").trim(),
            CodeMelli: String(row?.CodeMelli ?? "").trim(),
            TelHamrah: String(row?.TelHamrah ?? "").trim(),
            FatherName: String(row?.FatherName ?? "").trim(),
            TarikhTavalod: String(row?.TarikhTavalod ?? "").trim(),
            Din: row?.Din,
            Jensiyat: row?.Jensiyat,
            MahalSodor: row?.MahalSodor,
            MahalTavalod: row?.MahalTavalod,
            Mazhab: row?.Mazhab,
            PhoneNumber: row?.phoneNumber,
            SerialShenasnameh: row?.SerialShenasnameh,
            ShomareShenasnameh: row?.ShomareShenasnameh,
            Taahol: row?.Taahol,
        });
        setModalOpenUser(true);
    };

    const handleSortChange = (field: string, direction: "asc" | "desc") => {
        const sortIndexMap: Record<string, number> = {
            CodeMelli: 1,
            FirstName: 2,
            LastName: 3,
            OnvanPost: 4,
            NameMahal: 5,
        };

        const columnIndex = sortIndexMap[field] ?? 1;
        const sortDirection = direction === "asc" ? 1 : 2;

        setindexsorat(columnIndex);
        setdescsort(sortDirection);
        setPage(1);
    };

    const fetchUsers = async () => {
        if (!mahal) return;

        const result = await GetPersonHamkari(mahal, page, sizePage, indexsorat, descsort, searchText, NoeHamkariSelectd);

        setData(result.data?.items ?? result.data ?? []);
        setTotalRecord(Number(result.data?.[0]?.TotalCount ?? 0));
        setLoadingKey("");
    };

    useEffect(() => {
        fetchUsers();
    }, [mahal, indexsorat, descsort, searchText, page, NoeHamkariSelectd]);


    useEffect(() => {
        let objectUrl: string | null = null;
        let cancelled = false;

        async function loadPic() {
            const username = String(CodeMelliSelected).trim();
            if (!username) {
                setImgSrc("/images/person.png");
                return;
            }

            try {
                const res: any = await GetUserPic(username);
                if (cancelled) return;

                if (res instanceof Blob) {
                    objectUrl = URL.createObjectURL(res);
                    setImgSrc(objectUrl);
                    return;
                }

                if (typeof res === "string" && (res.startsWith("http") || res.startsWith("/"))) {
                    setImgSrc(res);
                    return;
                }

                if (typeof res === "string" && res.length > 50) {
                    setImgSrc(`data:image/jpeg;base64,${res}`);
                    return;
                }

                setImgSrc("/images/person.png");
            } catch {
                if (!cancelled) setImgSrc("/images/person.png");
            }
        }

        loadPic();

        return () => {
            cancelled = true;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [CodeMelliSelected]);

    return (
        <>
            <div className="px-5 p-1.5 flex flex-wrap gap-3 mb-0">
                <button
                    onClick={async () => {
                        setFormState({
                            PersonId: 0,
                            FirstName: "",
                            LastName: "",
                            FatherName: "",
                            CodeMelli: "",
                            PhoneNumber: "",
                            TarikhTavalod: "",
                            ShomareShenasnameh: "",
                            SerialShenasnameh: "",
                            MahalTavalod: "",
                            MahalSodor: "",
                            TelHamrah: "",
                            Jensiyat: 0,
                            Taahol: 0,
                            Din: 0,
                            Mazhab: 0,
                            HamkariId: 0,
                            MahalHamkari: 0
                        });

                        const result = await GetPersonHamkariKholaseh(0);
                        setDataHamkari(result.data);
                        setModalCreateUser(true);
                    }}
                    className="p-5 h-5 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white"
                >
                    <PlusCircle size={20} />
                    افزودن
                </button>
                {/* --- دکمه همه اشخاص --- */}
                <button
                    onClick={() => {
                        setLoadingKey("allsemat");
                        setTimeout(() => {
                            setActiveRole("allsemat");
                            setNoeHamkariSelectd(0);
                        }, 500);
                    }}
                    className={`${baseBtn} ${activeRole === "allsemat" ? activeBtn : inactiveBtn} relative overflow-hidden`}
                >
                    <MinusCircle size={16} />
                    همه اشخاص
                    {loadingKey === "allsemat" && <LoadingOverlay />}
                </button>

                {/* --- دکمه اطلاع‌رسان --- */}
                <button
                    onClick={() => {
                        setLoadingKey("notify");
                        setTimeout(() => {
                            setNoeHamkariSelectd(1);
                            setActiveRole("notify");
                        }, 500);
                    }}
                    className={`${baseBtn} ${activeRole === "notify" ? activeBtn : inactiveBtn} relative overflow-hidden`}
                >
                    <MinusCircle size={16} />
                    اطلاع‌رسان
                    {loadingKey === "notify" && <LoadingOverlay />}
                </button>

                {/* --- دکمه محقق --- */}
                <button
                    onClick={() => {
                        setLoadingKey("research");
                        setTimeout(() => {
                            setActiveRole("research");
                            setNoeHamkariSelectd(2);
                        }, 500);
                    }}
                    className={`${baseBtn} ${activeRole === "research" ? activeBtn : inactiveBtn} relative overflow-hidden`}
                >
                    <Search size={16} />
                    محقق
                    {loadingKey === "research" && <LoadingOverlay />}
                </button>

                {/* --- دکمه منبع (اصلاح شده) --- */}
                <button
                    onClick={() => {
                        setLoadingKey("source");
                        setTimeout(() => {
                            setActiveRole("source");
                            setNoeHamkariSelectd(4);
                        }, 500);
                    }}
                    className={`${baseBtn} ${activeRole === "source" ? activeBtn : inactiveBtn} relative overflow-hidden`} // ✅ کلاس‌ها اضافه شدند
                >
                    <Link2 size={16} /> {/* ✅ آیکون اصلاح شد به Link2 */}
                    منبع
                    {loadingKey === "source" && <LoadingOverlay />}
                </button>

                {/* --- دکمه شورای تحقیق (اصلاح شده) --- */}
                {mahal.toString().length == 3 && (
                    <button
                        onClick={() => {
                            setLoadingKey("tahghighOstan");
                            setTimeout(() => {
                                setActiveRole("tahghighOstan");
                                setNoeHamkariSelectd(8);
                            }, 500);
                        }}
                        className={`${baseBtn} ${activeRole === "tahghighOstan" ? activeBtn : inactiveBtn} relative overflow-hidden`} // ✅ کلاس‌ها اضافه شدند
                    >
                        <Link2 size={16} />
                        شورای تحقیق
                        {loadingKey === "tahghighOstan" && <LoadingOverlay />}
                    </button>
                )}

                {/* --- دکمه بدون سمت (اصلاح شده) --- */}
                <button
                    onClick={() => {
                        setLoadingKey("none");
                        setTimeout(() => {
                            setActiveRole("none");
                            setNoeHamkariSelectd(20);
                        }, 500);
                    }}
                    className={`${baseBtn} ${activeRole === "none" ? activeBtn : inactiveBtn} relative overflow-hidden`} // ✅ کلاس‌ها اضافه شدند
                >
                    <MinusCircle size={16} />
                    بدون سمت
                    {loadingKey === "none" && <LoadingOverlay />}
                </button>
            </div>

            <div className="cursor-pointer m-1 py-1 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
                <div className="bg-white rounded-xl shadow w-full flex flex-col gap-2">
                    <div className="p-3">
                        <DynamicTable
                            title="📋 فهرست اشخاص"
                            columns={[
                                { title: "ردیف", field: "Rdf", width: "60px" },
                                { title: "شماره پرونده", field: "ShomarehParvandeh", width: "100px" },
                                // { title: "شماره پرونده", field: "ShomarehParvandeh", width: "100px" },
                                { title: "شماره ملی", field: "CodeMelli", width: "120px" },
                                { title: "نام", field: "FirstName", width: "150px" },
                                { title: "نام خانوادگی", field: "LastName", width: "250px" },
                                { title: "نام پدر", field: "FatherName", width: "150px" },
                                { title: "تاریخ تولد", field: "TarikhTavalod", width: "110px" },
                                { title: "تلفن همراه", field: "TelHamrah", width: "150px" },
                            ]}
                            data={data}
                            totalRecord={totalRecord}
                            page={page}
                            recordsPerPage={sizePage}
                            search={searchText}
                            onPageChange={(newPage) => setPage(newPage)}
                            onSearch={(text) => {
                                setPage(1);
                                setSearchText(text);
                            }}
                            onSortChange={handleSortChange}
                            rowClassName={(row: any, idx: number) =>
                                Number(row.ErjaLastState) === 2
                                    ? "bg-green-100 hover:bg-green-300"
                                    : Number(row.ErjaLastState) === 3
                                        ? "bg-yellow-100 hover:bg-yellow-300"
                                        : `${idx % 2 === 0 ? "bg-white" : "bg-gray-100"} hover:bg-gray-200`
                            }
                            actions={[
                                { icon: <User2Icon size={16} />, title: "ویرایش", onClick: openEditModal, colorClass: "bg-blue-800" },
                            ]}
                        />
                    </div>
                </div>
            </div>

            {data.length > 0 && ModalOpenUser && (
                <div className="fixed inset-0 z-45 flex items-start justify-center mt-20">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setModalOpenUser(false)} />
                    <div className="bg-white rounded-lg px-6 pb-4 m-4 shadow-lg z-50 w-[700px] relative">
                        <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
                            <h2 className="text-lg font-bold">اطلاعات فرد</h2>
                        </div>

                        <div className="flex justify-center -mt-8 relative">
                            <label className="cursor-pointer group relative">
                                <div className="w-[84px] h-[84px] rounded-full bg-white border border-gray-200 shadow-md overflow-hidden">
                                    {imgSrc && imgSrc !== "/images/person.png" ? (
                                        <Image
                                            src={imgSrc}
                                            alt="پروفایل"
                                            width={84}
                                            height={84}
                                            className="w-full h-full object-cover"
                                            unoptimized
                                            onError={() => setImgSrc("/images/person.png")}
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2 bg-gray-100">
                                            تصویر
                                        </div>
                                    )}
                                </div>
                                {/* لایه هاور برای دکمه آپلود */}
                                <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload size={20} className="text-white" />
                                </div>
                                {/* اینپوت فایل مخفی */}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    disabled={uploading}
                                    onChange={onPickFile}
                                />
                            </label>
                            {uploading && (
                                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-xs text-blue-600 font-semibold whitespace-nowrap">
                                    در حال آپلود...
                                </span>
                            )}
                        </div>

                        <div className="flex gap-2 mt-3 px-4">
                            <div className="flex-1">
                                <FormInput label="نام" placeholder="نام" icon={Code2Icon} value={formState.FirstName} />
                            </div>
                            <div className="flex-1">
                                <FormInput label="نام خانوادگی" placeholder="نام خانوادگی" icon={Code2Icon} value={formState.LastName} />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-3 px-4">
                            <div className="flex-1">
                                <FormInput label="شماره ملی" placeholder="شماره ملی" icon={Code2Icon} value={formState.CodeMelli} />
                            </div>
                            <div className="flex-1">
                                <FormInput label="تلفن همراه" placeholder="تلفن همراه" icon={Code2Icon} value={formState.TelHamrah} />
                            </div>
                        </div>

                        <div className="flex gap-2 mt-3 px-4">
                            <div className="flex-1">
                                <FormInput label="نام پدر" placeholder="نام پدر" icon={Code2Icon} value={formState.FatherName} />
                            </div>
                            <div className="flex-1">
                                <FormInput label="تاریخ تولد" placeholder="تاریخ تولد" icon={Code2Icon} value={formState.TarikhTavalod} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                            <button
                                className="flex gap-2 bg-gray-300 hover:bg-gray-400 px-4 py-2  rounded-xl cursor-pointer"
                                onClick={() => setModalOpenUser(false)}>
                                بستن
                                <PanelLeftClose />
                            </button>
                            <button
                                onClick={() => {
                                    /* const encrypted = encryptText(String(formState.PersonId));
                                    router.push(`/Persons/Person/${encodeURIComponent(encrypted)}`); */
                                    setModalOpenUser(false);
                                    setModalCreateUser(true);
                                }
                                }
                                className="flex gap-2 bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-xl cursor-pointer">
                                اطلاعات بیشتر
                                <CheckCircle />
                            </button>
                            <button
                                onClick={() => {
                                    setModalOpenNameh(true);
                                }}
                                className="flex gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-xl cursor-pointer">
                                تولید معرفی نامه
                                <Dock />
                            </button>

                        </div>

                        <div className="my-4 border-t border-gray-300" />

                        <div>
                            <div className="flex items-center justify-between mb-2 px-4">
                                <h3 className="text-sm font-bold text-gray-700">
                                    سوابق همکاری
                                </h3>

                                <button
                                    className="cursor-pointer flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
                                    onClick={() => {
                                        setModalOpenUserHamkari(true);
                                    }}
                                >
                                    افزودن
                                    <User2Icon size={14} />
                                </button>
                            </div>


                            {DataHamkari.length === 0 ? (
                                <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                    همکاری‌ای برای این شخص ثبت نشده است
                                </div>
                            ) : (
                                <ul className="space-y-2">
                                    {DataHamkari.map((item: any, index: number) => (
                                        <li
                                            key={index}
                                            className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
                                        >
                                            {/* عنوان همکاری */}
                                            <span className="text-sm text-gray-800">
                                                {item.OnvanHamkari}
                                            </span>


                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`text-xs font-semibold px-3 py-1 rounded-full border
      ${item.IsActive
                                                            ? "bg-green-100 text-green-700 border-green-300"
                                                            : "bg-red-100 text-red-700 border-red-300"
                                                        }`}
                                                >
                                                    {item.IsActive ? "فعال" : "غیرفعال"}
                                                </span>

                                                <button
                                                    className="text-xs px-3 py-1 rounded-full border border-red-300
               bg-red-100 text-red-700 hover:bg-red-200 transition"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        showConfirm(
                                                            "آیا از حذف همکاری اطمینان دارید؟",
                                                            async () => {
                                                                await DeleteHamkari(item.HamkariId, user.UserId);

                                                            },
                                                            "هشدار!",
                                                            "warning"
                                                        );
                                                    }}
                                                >
                                                    حذف
                                                </button>
                                            </div>

                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                    </div>
                </div>
            )}


            {data.length > 0 && ModalOpenUserHamkari && (
                <div className="fixed inset-0 z-55 flex items-start justify-center mt-20">
                    <div className="absolute inset-0 bg-black opacity-40" onClick={() => setModalOpenUserHamkari(false)} />
                    <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[800px] relative">
                        <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
                            <h2 className="text-lg font-bold">افزودن همکاری جدید</h2>
                        </div>

                        <div className="flex gap-3 mt-3">
                            <div className="flex-1">
                                <GetDFNByPID
                                    PID={1191}
                                    label="محل تحقیق"
                                    defaultValue={0}
                                    onSelect={(info) => {
                                        const newNoe = info ? Number(info.Value) : 0;
                                        setNoeHamkari(newNoe);
                                        if (newNoe === 1) setPSathHamkari(11911);
                                        if (newNoe === 2) setPSathHamkari(11912);
                                        if (newNoe === 4) setPSathHamkari(11914);
                                        if (newNoe === 5) setPSathHamkari(11915);
                                        if (newNoe === 6) setPSathHamkari(11916);

                                        seterrorNoeHamkari(false);
                                    }}


                                    error={errorNoeHamkari === true}
                                    errorMessage={errorNoeHamkari === true ? "لطفاً محل تحقیق را انتخاب کنید" : ""}
                                />
                            </div>
                            <div className="flex-1">
                                <GetDFNByPID
                                    PID={PSathHamkari}
                                    label="سطح همکاری"
                                    defaultValue={0}
                                    onSelect={(info) => setSathHamkari(info ? info.Value : 0)}
                                    error={errorSathHamkari === true}
                                    errorMessage={errorSathHamkari === true ? "لطفاً سطح همکاری را انتخاب کنید" : ""}
                                />
                            </div>

                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1">
                                <GetDFNByPID
                                    PID={1192}
                                    label="نوع قرارداد"
                                    defaultValue={0}
                                    onSelect={(info) => setNoeGharardad(info ? info.Value : 0)}
                                    error={errorNoeGharardad === true}
                                    errorMessage={errorNoeGharardad === true ? "لطفاً نوع قرارداد را انتخاب کنید" : ""}
                                />
                            </div>
                            <div className="flex-1">
                                <GetDFNByPID
                                    PID={1195}
                                    label="وضعیت همکاری"
                                    defaultValue={0}
                                    onSelect={(info) => setVaziyatHamkari(info ? info.Value : 0)}
                                    error={errorVaziyatHamkari === true}
                                    errorMessage={errorVaziyatHamkari === true ? "لطفاً نوع قرارداد را انتخاب کنید" : ""}
                                />
                            </div>

                        </div>

                        <div className="flex gap-2">
                            <div className="flex-1">
                                <GetDFNByPID
                                    PID={11917}
                                    label="رده تخصصی"
                                    defaultValue={0}
                                    onSelect={(info) => setRadeTakhasos(info ? info.Value : 0)}
                                    error={errorRadeTakhasos === true}
                                    errorMessage={errorRadeTakhasos === true ? "لطفاً نوع قرارداد را انتخاب کنید" : ""}
                                />
                            </div>
                            <div className="flex-1">
                                <GetCityList
                                    label="محل"
                                    pcityId={user?.Mahal ?? 0}
                                    defaultValue={MahalHamkari || undefined}
                                    onSelect={(info) => {
                                        setMahalHamkari(info ? Number(info.CityId) : 0);
                                    }}
                                />

                            </div>


                        </div>

                        <div className="flex gap-3">
                            <TextArea1
                                height="h-50"
                                justify={true}
                                label="شرح تخصص :"
                                placeholder="توضیحات مورد نظر را وارد کنید"
                                value={SharhTakhasos}
                                onChange={(e: any) => setSharhTakhasos(e.target.value)}
                                maxLength={3000}
                                onlyNumber={false}
                                error={errorSharhTakhasos}
                                errorMessage={errorSharhTakhasos ? "این فیلد اجباری است" : ""}
                            />


                        </div>

                        <div className="flex justify-end gap-2 mt-3">
                            <button className="flex gap-2 bg-gray-300 hover:bg-gray-400 px-4 py-2  rounded-xl cursor-pointer" onClick={() => setModalOpenUserHamkari(false)}>
                                انصراف
                                <PanelLeftClose />
                            </button>

                            <button
                                onClick={() => {
                                    InsertHamkar(formState.HamkariId, formState.PersonId, NoeHamkari, NoeGharardad, MahalHamkari, SathHamkari, RadeTakhasos, SharhTakhasos, VaziyatHamkari, user.UserId, true);
                                }}

                                className="flex gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-xl cursor-pointer">
                                ثبت اطلاعات
                                <CheckCircle />
                            </button>
                        </div>
                    </div>
                </div >
            )
            }


            {data.length > 0 && ModalCreateUser && (
                <div className="fixed inset-0 z-50 flex items-start justify-center mt-20">
                    <div className="absolute inset-0 bg-black opacity-40" />

                    <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[1200px] relative">

                        <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300 text-right">
                            <h2 className="text-lg font-bold">افزودن شخص جدید
                                <span className="mx-3 text-green-800">({formState.PersonId})</span>

                            </h2>
                        </div>

                        <div className="grid grid-cols-12 gap-3 mt-3 mx-10">

                            <div className="col-span-3">
                                <FormInput
                                    label="نام "
                                    labelColor="text-blue-600"
                                    required={true}
                                    placeholder="نام "
                                    icon={User2Icon}
                                    maxLength={50}
                                    name="FirstName"
                                    value={formState.FirstName}
                                    onChange={(e) => handleChange("FirstName", e.target.value)}
                                    error={errors["FirstName"]}
                                    errorMessage={errors["FirstName"] ? "نام الزامی است" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormInput
                                    label="نام خانوادگی"
                                    labelColor="text-blue-600"
                                    required={true}
                                    placeholder="نام خانوادگی"
                                    icon={User2Icon}
                                    maxLength={100}
                                    name="LastName"
                                    value={formState.LastName}
                                    onChange={(e) => handleChange("LastName", e.target.value)}
                                    error={errors["LastName"]}
                                    errorMessage={errors["LastName"] ? "نام خانوادگی الزامی است" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormInput
                                    label="نام پدر"
                                    labelColor="text-black"
                                    placeholder="نام پدر"
                                    icon={User2Icon}
                                    maxLength={100}
                                    name="FatherName"
                                    value={formState.FatherName}
                                    onChange={(e) => handleChange("FatherName", e.target.value)}
                                    error={errors["FatherName"]}
                                    errorMessage={errors["FatherName"] ? "نام پدر الزامی است" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormInput
                                    label="شماره ملی"
                                    labelColor="text-purple-700"
                                    required={false}
                                    placeholder="شماره ملی"
                                    icon={Code2Icon}
                                    name="CodeMelli"
                                    value={formState.CodeMelli}
                                    onChange={(e) => handleChange("CodeMelli", e.target.value)}
                                    error={errors["CodeMelli"]}
                                    errorMessage={errors["CodeMelli"] ? "فرمت شماره ملی صحیح نیست" : ""}
                                    onlyNumber={true}
                                    maxLength={10}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-3 mt-3 mx-10">

                            <div className="col-span-3">
                                <PersianDateInput
                                    label="تاریخ تولد"
                                    allowPastDates={true}
                                    onChange={(v: any) => {
                                        handleChange("TarikhTavalod", v);
                                    }}
                                    error={errors["TarikhTavalod"]}
                                    errorMessage={errors["TarikhTavalod"] ? "لطفاً تاریخ تولد را انتخاب کنید" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormInput
                                    label="شماره شناسنامه"
                                    labelColor="text-black"
                                    placeholder="شماره شناسنامه"
                                    icon={Code2Icon}
                                    name="ShomareShenasnameh"
                                    value={formState.ShomareShenasnameh}
                                    onChange={(e) => handleChange("ShomareShenasnameh", e.target.value)}
                                    error={errors["ShomareShenasnameh"]}
                                    errorMessage={errors["ShomareShenasnameh"] ? "شماره شناسنامه الزامی است" : ""}
                                    onlyNumber={true}
                                    maxLength={10}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormInput
                                    label="محل تولد"
                                    labelColor="text-gray-700"
                                    placeholder="محل تولد"
                                    icon={MapPin}
                                    maxLength={100}
                                    name="MahalTavalod"
                                    value={formState.MahalTavalod}
                                    onChange={(e) => handleChange("MahalTavalod", e.target.value)}
                                    error={errors["MahalTavalod"]}
                                    errorMessage={errors["MahalTavalod"] ? "محل تولد الزامی است" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormInput
                                    label="محل صدور"
                                    labelColor="text-gray-700"
                                    placeholder="محل صدور"
                                    icon={MapPin}
                                    maxLength={100}
                                    name="MahalSodor"
                                    value={formState.MahalSodor}
                                    onChange={(e) => handleChange("MahalSodor", e.target.value)}
                                    error={errors["MahalSodor"]}
                                    errorMessage={errors["MahalSodor"] ? "محل صدور الزامی است" : ""}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-12 gap-3 mt-3 mx-10">

                            <div className="col-span-3">
                                <FormInput
                                    label="سریال شناسنامه"
                                    labelColor="text-gray-700"
                                    placeholder="سریال شناسنامه"
                                    icon={FileText}
                                    maxLength={100}
                                    name="SerialShenasnameh"
                                    value={formState.SerialShenasnameh}
                                    onChange={(e) => handleChange("SerialShenasnameh", e.target.value)}
                                    error={errors["SerialShenasnameh"]}
                                    errorMessage={errors["SerialShenasnameh"] ? "سریال الزامی است" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormInput
                                    label="تلفن همراه"
                                    labelColor="text-blue-700"
                                    required={false}
                                    placeholder="تلفن همراه"
                                    icon={Phone}
                                    maxLength={11}
                                    onlyNumber={true}
                                    name="TelHamrah"
                                    value={formState.TelHamrah}
                                    onChange={(e) => handleChange("TelHamrah", e.target.value)}
                                    error={errors["TelHamrah"]}
                                // errorMessage={errors["TelHamrah"] ? "شماره موبایل الزامی است" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <FormInput
                                    label="تلفن ثابت"
                                    labelColor="text-blue-700"
                                    required={false}
                                    placeholder="تلفن ثابت"
                                    icon={Phone}
                                    maxLength={30}
                                    onlyNumber={true}
                                    name="PhoneNumber"
                                    value={formState.PhoneNumber}
                                    onChange={(e) => handleChange("PhoneNumber", e.target.value)}
                                    error={errors["PhoneNumber"]}
                                // errorMessage={errors["PhoneNumber"] ? "شماره موبایل الزامی است" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <GetDFNByPID
                                    PID={10104}
                                    label="جنسیت"
                                    labelColor="text-blue-600"
                                    required={true}
                                    defaultValue={0}
                                    onChange={(e) => handleChange("Jensiyat", e.target.value)}
                                    error={errors["Jensiyat"]}
                                    errorMessage={errors["Jensiyat"] ? "لطفاً جنسیت را انتخاب کنید" : ""}
                                />
                            </div>

                        </div>

                        <div className="grid grid-cols-12 gap-3 mt-3 mx-10">
                            <div className="col-span-3">
                                <GetDFNByPID
                                    PID={10103}
                                    label="تأهل"
                                    labelColor="text-blue-600"
                                    required={true}
                                    defaultValue={0}
                                    name="Taahol"
                                    onChange={(e) => handleChange("Taahol", e.target.value)}
                                    onSelect={(info) => setRadeTakhasos(info ? info.Value : 0)}
                                    error={errors["Taahol"]}
                                    errorMessage={errors["Taahol"] ? "لطفاً وضعیت تاهل را انتخاب کنید" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <GetDFNByPID
                                    PID={10101}
                                    label="دین"
                                    labelColor="text-blue-600"
                                    required={true}
                                    defaultValue={0}
                                    name="Din"
                                    onChange={(e) => handleChange("Din", e.target.value)}
                                    error={errors["Din"]}
                                    errorMessage={errors["Din"] ? "لطفاً دین را انتخاب کنید" : ""}
                                />
                            </div>
                            <div className="col-span-3">
                                <GetDFNByPID
                                    PID={Number("101010" + (formState.Din || 0))}
                                    label="مذهب"
                                    labelColor="text-blue-600"
                                    required={true}
                                    defaultValue={0}
                                    name="Mazhab"
                                    onChange={(e) => handleChange("Mazhab", e.target.value)}
                                    error={errors["Mazhab"]}
                                    errorMessage={errors["Mazhab"] ? "لطفاً مذهب را انتخاب کنید" : ""}
                                />
                            </div>
                            <div className="col-span-12">
                                <div className="flex justify-end gap-2 mt-6">
                                    <button className="flex gap-2 bg-gray-300 hover:bg-gray-400 px-4 py-2 rounded-xl cursor-pointer"
                                        onClick={() => {
                                            if (DataHamkari?.length == 0) {
                                                showConfirm(
                                                    "شما هیچ همکاری برای این فرد ثبت نکردید آیا از اطمینان دارید؟",
                                                    () =>
                                                        setModalCreateUser(false),
                                                    "هشدار!",
                                                    "error"
                                                );
                                            }
                                            else {
                                                setModalCreateUser(false)
                                            }


                                        }
                                        }
                                    >
                                        انصراف
                                        <PanelLeftClose />
                                    </button>

                                    <button
                                        onClick={() => {
                                            InsertPerson(formState.PersonId, formState.CodeMelli, formState.FirstName, formState.LastName, formState.FatherName, formState.TarikhTavalod
                                                , formState.ShomareShenasnameh, formState.SerialShenasnameh, formState.MahalTavalod
                                                , formState.MahalSodor, formState.TelHamrah, formState.PhoneNumber, formState.Jensiyat || 0, formState.Taahol || 0,
                                                formState.Din || 0, formState.Mazhab || 0
                                            );
                                        }}
                                        className="flex gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-xl cursor-pointer">
                                        ثبت اطلاعات
                                        <CheckCircle />
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 relative">

                            <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center z-50 w-24">
                                <label className="cursor-pointer group relative">
                                    <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md overflow-hidden">
                                        {imgSrc && imgSrc !== "/images/person.png" ? (
                                            <Image
                                                src={imgSrc}
                                                alt="پروفایل"
                                                width={96}
                                                height={96}
                                                className="w-full h-full object-cover"
                                                unoptimized
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs text-center p-2 bg-gray-100">
                                                تصویر پروفایل
                                            </div>
                                        )}
                                    </div>
                                    <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Upload size={24} className="text-white" />
                                    </div>
                                    {/* اینپوت مخنی */}
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        disabled={uploading}
                                        onChange={onPickFile}
                                    />
                                </label>

                                {uploading && (
                                    <span className="text-xs text-blue-600 mt-1 font-semibold">در حال آپلود...</span>
                                )}


                            </div>

                            <div className="mb-4 border-t border-gray-300" />

                            <div>
                                <div className="mt-20 flex items-center justify-between mb-2 px-4">
                                    <h3 className="text-sm font-bold text-gray-700">
                                        سوابق همکاری
                                    </h3>
                                    {formState.PersonId != 0 && (
                                        <button
                                            className="cursor-pointer flex items-center gap-1 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition"
                                            onClick={() => {
                                                setModalOpenUserHamkari(true);
                                            }}
                                        >
                                            افزودن
                                            <User2Icon size={14} />
                                        </button>
                                    )}
                                </div>


                                {(!DataHamkari || DataHamkari.length === 0) ? (
                                    <div className="text-sm text-gray-500 bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        همکاری‌ای برای این شخص ثبت نشده است
                                    </div>
                                ) : (
                                    <ul className="space-y-2">
                                        {DataHamkari.map((item: any, index: number) => (
                                            <li
                                                key={index}
                                                className="flex items-center justify-between gap-3 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition"
                                            >
                                                {/* عنوان همکاری */}
                                                <span className="text-sm text-gray-800">
                                                    {item.OnvanHamkari}
                                                </span>


                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`text-xs font-semibold px-3 py-1 rounded-full border
      ${item.IsActive
                                                                ? "bg-green-100 text-green-700 border-green-300"
                                                                : "bg-red-100 text-red-700 border-red-300"
                                                            }`}
                                                    >
                                                        {item.IsActive ? "فعال" : "غیرفعال"}
                                                    </span>

                                                    <button
                                                        className="text-xs px-3 py-1 rounded-full border border-red-300
               bg-red-100 text-red-700 hover:bg-red-200 transition"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            showConfirm(
                                                                "آیا از حذف همکاری اطمینان دارید؟",
                                                                async () => {
                                                                    await DeleteHamkari(item.HamkariId, user.UserId);

                                                                },
                                                                "هشدار!",
                                                                "warning"
                                                            );
                                                        }}
                                                    >
                                                        حذف
                                                    </button>
                                                </div>

                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                        </div>

                    </div>
                </div>


            )
            }

            {ModalOpenNameh && (
                <div className="fixed inset-0 z-50 flex items-start justify-center mt-20">
                    <div
                        className="absolute inset-0 bg-black opacity-40"
                        onClick={() => setModalOpenNameh(false)}
                    />
                    <div className="bg-white rounded-lg pb-4 mt-0 shadow-lg z-50 w-[170mm] text-center relative flex justify-center">
                        <div className="w-[150mm] h-[210mm] relative" id="div_image_page1">
                            <Image
                                src={`/MoarefiNameh/Ostan${OstanLabel}.jpg`}
                                alt="پروفایل"
                                width="550"
                                height="650"
                                className="absolute top-0 left-0 w-full h-full object-cover"
                                unoptimized
                                onError={() => setImgSrc("/images/person.png")}
                            />
                            <div
                                className="IranNastaliq absolute top-72 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                                style={{ fontSize: '22px' }}
                            >
                                {JensiyatSelected === 1 ? `جناب آقای ${FullNameSelected}` : JensiyatSelected === 2 ? `سرکار خانم ${FullNameSelected}` : FullNameSelected}
                            </div>
                        </div>
                        <button
                            className="absolute bottom-0 mb-5 text-center w-10 h-10 rounded-full bg-blue-600 text-white 
                   flex items-center justify-center shadow-md hover:bg-blue-700"
                        >
                            <Download
                                onClick={() => handleExportPNG()}
                                size={15}
                                className="cursor-pointer"
                            />
                        </button>
                    </div>
                </div>
            )}


        </>
    );
}