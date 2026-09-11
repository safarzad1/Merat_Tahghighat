'use client';

import { useEffect, useState } from "react";
import { Code2Icon, Pencil } from "lucide-react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import FormInput from '@/component/Objects/FormInput1'
import GetDFNByPID from '@/component/DFN/GetDFNByPID'
import PersianDateInput from '@/component/Objects/InputPersianDatePicker'

import { personalFields, FieldConfig } from "./formFields";

const FormPerson = () => {

    const user = useSelector((state: RootState) => state.user);

    const [modalPerson, setModalPerson] = useState(false);

    type FormData = {
        [key in typeof personalFields[number]["name"]]: string;
    };

    const initialFormData: FormData = personalFields.reduce((acc, field) => {
        acc[field.name] = "";
        return acc;
    }, {} as FormData);

    const [formData, setFormData] = useState<FormData>(initialFormData);
    const [errors, setErrors] = useState<FormData>(initialFormData);

    const validateForm = () => {
        const newErrors: FormData = { ...initialFormData };

        personalFields.forEach(field => {
            const key = field.name as keyof FormData;
            if (field.required && !formData[key].trim()) {
                newErrors[key] = field.errorMessage || "این فیلد اجباری است";
            }
        });

        setErrors(newErrors);
        return Object.values(newErrors).every(v => v === "");
    };

    useEffect(() => {

    }, [user]);



    const handleSubmit = () => {
        if (validateForm()) {
            console.log("فرم معتبر است:", formData);
        }
    };


    return (
        <>
            <div className="relative p-0.5 border-4 border-gray-600 rounded-md">

                <button
                    className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-blue-600 text-white 
                   flex items-center justify-center shadow-md hover:bg-blue-700 transition"
                >
                    <Pencil
                        onClick={() =>
                            setModalPerson(true)
                        }
                        size={15} className="cursor-pointer" />
                </button>
                <div className="p-0.5 border-4 border-gray-600 rounded-md">
                    <div className="p-1 border-2 border-gray-400 rounded-sm">

                        <div className="bg-white">
                            <h2 className="text-lg mb-2 titr">مشخصــات فــردی</h2>

                            <div className="grid grid-cols-3 border border-gray-500">

                                {/* Row 1 */}
                                <div className="border border-gray-400 px-2 py-1 text-[16px]">نام: <span className="text-cyan-700 text-[16px] px-1">قاسم</span></div>
                                <div className="border border-gray-400 px-2 py-1">نام خانوادگی:</div>
                                <div className="border border-gray-400 px-2 py-1">نام پدر:</div>

                                {/* Row 2 */}
                                <div className="border border-gray-400 px-2 py-1">شماره ملی:</div>
                                <div className="border border-gray-400 px-2 py-1">شماره شناسنامه:</div>
                                <div className="border border-gray-400 px-2 py-1">شماره سریال شناسنامه:</div>

                            </div>
                            <div className="grid grid-cols-5 border-r border-l border-gray-500">

                                <div className="px-2 py-1">تاریخ تولد:</div>
                                <div className="px-2 py-1">محل تولد:</div>
                                <div className="px-3 py-1">محل صدور:</div>

                                {/* نوع شناسنامه و چک‌باکس‌ها */}
                                <div className="px-4 py-1 flex items-center gap-3">
                                    <span className="whitespace-nowrap">نوع شناسنامه:</span>

                                    <div className="flex items-center mr-4 ml-2 gap-2">
                                        <label className="flex items-center mr-3">
                                            <input type="checkbox" className="ml-1" />
                                            اصلی
                                        </label>

                                        <label className="flex items-center">
                                            <input type="checkbox" className="ml-1" />
                                            المثنی
                                        </label>
                                    </div>
                                </div>

                            </div>

                            <div className="grid grid-cols-4 border border-gray-400">
                                <div className="px-2 py-1">علت صدور المثنی :</div>
                                <div className="py-1">تاریخ صدور المثنی :</div>
                                <div className="py-1">نام یا نام خانوادگی قبلی :</div>
                                <div className="py-1">نام مستعار یا القاب :</div>
                            </div>
                            <div className="grid grid-cols-4 border border-gray-400">
                                <div className="px-2 py-1">ملیت :</div>
                                <div className="py-1">تابعیت فعلی :</div>
                                <div className="py-1">تابعیت قبلی :</div>
                                <div className="py-1">تابعیت مضاعف :</div>
                            </div>

                            <div className="grid grid-cols-3 border-r border-l border-gray-500">

                                <div className="px-2 py-1 flex items-center gap-1">
                                    <span className="whitespace-nowrap">وضعیت جسمانی:</span>

                                    <div className="flex items-center mr-4 ml-2 gap-2">
                                        <label className="flex items-center mr-3">
                                            <input type="checkbox" className="ml-1" />
                                            سالم
                                        </label>

                                        <label className="flex items-center">
                                            <input type="checkbox" className="ml-1" />
                                            سابقه بیماری
                                        </label>
                                    </div>
                                </div>
                                <div className="px-2 py-1"> سابقه مصرف دارو :</div>
                                <div className="px-2 py-1">سابقه جراحی و بستری :</div>
                            </div>
                            <div className="grid grid-cols-2 border-l border-r  border-gray-400">
                                <div className="px-2 py-1">علت بستری :</div>
                                <div className="py-1">گروه خونی :</div>
                            </div>
                            <div className="grid grid-cols-7 border border-gray-400">
                                <div className="px-2 py-1">قد :</div>
                                <div className="grid grid-cols-2 border-gray-400">
                                    <div className="py-1">وزن :</div>
                                    <div className="py-1">کیلوگرم</div>
                                </div>
                                <div className="px-2 py-1">رنگ چهره :</div>
                                <div className="py-1"> رنگ مو :</div>
                                <div className="py-1">رنگ چشم :</div>
                                <div className="py-1">علامت مشخص بر بدن :</div>
                            </div>

                            <div className="grid grid-cols-4 border border-gray-400">
                                <div className="px-2 py-1"> دین :</div>
                                <div className="py-1">مذهب :</div>
                                <div className="py-1">مرجع تقلید :</div>
                            </div>
                            <div className="grid grid-cols-[2.5fr_2fr_1.5fr_1.5fr_1.5fr] border-r border-l border-gray-400 text-sm">
                                <div className="px-2 py-1">آخرین مدرک تحصیلی :</div>
                                <div className="py-1">رشته تحصیلی :</div>
                                <div className="py-1">گرایش :</div>
                                <div className="py-1">تاریخ فارغ التحصیلی :</div>
                                <div className="py-1 text-center">معدل :</div>
                            </div>

                            <div className="grid grid-cols-2 border-r border-l border-gray-400">
                                <div className="px-2 py-1 text-[13px]"> (حوزوی ، دانشگاهی) </div>

                            </div>

                            <div className="grid grid-cols-3 border-t border-b border-gray-400">
                                <div className="px-2 py-1 border-r border-gray-400"> نوع گذرنامه :</div>
                                <div className="px-2 py-1 border-r border-gray-400">شماره گذرنامه :</div>
                                <div className="px-2 py-1 border-r border-l border-gray-400">تاریخ صدور گذرنامه :</div>
                            </div>

                            <div className="grid grid-cols-[1.5fr_1.5fr_2fr_1fr] border-r border-l border-gray-500">

                                <div className="px-2 py-1 flex items-center gap-0">
                                    <span className="whitespace-nowrap">وضعیت تاهل :</span>

                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center mr-3">
                                            <input type="checkbox" className="ml-1" />
                                            مجرد
                                        </label>

                                        <label className="flex items-center">
                                            <input type="checkbox" className="ml-1" />
                                            متاهل
                                        </label>
                                    </div>
                                </div>
                                <div className="px-2 py-1">تاریخ ازدواج :</div>
                                <div className="px-2 py-1">نام و نام خانوادگی همسر :</div>
                                <div className="px-2 py-1">نام پدر :</div>
                            </div>

                            <div className="grid grid-cols-[1.5fr_1.5fr_1.5fr_1.7fr_0.8fr_1fr] border-r  border-l border-gray-400">
                                <div className="px-2 py-1">تاریخ تولد :</div>
                                <div className="py-1">شماره ملی :</div>
                                <div className="py-1">شماره گذرنامه :</div>
                                <div className="py-1">تاریخ صدور گذرنامه :</div>
                                <div className="py-1">دین :</div>
                                <div className="py-1">مذهب :</div>
                            </div>
                            <div className="grid grid-cols-[2fr_2.4fr_1.5fr_1fr_1fr_1fr] border-r  border-l border-gray-400">
                                <div className="px-2 py-1"> مدرک تحصیلی همسر :</div>
                                <div className="py-1">رشته تحصیلی  :</div>
                                <div className="py-1">گرایش  :</div>
                                <div className="py-1">تابعیت   :</div>
                                <div className="py-1">فعلی :</div>
                                <div className="py-1">قبلی :</div>
                            </div>
                            <div className="grid grid-cols-[0.6fr_2.2fr] border-r border-l  border-gray-400">
                                <div className="px-2 py-1"> شغل همسر : </div>
                                <div className="px-2 py-1"> آدرس محل اشتغال فعلی همسر : </div>
                            </div>
                            <div className="grid grid-cols-3 border-r border-l border-b  border-gray-500">

                                <div className="px-2 py-1 flex items-center gap-5">
                                    <span className="whitespace-nowrap">تعداد فرزندان :</span>

                                    <div className="flex items-center mr-4 ml-2 gap-10">
                                        <label className="flex items-center mr-3">
                                            پسر :
                                        </label>

                                        <label className="flex items-center">
                                            دختر :
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            {modalPerson && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* پس‌زمینه نیمه شفاف */}
                    <div
                        className="absolute inset-0 bg-black opacity-40"
                        onClick={() => setModalPerson(false)}
                    ></div>

                    {/* محتوای مودال */}
                    <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[900px] max-h-[90vh] overflow-y-auto relative">
                        <div className="bg-gray-200 -mx-6 p-1 rounded-t-lg border-b border-gray-300">
                            <h2 className="text-lg font-bold">اصلاح مشخصات</h2>
                        </div>
                        <hr className="mb-3 text-blue-800" />

                        <div className="grid grid-cols-3 gap-x-4 gap-y-3 px-2">
                            {personalFields.map((field) => {
                                const key = field.name as keyof typeof formData;

                                if (field.type === "dropdown" && field.dropdownCode) {
                                    return (
                                        <div key={key} className="flex flex-col">
                                            <GetDFNByPID
                                                PID={field.dropdownCode}
                                                label={field.label}
                                                defaultValue={0}
                                                onSelect={(info: any) =>
                                                    setFormData({
                                                        ...formData,
                                                        [key]: info ? info.Value : 0,
                                                    })
                                                }
                                                error={!!errors[key]}
                                                errorMessage={errors[key]}
                                            />
                                        </div>
                                    );
                                }
                                else if (field.type === "tarikh") {
                                    return (
                                        <div key={key} className="flex flex-col">
                                            <PersianDateInput
                                                label={field.label}
                                                // value={tarikh ?? undefined}
                                                allowPastDates={false}
                                                onChange={(v: any) => {
                                                    setFormData({ ...formData, [key]: v });
                                                }}

                                                error={!!errors[key]}
                                                errorMessage={errors[key]}
                                            />
                                        </div>
                                    );
                                }

                                return (
                                    <FormInput
                                        key={key}
                                        label={field.label}
                                        placeholder={field.placeholder || ""}
                                        icon={Code2Icon}
                                        value={formData[key] as string}
                                        onChange={(e) =>
                                            setFormData({ ...formData, [key]: e.target.value })
                                        }
                                        error={!!errors[key]}
                                        errorMessage={errors[key]}
                                        onlyNumber={field.type === "number"}
                                        maxLength={field.maxLength}
                                    />
                                );
                            })}
                        </div>



                        {/* دکمه‌ها */}
                        <div className="flex justify-end gap-2 mt-5">
                            <button
                                className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded cursor-pointer"
                                onClick={() => setModalPerson(false)}
                            >
                                انصراف
                            </button>
                            <button
                                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded cursor-pointer"
                                onClick={() => handleSubmit()}
                            >
                                تایید
                            </button>
                        </div>
                    </div>
                </div>
            )}



        </>


    );

}

export default FormPerson;
