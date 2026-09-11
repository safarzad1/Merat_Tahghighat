"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetUserPic, UploadUserPic, ChangePassword } from "@/Lib/ApiServiceUsers";
import { KeyRound, Image as ImageIcon, ChevronLeft, Code2Icon, User2, Check, KeyIcon, Mail } from "lucide-react";
import FormInputpassword from '@/component/Objects/FormInputpassword'
import { useRouter } from "next/navigation";

export default function Page() {

  const router = useRouter();
  const user = useSelector((state: RootState) => state.user);
  const [ModalOpenChangePassword, setModalOpenChangePassword] = useState(false);

  const [imgSrc, setImgSrc] = useState("/images/person.png");
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorpassword, seterrorpassword] = useState(false);
  const [errormessagepassword, seterrormessagepassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirmpassword, setconfirmpassword] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const PasswordChange = async (userid: number, password: string, confirmpassword: string) => {
    console.log(password, confirmpassword, userid);
    try {
      if (password == confirmpassword && password.length >= 6) {
        const res = await ChangePassword(password, userid);
        if ((res as any)?.status === 401) {
          router.push("/Login");
          return;
        }
        setModalOpenChangePassword(false);
      }
      else if (password.length < 6) {
        seterrormessagepassword("کلمه عبور باید حدقل 6 رقم باشد");
      }
      else if (password != confirmpassword) {
        seterrormessagepassword("کلمه های عبور متفاوت هستند");
      }
      seterrorpassword(true);

    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function loadPic() {
      const username = String(user?.UserName ?? "").trim();
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
  }, [user?.UserName]);

  async function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("فقط فایل تصویر مجاز است");
      e.target.value = "";
      return;
    }

    try {
      setUploading(true);

      await UploadUserPic(user.UserName, user.UserId, file);

      const localUrl = URL.createObjectURL(file);
      setImgSrc(localUrl);

      // پاک کردن input
      e.target.value = "";
      setOpen(false);
    } catch (err: any) {
      alert(err?.message || "خطا در آپلود تصویر");
    } finally {
      setUploading(false);
    }
  }
  return (
    <div
      className="relative w-full h-20 bg-cover bg-center text-white flex items-center justify-between px-6"
      style={{ backgroundImage: "url('/images/backnav1.png')" }}
    >
      <div className="relative z-10 shrink-0">
        <Image
          src="/titlebaner/White.png"
          alt="لوگو"
          width={500}
          height={500}
          style={{ height: "70px", width: "auto" }}
          className="object-contain"
        />
      </div>

      <span className="relative z-10 text-center">
        <Image
          src="/titlebaner/Merat-03.png"
          alt="لوگو"
          width={500}
          height={500}
          style={{ height: "50px", width: "auto" }}
          className="object-contain"
        />
      </span>

      {/* چپ - باکس کاربر + منو */}
      <div className="relative z-10 shrink-0" ref={menuRef}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className=" text-white px-4 py-2 border-blue-500 rounded shadow-sm transition-colors hover:cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Image
              src={imgSrc}
              alt="پروفایل"
              width={40}
              height={40}
              className="rounded-full border-2 border-white object-cover bg-white"
              unoptimized
              onError={() => setImgSrc("/images/person.png")}
            />

            <span className="font-medium text-white md:text-base">
              {user.FullName || "کاربر"}
            </span>

            <span className="text-[14px] text-white">
              ({user.OnvanSemat || "سمت"})
            </span>

            <span className="text-white/80 text-xs">▾</span>
          </div>
        </button>

        {open && (
          <div className="absolute left-0 mt-2 w-60 rounded-lg border border-gray-200 bg-white text-gray-800 shadow-lg overflow-hidden">
            <button
              type="button"
              className="cursor-pointer w-full text-right mt-2 px-4 py-2 text-sm transition-colors
                 hover:bg-sky-100 hover:text-sky-700 active:bg-sky-300"
              onClick={() => {
                setPassword("");
                setconfirmpassword("");
                setModalOpenChangePassword(true);
                // setOpen(false);
                //  setModalChangePassOpen(true); 1568
              }}
            >
              <div

                className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User2 className="w-4 h-4" />
                  <span>تعییر کلمه عیور</span>
                </div>
                {/* <ChevronLeft className="w-4 h-4 opacity-70" /> */}
              </div>
            </button>

            <div className="h-px bg-gray-100" />

            <button
              type="button"
              className="cursor-pointer w-full text-right px-4 py-3 text-sm transition-colors
                 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100
                 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" />
                  <span>تغییر تصویر پروفایل</span>
                </div>
                {uploading ? (
                  <span className="text-xs text-gray-500">در حال آپلود…</span>
                ) : (
                  <ChevronLeft className="w-4 h-4 opacity-70" />
                )}
              </div>
            </button>

                <button
              type="button"
              className="cursor-pointer w-full text-right px-4 py-3 text-sm transition-colors
                 hover:bg-emerald-50 hover:text-emerald-700 active:bg-emerald-100
                 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => 
              {
                router.push("/ChatRoom");
              }
              }
             
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>پیام رسان</span>
                </div>
               
              </div>
            </button>


            {/* input مخفی فایل */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onPickFile}
            />
          </div>
        )}





      </div>


      {ModalOpenChangePassword && (
        <div className="fixed inset-0 z-1500 flex items-center justify-center">
          {/* پس‌زمینه نیمه شفاف */}
          <div
            className="absolute inset-0 bg-black opacity-40"
          ></div>

          {/* محتوای مودال */}
          <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[500px] relative max-h-[90vh] overflow-y-auto">
            <div className="bg-green-800 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
              <h2 className="text-lg font-bold"> تغییر کلمه عبور  </h2>
            </div>
            <hr className="mb-3 text-blue-800" />

            <div className="grid grid-cols-2 gap-4 mt-2">
              <FormInputpassword
                label="کلمه عبور"
                placeholder="کلمه عبور"
                icon={KeyIcon}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                // error={errorpassword}
                // errorMessage={errorpassword ? "این فیلد نمی‌تواند خالی باشد" : ""}
                onlyNumber={false}
                maxLength={300}
              />
              <FormInputpassword
                label="تکرار کلمه عبور"
                placeholder="تکرار کلمه عبور"
                icon={Code2Icon}
                value={confirmpassword}
                onChange={(e) => setconfirmpassword(e.target.value)}
                error={errorpassword}
                errorMessage={errorpassword ? errormessagepassword : ""}
                onlyNumber={false}
                maxLength={300}
              />
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <button
                onClick={() => {
                  setModalOpenChangePassword(false);
                }

                }
                className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  PasswordChange(user.UserId, password, confirmpassword);
                }
                }
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-2xl cursor-pointer"


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

    </div>
  );
}
