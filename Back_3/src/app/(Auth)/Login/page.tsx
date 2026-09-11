"use client";

import { useDispatch } from "react-redux";
import { login } from "@/redux/userSlice";

import { Login } from '@/Lib/ApiService'
import { useState, useEffect } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { User, Lock } from "lucide-react";
import FormInput from "@/component/Objects/FormInput2";
import CaptchaInput from "@/component/Objects/CapchaInput1";
import { useRouter } from "next/navigation";
import { useClientIp } from "@/component/ClientIp";

export default function LoginPage() {

    const ip = useClientIp("/Api/GetIP");

    const MAX_AGE = 60 * 60 * 3;

    const router = useRouter();
    const dispatch = useDispatch();

    const [num1, setNum1] = useState<number | null>(null);
    const [num2, setNum2] = useState<number | null>(null);

    useEffect(() => {
        setNum1(Math.floor(Math.random() * 10));
        setNum2(Math.floor(Math.random() * 10));
    }, []);

    const generateCaptcha = () => {
        setNum1(Math.floor(Math.random() * 10));
        setNum2(Math.floor(Math.random() * 10));
    };

    const {
        register,
        handleSubmit,
        setError,
        clearErrors,
        formState: { errors },
    } = useForm({
        defaultValues: {
            username: "",
            password: "",
            captcha: "",
        },
    });

    const onSubmit = async (data: any) => {
        if (num1 === null || num2 === null) return;

        const correctAnswer = num1 + num2;

        if (parseInt(data.captcha, 10) !== correctAnswer) {
            setError("captcha", { type: "manual", message: "❌ پاسخ کپچا اشتباه است" });
            generateCaptcha();
            return;
        } else {
            clearErrors("captcha");
        }

        try {
            const result = await Login(data.username, data.password, ip);
            console.log(result);
            // console.log(result.status);

            if (result.status === 200) {
                dispatch(login({
                    UserName: result.data.UserName || result.data.UserName || 0,
                    UserId: result.data.UserId || result.data.UserId || 0,
                    Mahal: result.data.mahal || result.data.Mahal || 0,
                    FullName: result.data.fullName || result.data.FullName || "",
                    PostId: result.data.PostId || result.data.PostId || "",
                    OnvanSemat: result.data.onvanSemat || result.data.NameMahal || "",
                    DateNow: result.data.dateNow || result.data.DateNow || "",
                    IsMarkazShahrestan: result.data.IsMarkazShahrestan || "",
                }));

                router.replace("/TahghighatManage");
            }
            else if (result.status === 201) {
                generateCaptcha();
                setError("password", { type: "server", message: result.message });
            }
            else if (result.status === 500) {
                generateCaptcha();
                setError("username", { type: "server", message: "ارتباط با سرور امکانپذیر نمی باشد" });
            }
            else {
                generateCaptcha();
                setError("username", { type: "server", message: result.message });
            }
        } catch (err) {
            console.error(err);
            setError("username", { type: "server", message: "خطا در اتصال به سرور" });
            generateCaptcha();
        }
    };

    if (num1 === null || num2 === null) return null;

    return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="flex w-4/5 max-w-6xl bg-white/90 rounded-3xl shadow-2xl overflow-hidden">
                <div className="w-1/2 flex flex-col items-center justify-center p-10 bg-white">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/images/LogoMerat.png"
                            alt="لوگوی سامانه مرآت"
                            width={120}
                            height={120}
                            className="object-contain"
                            priority
                        />
                    </div>

                    <span className="block text-center mb-6 IranNastaliq text-[45px] text-purple-800">
                        سامانه مرآت
                    </span>

                    <form
                        onSubmit={handleSubmit(onSubmit)}
                        className="space-y-4 w-full flex flex-col items-center px-10"
                    >
                        <FormInput
                            label="شماره ملی"
                            placeholder="شماره ملی خود را وارد کنید"
                            icon={User}
                            maxLength={10}
                            register={register("username", { required: "شماره ملی الزامی است" })}
                            error={!!errors.username}
                            errorMessage={errors.username?.message?.toString()}
                        />

                        <FormInput
                            label="رمز عبور"
                            placeholder="رمز عبور خود را وارد کنید"
                            icon={Lock}
                            type="password"
                            register={register("password", { required: "رمز عبور الزامی است" })}
                            error={!!errors.password}
                            errorMessage={errors.password?.message?.toString()}
                        />

                        <CaptchaInput
                            label="کد امنیتی"
                            num1={num1}
                            num2={num2}
                            maxLength={2}
                            register={register("captcha", { required: "کد امنیتی الزامی است" })}
                            error={!!errors.captcha}
                            errorMessage={errors.captcha?.message?.toString()}
                        />

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white rounded-full py-2 mt-1 hover:bg-indigo-700 transition font-medium"
                        >
                            ورود
                        </button>

                        <div className="pt-2 w-full border-t border-slate-300 text-center text-slate-600 text-sm">
                            <p>تلفن پشتیبانی (۱): 22455</p>
                            <p>تلفن پشتیبانی (۲): 22350</p>
                        </div>
                    </form>
                </div>

                <div className="w-1/2 relative bg-purple-200 m-2 rounded-l-3xl overflow-hidden">
                    <Image
                        src="/images/pic-input.jpg"
                        alt="login image"
                        fill
                        className="object-cover"
                        priority
                    />
                </div>
            </div>
        </div>
    );
}
