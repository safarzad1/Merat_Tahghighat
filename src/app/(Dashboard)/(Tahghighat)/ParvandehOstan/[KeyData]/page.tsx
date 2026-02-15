"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { decryptText } from "@/Lib/cryptoUtil";
import Breadcrumbkhabar from '@/component/Breadcrumb/Breadcrumb'
import { Home, Newspaper, CardSimIcon, PlusCircle, Check, Send, User, Download } from "lucide-react";
import { AlertTriangle } from "lucide-react";
import DescriptionWithModal from '../../Componnet/DescriptionWithModal';
import { GetFileNamePic } from '@/Lib/ApiServiceNameha'
import ErjaHozeh from '../../Componnet/ErjaHozeh'
import ErjaOstan from '../../Componnet/ErjaOstan'
import EjraBeMohaghegh from '../../Componnet/EjraBeMohaghegh'
import ErjaMohaghegh from '../../Componnet/ErjaMohaghegh'
import { useConfirm } from "@/Utils/ConfirmModalContext";
import InputUserDropdown from '@/component/Objects/DropDownCitys'
import PersianDateInput from '@/component/Objects/InputPersianDatePicker'
import { useRouter } from "next/navigation";
import { ErjaBeMohaghegh } from '@/Lib/ApiService';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetTahghighByID } from '@/Lib/ApiService'
import {
  InsertJambandiOstan, GetJambandiOstanPeyvast, GetErjaByID, Update_ErjaParvandeh
  , GetParvandehShorayeTahghighByID, DeleteParvandehShorayeTahghighByID
} from "@/Lib/ApiService";
import { InsertTahghigh } from "@/Lib/ApiServiceShorayeTahghigh";
import RichTextEditor from '@/component/Tiptap'
import domtoimage from 'dom-to-image';
import ShowTahghigh from '../ShowPeyvastTahghighat'
import TextArea1 from '@/component/Objects/Textarea1'
import { useAlert } from "@/component/AlertContext";
import { AddKarbargTahghighDavtalab, GetKarbargDavtalabByShomareh } from '@/Lib/ApiServiceShorayeTahghigh'
import { v4 as uuidv4 } from "uuid";
import { showToast } from "@/component/CustomToast";
import { motion, AnimatePresence } from "framer-motion";
import { InsertFile } from '@/Lib/ApiServiceNameha';

type JambandiFile = {
  file: File;
  fileExtend: string;
  url: string;
  fileSize: string;
  FileName: string;
  FileNameGUID: String;
  isServer: boolean;
};

const isImageExt = (ext?: string) => {
  const e = (ext || "").toLowerCase();
  return ["png", "jpg", "jpeg", "webp", "gif", "bmp", "svg"].includes(e);
};


export default function ParvandehPage() {

  const [showControls, setShowControls] = useState(false);

  const { showAlert } = useAlert();
  const [NameOstan, setNameOstan] = useState<string>("");
  const [NameHozeh, setNameHozeh] = useState<string>("");
  const [FileName, setFileName] = useState("");
  const [selected1, setSelected1] = useState<number | null>(-1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [jambandiFiles, setJambandiFiles] = useState<JambandiFile[]>([]);
  const [Pasokh1, setPasokh1] = useState<string>("");
  const [Pasokh2, setPasokh2] = useState<string>("");
  const [Pasokh3, setPasokh3] = useState<string>("");
  const [Pasokh4, setPasokh4] = useState<string>("");
  const [Pasokh5, setPasokh5] = useState<string>("");
  const [Pasokh6, setPasokh6] = useState<string>("");
  const [Pasokh7, setPasokh7] = useState<string>("");
  const [Pasokh8, setPasokh8] = useState<string>("");
  const [codeMohaghegh, setcodeMohaghegh] = useState(0);
  const [CreateDateTime, setCreateDateTime] = useState<string | null>(null);
  const [CountExtraPeyvast, setCountExtraPeyvast] = useState(0);
  const [errorPasokh1, seterrorPasokh1] = useState<string>("");
  const [errorPasokh2, seterrorPasokh2] = useState<string>("");
  const [errorPasokh3, seterrorPasokh3] = useState<string>("");
  const [errorPasokh4, seterrorPasokh4] = useState<string>("");
  const [errorPasokh5, seterrorPasokh5] = useState<string>("");
  const [errorPasokh6, seterrorPasokh6] = useState<string>("");
  const [errorPasokh7, seterrorPasokh7] = useState<string>("");
  const [errorPasokh8, seterrorPasokh8] = useState<string>("");
  const [errorjambandiOsatn, seterrorjambandiOsatn] = useState<string>("");
  const [errortozihat, setErrortozihat] = useState(false);

  const [selected2, setSelected2] = useState<number | null>(-1);
  const [selected3, setSelected3] = useState<number | null>(-1);
  const [selected4, setSelected4] = useState<number | null>(-1);
  const [selected5, setSelected5] = useState<number | null>(-1);
  const [selected6, setSelected6] = useState<number | null>(-1);
  const [selected7, setSelected7] = useState<number | null>(-1);
  const [JambandiOstan, setJambandiOstan] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImg, setPreviewImg] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");

  const [ModalOpenAdamNeyazBeTahghigh, setModalOpenAdamNeyazBeTahghigh] = useState(false);
  const [ModalOpenKargroupMosahebe, setModalOpenKargroupMosahebe] = useState(false);
  const [ModalOpenErjabeOstanBedonTahghigh, setModalOpenErjabeOstanBedonTahghigh] = useState(false);


  type ShorayeTahghighItem = {
    FullNamePerson?: string;
    RecordState?: number;
    CreateDateTime?: string;
  };

  const [shoraItems, setShoraItems] = useState<ShorayeTahghighItem[]>([]);
  const [shoraLoading, setShoraLoading] = useState(false);
  const [shoraError, setShoraError] = useState<string>("");

  const recordStateLabel = (s?: number) => {
    switch (s) {
      case 1:
        return "بدون اقدام";
      case 2:
        return "پایان";
      case 3:
        return "برگشت";
      default:
        return "نامشخص";
    }
  };

  const formatDT = (dt?: string) => {
    if (!dt) return "—";
    // اگر فرمت مثل 2026-02-15T10:20:30 باشد:
    // نمایش: 2026-02-15 10:20
    const t = dt.replace("T", " ");
    return t.length >= 16 ? t.substring(0, 16) : t;
  };



  const [zoom, setZoom] = useState(1); // 1 تا 6
  const [offset, setOffset] = useState({ x: 0, y: 0 }); // قبل از scale (world units)


  const viewerRef = useRef<HTMLDivElement | null>(null);
  const panRef = useRef({ startX: 0, startY: 0, startOx: 0, startOy: 0, panning: false });

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

  const resetZoomPan = () => {
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  };

  const handleWheelZoom = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!viewerRef.current) return;

    const rect = viewerRef.current.getBoundingClientRect();
    const px = e.clientX - rect.left; // موقعیت موس داخل باکس
    const py = e.clientY - rect.top;

    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    const nextZoom = clamp(zoom * factor, 1, 6);

    if (nextZoom === 1) {
      setZoom(1);
      setOffset({ x: 0, y: 0 });
      return;
    }

    setOffset({
      x: offset.x + px * (1 / nextZoom - 1 / zoom),
      y: offset.y + py * (1 / nextZoom - 1 / zoom),
    });

    setZoom(nextZoom);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= 1) return; // وقتی زوم نیست، درگ لازم نیست

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);

    panRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startOx: offset.x,
      startOy: offset.y,
      panning: true,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!panRef.current.panning) return;

    const dx = e.clientX - panRef.current.startX;
    const dy = e.clientY - panRef.current.startY;

    setOffset({
      x: panRef.current.startOx + dx / zoom,
      y: panRef.current.startOy + dy / zoom,
    });
  };

  const handlePointerUp = () => {
    panRef.current.panning = false;
  };


  const items1 = [
    "معتقد و ملتزم",
    "غیرعامل و در تقابل",
    "کاهل و دارای رفتار و مواضع دوگانه",
    "بی تفاوت",
    "نامشخص"
  ];
  const items2 = [
    "عامل و ملتزم",
    "غیرعامل و در تقابل",
    "کاهل و دارای رفتار و مواضع دوگانه",
    "بی تفاوت",
    "نامشخص"
  ];

  const items3 = [
    "مدافع و همسو با نظام",
    "مخالف و در تقابل",
    "رفتار و مواضع دوگانه",
    "بی تفاوت",
    "نامشخص"
  ];

  const items4 = [
    "مدافع و پایبند",
    "مخالف و در تقابل",
    "رفتار و مواضع دوگانه",
    "بی تفاوت",
    "نامشخص"
  ];

  const items5 = [
    "معتقد و ملتزم",
    "غیر عامل و در تقابل",
    "رفتار و مواضع دوگانه",
    "بی تفاوت",
    "نامشخص"
  ];

  const items6 = [
    "عامل و ملتزم به مسائل شرعی و قانونی",
    "غیر عامل و در تقابل با مسائل شرعی و قانونی",
    "رفتار و مواضع دوگانه",
    "بی تفاوت",
    "نامشخص"
  ];

  const items7 = [
    "عامل و ملتزم",
    "غیرعامل و در تقابل",
    "رفتار و مواضع دوگانه",
    "بی تفاوت",
    "نامشخص"
  ];

  const { showConfirm } = useConfirm();
  const [erjaId, setErjaId] = useState(0);
  const [CityMarkaz, setCityMarkaz] = useState<number | null>(null);
  const [CodeMohaghegh, setCodeMohaghegh] = useState<number | null>(null);
  const [tarikh, settarikh] = useState<string | null>(null);

  const [tozihat, setTozihat] = useState("");
  const [ModalOpenErjaBeHozeh, setModalOpenErjaBeHozeh] = useState(false);
  const [ModalOpenErjaBeOstan, setModalOpenErjaBeOstan] = useState(false);
  const [ModalOpenErjaBeMohaghegh, setModalOpenErjaBeMohaghegh] = useState(false);
  const [ModalOpenErjaBeShorayeTahghigh, setModalModalOpenErjaBeShorayeTahghigh] = useState(false);

  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);
  const [isOpen3, setIsOpen3] = useState(false);
  const router = useRouter();
  const params = useParams();

  const [onvanparvandeh, setonvanparvandeh] = useState<string>("");
  const [SoalatParvandeh, setSoalatParvandeh] = useState<string>("");
  const [PasokhParvandeh, setPasokhParvandeh] = useState<string>("");
  const [Manabe1, setManabe1] = useState<string>("");
  const [Manabe2, setManabe2] = useState<string>("");
  const [Manabe3, setManabe3] = useState<string>("");
  const [Manabe4, setManabe4] = useState<string>("");
  const [Manabe5, setManabe5] = useState<string>("");
  const [Manabe6, setManabe6] = useState<string>("");
  const [TozihatMohaghegh, setTozihatMohaghegh] = useState<string>("");
  const [PeyvastDavtalab, setPeyvastDavtalab] = useState<string>("");

  const [data, setData] = useState<any[]>([]);
  const [refreshKeyErjaShahrestan, setrefreshKeyErjaShahrestan] = useState(0);
  const [refreshKeyErjaMohaghegh, setrefreshKeyErjaMohaghegh] = useState(0);
  const [errorMohaghegh, setErrorMohaghegh] = useState<boolean>(false);
  const [errorTarikh, seterrorTarikh] = useState<boolean>(false);

  const [modalJambandi, setModalJambandi] = useState(false);
  const [Jambandi, setJambandi] = useState("");

  const [UserId, SetUserId] = useState(0);

  const user = useSelector((state: RootState) => state.user);

  const [ModalOpenCreateForm, setModalOpenCreateForm] = useState(false);


  const ResultTo = async (erjaid: number, stateerja: number, sharheghdam: string) => {
    const result = await Update_ErjaParvandeh(erjaid, true, stateerja, sharheghdam, user.UserId);
    if (result.state == 401) {
      router.push("/Login");
    }
    else {
      setModalOpenAdamNeyazBeTahghigh(false);
      router.refresh();
    }

    // if (result. > 0) {
    // setDavtalab(result.data[0]);
    // setModalOpenCreateForm(true);
    // }

  }

  useEffect(() => {
    const loadJambandiFiles = async () => {
      try {
        const result = await GetJambandiOstanPeyvast(erjaId);
        const filesArray: JambandiFile[] = Array.isArray(result) ? result : (result.data ?? []);
        const mapped: JambandiFile[] = filesArray.map(f => ({
          file: null as unknown as File,
          fileExtend: f.FileName.split('.').pop() || '',
          url: `/uploads/${f.FileName}`,
          fileSize: '',
          FileName: f.FileName,
          FileNameGUID: uuidv4() + ".png",
          isServer: true
        }));
        setJambandiFiles(mapped);
      } catch (err) {
        console.error("خطا در بارگذاری فایل‌های جمعبندی:", err);
      }
    };

    loadJambandiFiles();
  }, [erjaId]);

  const dataUrlToFile = async (dataUrl: string, fileName: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], fileName, { type: blob.type || "image/png" });
  };

  const exportNodeToPNGFile = async (nodeId: string, fileName: string) => {
    const node = document.getElementById(nodeId);
    if (!node) {
      console.error(`❌ عنصر با id="${nodeId}" پیدا نشد`);
      return null;
    }

    const scale = 2;
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

    const file = await dataUrlToFile(dataUrl, fileName);

    const previewUrl = URL.createObjectURL(file);

    return { file, previewUrl };
  };

  const SaveKarbargTajmiOstan = async () => {

    if (selected1 == -1) {
      showToast.error("پاسخ گزینه شماره 1 را انتخاب نمایید", "عزیز دل برادر");
    }
    else if (!Pasokh1) {
      showToast.error("پاسخ سوال شماره 1 را وارد نمایید", "عزیز دل برادر");
    }
    else if (selected2 == -1) {
      showToast.error("پاسخ گزینه شماره 2 را انتخاب نمایید", "عزیز دل برادر");
    }
    else if (!Pasokh2) {
      showToast.error("پاسخ سوال شماره 2 را وارد نمایید", "عزیز دل برادر");
    }
    else if (selected3 == -1) {
      showToast.error("پاسخ گزینه شماره 3 را انتخاب نمایید", "عزیز دل برادر");
    }
    else if (!Pasokh3) {
      showToast.error("پاسخ سوال شماره 3 را وارد نمایید", "عزیز دل برادر");
    }
    else if (selected4 == -1) {
      showToast.error("پاسخ گزینه شماره 4 را انتخاب نمایید", "عزیز دل برادر");
    }
    else if (!Pasokh4) {
      showToast.error("پاسخ سوال شماره 4 را وارد نمایید", "عزیز دل برادر");
    }
    else if (selected5 == -1) {
      showToast.error("پاسخ گزینه شماره 5 را انتخاب نمایید", "عزیز دل برادر");
    }
    else if (!Pasokh5) {
      showToast.error("پاسخ سوال شماره 5 را وارد نمایید", "عزیز دل برادر");
    }
    else if (selected6 == -1) {
      showToast.error("پاسخ گزینه شماره 6 را انتخاب نمایید", "عزیز دل برادر");
    }
    else if (!Pasokh6) {
      showToast.error("پاسخ سوال شماره 6 را وارد نمایید", "عزیز دل برادر");
    }
    else if (selected7 == -1) {
      showToast.error("پاسخ گزینه شماره 7 را انتخاب نمایید", "عزیز دل برادر");
    }
    else if (!Pasokh7) {
      showToast.error("پاسخ سوال شماره 7 را وارد نمایید", "عزیز دل برادر");
    }
    else if (!Pasokh8) {
      showToast.error("پاسخ سوال شماره 8 را وارد نمایید", "عزیز دل برادر");
    }

    else {

      try {
        const f1 = await exportNodeToPNGFile("div_image_page1", "page1.png");
        if (!f1) return;

        const f2 = await exportNodeToPNGFile("div_image_page2", "page2.png");
        if (!f2) return;

        const file1: JambandiFile = {
          file: f1.file,
          url: f1.previewUrl,
          fileExtend: "png",
          fileSize: (f1.file.size / 1024 / 1024).toFixed(2),
          FileName: f1.file.name,
          FileNameGUID: uuidv4() + ".png",
          isServer: false,
        };

        const file2: JambandiFile = {
          file: f2.file,
          url: f2.previewUrl,
          fileExtend: "png",
          fileSize: (f2.file.size / 1024 / 1024).toFixed(2),
          FileName: f2.file.name,
          FileNameGUID: uuidv4() + ".png",
          isServer: false,
        };

        const newFiles = [file1, file2];

        setJambandiFiles((prev) => {
          prev.forEach((p) => {
            if (!p.isServer && p.url) URL.revokeObjectURL(p.url);
          });
          return newFiles;
        });


        const result = await InsertJambandiOstan(erjaId, Pasokh1, Pasokh2
          , Pasokh3, Pasokh4, Pasokh5, Pasokh6, Pasokh7, Pasokh8, selected1
          , selected2, selected3, selected4, selected5, selected6, selected7
          , Jambandi, newFiles[0].FileNameGUID, newFiles[1].FileNameGUID
          , user.UserId
          // , f1.file, f2.file,
        );
        console.log(newFiles[0].FileNameGUID);
        console.log(newFiles[1].FileNameGUID);

        const resultfile1 = await InsertFile(newFiles[0].FileNameGUID, user.UserId, f1.file);
        const resultfile2 = await InsertFile(newFiles[1].FileNameGUID, user.UserId, f2.file);

        const resultDone = await Update_ErjaParvandeh(erjaId, true, 2, Jambandi, user.UserId);
        if (resultDone.status == 200) {

          router.refresh();
          setModalOpenCreateForm(false);
        }

      } catch (err) {
        console.error("❌ خطا:", err);
        alert("❌ خطا در تولید یا ارسال فایل");
      }
    }
  };

  const SaveKarbargMosaheghe = async () => {

    const safeManabe1 = (Manabe1 === undefined || Manabe1 === null) ? "" : Manabe1;
    console.log(Manabe1);
    setManabe1(safeManabe1 || "");
    if (Manabe2 === "undefined" || Manabe1 === null)
      setManabe2("");
    if (Manabe3 === "undefined" || Manabe1 === null)
      setManabe3("");
    if (Manabe4 === "undefined" || Manabe1 === null)
      setManabe4("");
    if (Manabe5 === "undefined" || Manabe1 === null)
      setManabe5("");
    if (Manabe6 === "undefined" || Manabe1 === null)
      setManabe6("");


    if (!SoalatParvandeh.trim() && SoalatParvandeh.length < 10) {
      showToast.error("سوالی ثبت نشده است", "عزیز دل برادر");
    }
    else if (!PasokhParvandeh.trim() && PasokhParvandeh.length < 10) {
      showToast.error("پاسخی ثبت نشده است", "عزیز دل برادر");
    }
    else if (!TozihatMohaghegh.trim() && TozihatMohaghegh.length < 10) {
      showToast.error("توضیحات محقق ثبت نشده است", "عزیز دل برادر");
    }
    else {

      try {
        const f1 = await exportNodeToPNGFile("div_image_page3", "page1.png");
        if (!f1) return;
        const guidName = uuidv4() + ".png";

        await AddKarbargTahghighDavtalab(data[0].ShomarehParvandeh, 31210,
          1, guidName, SoalatParvandeh, PasokhParvandeh, Manabe1, Manabe2, Manabe3, Manabe4,
          Manabe5, Manabe6, TozihatMohaghegh, PeyvastDavtalab, CodeMohaghegh,
          "", user.UserId, f1.file
        );
        showToast.success("عملیات با موفقیت انجام شد.", "ثبت کاربرگ مصاحبه");

        setModalOpenKargroupMosahebe(false);



      }
      catch (err) {
        console.error("❌ خطا:", err);
        alert("❌ خطا در تولید یا ارسال فایل");
      }
    }

  }

  const LoadOneKarbargMosahebe = async () => {

    setSoalatParvandeh("");
    setPasokhParvandeh("");
    setManabe1("");
    setManabe2("");
    setManabe3("");
    setManabe4("");
    setManabe5("");
    setManabe6("");
    setTozihatMohaghegh("");
    setPeyvastDavtalab("");

    const result = await GetKarbargDavtalabByShomareh(data[0].ShomarehParvandeh, 31210, user.UserId);
    if (result.data) {
      if (result.data && result.data.length > 0) {
        setSoalatParvandeh(result.data[0].Soalat);
        setPasokhParvandeh(result.data[0].Pasokh);
        setManabe1(result.data[0].Manabe1);
        setManabe2(result.data[0].Manabe2);
        setManabe3(result.data[0].Manabe3);
        setManabe4(result.data[0].Manabe4);
        setManabe5(result.data[0].Manabe5);
        setManabe6(result.data[0].Manabe6);
        setTozihatMohaghegh(result.data[0].TozihatMohaghegh);
        setPeyvastDavtalab(result.data[0].PeyvastDavtalab);
      }
    }
    setModalOpenKargroupMosahebe(true);
  }

  const deleteShoraItem = async () => {
    try {
      // اگر ConfirmModal داری (که داری)
      showConfirm(
        "آیا از حذف ارجاع شورای تحقیق (بدون اقدام) مطمئن هستید؟",
        async () => {
          const res = await DeleteParvandehShorayeTahghighByID(erjaId, user.UserId);

          // اگر API شما status می‌دهد:
          if ((res as any)?.status === 200 || (res as any)?.data?.status === 200) {
            showToast.success("حذف با موفقیت انجام شد", "شورای تحقیق");
          } else {
            // اگر ساختار خروجی فرق دارد، اینجا را مطابق API خودت تنظیم کن
            showToast.success("حذف انجام شد", "شورای تحقیق");
          }

          // رفرش دیتا
          await loadData(erjaId);
          router.refresh();
        },
        "هشدار!",
        "warning"
      );
    } catch (e) {
      console.error(e);
      showToast.error("خطا در حذف اطلاعات شورای تحقیق", "خطا");
    }
  };


  const UpdateJambandiOstan = async (
    erjaId: number,
    JambandiEghdam: string,
    userid: number,
    validFiles: JambandiFile[]
  ) => {
    try {
      const filesToUpload = validFiles.filter(f => f.file);

      if (filesToUpload.length > 0) {
        const formData = new FormData();
        filesToUpload.forEach(file => formData.append("files", file.file!));

        const res = await fetch("/Api/UploadFiles", {
          method: "POST",
          body: formData,
        });

        const uploadResult: { status: number; files?: string[]; error?: string } = await res.json();

        if (uploadResult.status === 200 && uploadResult.files) {
          for (let i = 0; i < uploadResult.files.length; i++) {
            const originalFile = filesToUpload[i];
            if (!originalFile) continue;
          }

        } else if (uploadResult.error) {
          console.error("Upload failed:", uploadResult.error);
        }
      }

      const result = await Update_ErjaParvandeh(erjaId, true, 2, JambandiEghdam, userid);
      if (result.status == 200) {

        router.refresh();
        setModalOpenCreateForm(false);
      }

    } catch (err) {
      console.error("خطا در انجام فرآیند:", err);
    }
  };


  const PeyvastBoxRef = useRef<HTMLDivElement | null>(null);
  const SoalatBoxRef = useRef<HTMLDivElement | null>(null);
  const PasokhBoxRef = useRef<HTMLDivElement | null>(null);
  const Manabe1JadidBoxRef = useRef<HTMLDivElement | null>(null);
  const Manabe2JadidBoxRef = useRef<HTMLDivElement | null>(null);
  const Manabe3JadidBoxRef = useRef<HTMLDivElement | null>(null);
  const Manabe4JadidBoxRef = useRef<HTMLDivElement | null>(null);
  const Manabe5JadidBoxRef = useRef<HTMLDivElement | null>(null);
  const Manabe6JadidBoxRef = useRef<HTMLDivElement | null>(null);
  const TozhatMohagheghBoxRef = useRef<HTMLDivElement | null>(null);
  const jambandiBoxRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    if (!jambandiBoxRef.current) return;
    const html = JambandiOstan || "";
    if (jambandiBoxRef.current.innerHTML !== html) {
      jambandiBoxRef.current.innerHTML = html;
    }
  }, [JambandiOstan]);

  interface DavtalabData {
    FirstName?: string;
    LastName?: string;
    NameMostar?: string;
    NamePedar?: string;
    SalTavalod?: string;
    CodeMelli?: string;
    DinMazhab_NameFarsi?: string;
    Shoghl?: string;
    Tahsilat?: string;
    Sabeghe?: string;
    CountKarbarg?: number;
    CountKarbarg_Type1?: number;
    CountKarbarg_Type2?: number;
    CountKarbarg_Type3?: number;
    CountPeyvast?: number;
    TahghighType1?: number;
    TahghighType2?: number;
    TahghighType3?: number;
  }

  const [Davtalab, setDavtalab] = useState<DavtalabData | null>(null);

  const LoadOneErja = async (ErjaId: number) => {

    const result = await GetErjaByID(ErjaId);

    if (result.data.length > 0) {
      setNameHozeh(result.data[0].NameHozeh)
      setNameOstan(result.data[0].NameOstan)
      setDavtalab(result.data[0]);
      //setModalOpenCreateForm(true);
    }

  }
  useEffect(() => {
    if (ModalOpenCreateForm || ModalOpenKargroupMosahebe) {
      LoadOneErja(erjaId ?? "");
    }
  }, [ModalOpenCreateForm, ModalOpenKargroupMosahebe]);

  const ReferToTeam = async () => {
    setModalModalOpenErjaBeShorayeTahghigh(true);
  }

  const saveErjaBeShorayeTahghigh = async (erjaid: number, description: string, expireDate: string, userid: number, createUserId: number) => {
    const result = await InsertTahghigh(erjaid, description, expireDate, userid, createUserId);
    setModalModalOpenErjaBeShorayeTahghigh(false);
  }

  const UpdateJambandi = async (erjaid: number, isdone: boolean, JambandiEghdam: string, userid: number) => {

    const result = await Update_ErjaParvandeh(erjaid, isdone, 2, JambandiEghdam, userid);
    setModalJambandi(false);
    loadData(erjaid);

  }

  useEffect(() => {
    setErjaId(erjaId);
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

      } catch (err) {
        console.error("❌ خطا در رمزگشایی شناسه:", err);
      }
    }
  }, [params, user]);


  const loadData = async (erjaid: number) => {
    try {
      setShoraLoading(true);
      setShoraError("");

      const [result, shoraRes] = await Promise.all([
        GetTahghighByID(erjaid, 0, 0),
        GetParvandehShorayeTahghighByID(erjaid),
      ]);

      // --- خروجی شورای تحقیق ---
      try {
        // حالت‌های مختلف برگشتی (گاهی .data، گاهی خود آرایه)
        const rows: ShorayeTahghighItem[] =
          Array.isArray((shoraRes as any)?.data)
            ? (shoraRes as any).data
            : Array.isArray(shoraRes as any)
              ? (shoraRes as any)
              : [];

        setShoraItems(rows || []);
      } catch (e) {
        setShoraItems([]);
      } finally {
        setShoraLoading(false);
      }

      // --- منطق قبلی شما بدون تغییر ---
      if (result.status == 200) {
        setFileName(result.data[0].FileName);
        setonvanparvandeh(
          "پرونده " +
          result.data[0].FirstName +
          " " +
          result.data[0].LastName +
          " " +
          " حوزه  " +
          result.data[0].NameOstan +
          " - " +
          result.data[0].NameHozeh
        );

        setData(result.data || []);
        setData((prev) => {
          const newData = [...prev];
          newData[0].CountKolErja = newData[0].CountKolErja;
          newData[0].CountKolErjaDone = newData[0].CountKolErjaDone;
          newData[0].CountErjaMohaghegh = newData[0].CountErjaMohaghegh;
          newData[0].CountErjaMohagheghDone = newData[0].CountErjaMohagheghDone;
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
      setShoraItems([]);
      setShoraLoading(false);
      setShoraError("خطا در دریافت اطلاعات شورای تحقیق");
    }
  };


  const saveErjaMohaghegh = async (isInsert: number) => {

    if (!CodeMohaghegh || CodeMohaghegh === 0) {
      setErrorMohaghegh(true);
      return;
    }

    if (!tarikh) {
      seterrorTarikh(true);
      return;
    }

    seterrorTarikh(false);
    setErrorMohaghegh(false);

    const result = await ErjaBeMohaghegh(erjaId, erjaId, CodeMohaghegh, tarikh, tozihat, UserId, isInsert);

    if (result.data[0].InSuccess == true) {
      setModalOpenErjaBeMohaghegh(false);
      setrefreshKeyErjaMohaghegh(prev => prev + 1);
      setCodeMohaghegh(0);
      settarikh("");
      loadData(erjaId);

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
        setModalOpenErjaBeOstan(false);
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

  const downloadfilenameh = async () => {
    if (!FileName || FileName.trim() === "") {
      showAlert({
        type: "error",
        title: "خطا",
        description: "برای این داوطلب کاربرگی تولید نشده است",
      });
      return;
    }

    try {
      const result = await GetFileNamePic(FileName, 2);

      if (!result || !(result instanceof Blob)) {
        showAlert({
          type: "error",
          title: "عملیات ناموفق",
          description: "فایل کاربرگ جهت دانلود وجود ندارد",
        });
        return;
      }

      const url = window.URL.createObjectURL(result);
      const link = document.createElement("a");
      link.href = url;
      link.download = FileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error("خطا در دانلود فایل:", error);
      showAlert({
        type: "error",
        title: "خطا",
        description: "خطا در ارتباط با سرور",
      });
    }
  }

  return (
    <>
      <div className="bg-sky-200 rounded py-2 px-10">
        <Breadcrumbkhabar
          items={[
            { label: "داشبورد", href: "/Dashboard", icon: <Home className="w-4 h-4" /> },
            { label: "فهرست اشخاص", href: "/Davtalab/CardDavtalab", icon: <User className="w-4 h-4" /> },
            { label: "مدیریت تحقیقات", href: "/TahghighatManage", icon: <Newspaper className="w-4 h-4" /> },
            { label: onvanparvandeh, icon: <CardSimIcon className="w-4 h-4" /> },
          ]}
        />
      </div>

      <div className="bg-white m-1 py-2 px-2 flex flex-col md:flex-row gap-4 rounded-b-xl">
        <div className="bg-white rounded-b-xl shadow w-full flex flex-col gap-2">

          {data.length > 0 && (
            <div className={`h-12 p-2 rounded-lg shadow w-full items-center gap-4"
              ${data[0].IsDone === true ? "bg-green-100" : "bg-gray-200"}
                           `}
            >
              <div className="flex gap-5 whitespace-nowrap items-center justify-between">
                <div className="flex gap-2 order-last">
                  {data[0].IsDone === false && data[0].CountErja === 0 && data[0].MahalSender == 1 && (
                    <>
                      <button
                        onClick={() => {
                          setTozihat("");
                          setModalOpenAdamNeyazBeTahghigh(true);
                        }}
                        className="flex items-center gap-1 p-1 px-4 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition-colors text-sm cursor-pointer">
                        <PlusCircle className="w-4 h-4" />
                        عدم نیاز به تحقیق
                      </button>

                      <button
                        onClick={() => {
                          LoadOneKarbargMosahebe();
                        }}
                        className="flex items-center gap-1 p-1 px-4 bg-emerald-600 text-white rounded shadow hover:bg-emerald-800 transition-colors text-sm cursor-pointer">
                        <PlusCircle className="w-4 h-4" />
                        تحقیق از داوطلب
                      </button>
                    </>
                  )}

                  {data[0].IsDone === false && data[0].CountKolErja === 0 && data[0].MahalSender != 1 && (
                    <>
                      <button
                        onClick={() => {
                          setModalOpenAdamNeyazBeTahghigh(true);
                        }}
                        className="flex items-center gap-1 p-1 px-4 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition-colors text-sm cursor-pointer">
                        <PlusCircle className="w-4 h-4" />
                        بازگشت به استان درخواست کننده (بدون تحقیق)
                      </button>

                    </>
                  )}

                  {data[0].IsDone == false && data[0].CountKolErja > 0 &&
                    data[0].CountKolErja === data[0].CountKolErjaDone ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          // LoadJambandi();
                          setModalOpenCreateForm(true);
                        }}
                        className="flex items-center gap-1 p-2 px-4 bg-green-800 text-white rounded-2xl shadow hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        تایید تحقیقات
                        [ {data[0].CountKolErja} / {data[0].CountKolErjaDone} ]
                      </button>

                      <button
                        onClick={() => ReferToTeam()} // تابع دلخواه خودتان
                        className="flex items-center gap-1 p-2 px-4 bg-green-800 text-white rounded-2xl shadow hover:bg-green-700 transition-colors cursor-pointer"
                      >
                        <Send className="w-4 h-4" />
                        ارجاع به شورای تحقیق
                      </button>
                    </div>


                  ) :

                    (
                      <button
                        // onClick={() => LoadJambandi(data[0].TahghighId??"")}
                        className="flex items-center gap-1 p-1 px-4 bg-gray-200 text-gray-500 rounded shadow transition-colors"
                      >
                        <PlusCircle className="w-4 h-4" />
                        تایید تحقیقات
                        [ {data[0].CountKolErja} / {data[0].CountKolErjaDone} ]
                      </button>
                    )}

                </div>

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
                    <span className="font-semibold text-blue-600 text-[13px]">تاریخ ارجاع :</span>
                    <span className="text-gray-700 text-[14px] mr-2">{data[0].CreateDateTime.substring(0, 10)}</span>
                  </p>
                </div>
              </div>



            </div>
          )}

          {/* ارجاع به حوزه انتخابیه */}
          {data.length > 0 && (
            <div className="mx-5 border rounded-xl shadow-sm bg-slate-100">
              {/* سربرگ پنل */}
              <div className="flex items-center justify-between p-3 select-none hover:bg-gray-100 hover:rounded-xl transition-colors">
                {/* سمت راست: عنوان و شمارنده‌ها */}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-purple-600 w-5 h-5" />
                  <h2
                    onClick={() => setIsOpen1(!isOpen1)}
                    className="cursor-pointer Roya text-[18px] text-purple-800 font-semibold flex items-center gap-2"
                  >
                    ارجاع به حوزه انتخابیه
                    <span className="bg-gray-400 text-white rounded-full w-7 h-7 flex items-center justify-center">
                      {data[0].CountErjaShahrestan || 0}
                    </span>
                    <span className="bg-green-700 text-white rounded-full w-7 h-7 flex items-center justify-center">
                      {data[0].CountErjaShahrestanDone || 0}
                    </span>
                  </h2>
                </div>

                {/* سمت چپ: دکمه‌ها */}
                {data[0].IsDone === false && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {

                        setModalOpenErjaBeHozeh(true)
                        setTozihat("");
                      }
                      }
                      className="flex items-center gap-1 p-1 px-4 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors text-sm cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      ارجاع به حوزه انتخابیه
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
                    typeLevel="ostan"
                    onChangeCountErjaHozeh={(count, doneCount) => {
                      setData(prev => {
                        const newData = structuredClone(prev);
                        if (newData[0]) {
                          newData[0].CountErjaShahrestan = count;
                          newData[0].CountErjaShahrestanDone = doneCount;
                        }
                        return newData;
                      });
                    }}
                  />
                </div>
              )}
            </div>
          )}


          {/* ارجاع به استان دیگر */}
          {data.length > 0 && data[0].MahalSender == 1 && (
            <div className="mx-5 border rounded-xl shadow-sm bg-slate-100">
              {/* سربرگ پنل */}
              <div
                className="flex items-center justify-between p-3 select-none hover:bg-gray-100 hover:rounded-xl transition-colors"

              >
                {/* سمت راست: عنوان و شمارنده‌ها */}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-purple-600 w-5 h-5" />
                  <h2
                    onClick={() => setIsOpen3(!isOpen3)}
                    className="cursor-pointer Roya text-[18px] text-purple-800 font-semibold flex items-center gap-2">
                    ارجاع به استان دیگر
                    <span className="bg-gray-400 text-white rounded-full w-7 h-7 flex items-center justify-center">
                      {data[0].CountErjaOstan || 0}
                    </span>
                    <span className="bg-green-700 text-white rounded-full w-7 h-7 flex items-center justify-center">
                      {data[0].CountErjaOstanDone || 0}
                    </span>
                  </h2>
                </div>

                {/* سمت چپ: دکمه‌ها */}
                {(data[0].IsDone == false && (
                  <div className="flex gap-2">

                    <button
                      onClick={() => {
                        setModalOpenErjaBeOstan(true)
                        setTozihat("");
                      }
                      }
                      className="flex items-center gap-1 p-1 px-4 bg-blue-600 text-white  rounded shadow hover:bg-blue-700 transition-colors text-sm cursor-pointer">
                      <PlusCircle className="w-4 h-4" />
                      ارجاع به استان دیگر
                    </button>
                  </div>
                ))}
              </div>

              {/* محتوای بازشونده */}
              {isOpen3 && (
                <div className="border-t">
                  <ErjaOstan key={refreshKeyErjaShahrestan} erjaParentId={data[0].ErjaId} />
                </div>
              )}
            </div>
          )}



          {/* ارجاع به محققین */}

          {data.length > 0 && (
            <div className="mx-5 border rounded-xl shadow-sm bg-slate-100">
              <div
                className="flex items-center justify-between p-3 select-none hover:bg-gray-100 hover:rounded-xl transition-colors"

              >
                {/* سمت راست: عنوان و شمارنده‌ها */}
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-purple-600 w-5 h-5" />
                  <h2
                    onClick={() => setIsOpen2(!isOpen2)}
                    className="cursor-pointer  Roya text-[18px] text-purple-800 font-semibold flex items-center gap-2">
                    ارجاع به محقق ویژه استان
                    <span className="bg-gray-400 text-white rounded-full w-7 h-7 flex items-center justify-center">
                      {data[0].CountErjaMohaghegh || 0}
                    </span>
                    <span className="bg-green-700 text-white rounded-full w-7 h-7 flex items-center justify-center">
                      {data[0].CountErjaMohagheghDone || 0}
                    </span>
                  </h2>
                </div>

                {/* سمت چپ: دکمه‌ها */}
                {(data[0].IsDone == false && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {

                        setModalOpenErjaBeMohaghegh(true)
                        setTozihat("");

                      }
                      }
                      className="flex items-center gap-1 p-1 px-4 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors text-sm cursor-pointer">
                      <PlusCircle className="w-4 h-4" />
                      ارجاع به محقق ویژه استان
                    </button>

                  </div>

                ))}






              </div>


              {/* والد */}
              {data.length > 0 && isOpen2 && (
                <div className="border-t">
                  <ErjaMohaghegh
                    // key={refreshKeyErjaMohaghegh}
                    erjaId={data[0].ErjaId}
                    onChangeCountJambandi={(countjambandi) => {
                      const newData = [...data];
                      newData[0] = {
                        ...newData[0],
                        CountErjaMohagheghDone: countjambandi
                      };

                      setData(newData);
                    }}
                  />

                </div>
              )}



            </div>
          )}


          {/* ✅ کادر پیوست‌ها (پایین همه آیتم‌ها) */}
          <div
            style={{
              width: "98%",
              justifyContent: "center",
              margin: "auto", // اگر جا داشته باشه می‌چسبه پایین صفحه
              border: "2px solid #000",
              borderRadius: "5px",
              padding: "10px",
              boxSizing: "border-box",
            }}
          >
            <div className="bnaznin text-[22px] mb-2">پیوست‌ها :</div>


            <div className="flex flex-wrap gap-2">
              {jambandiFiles?.length ? (
                jambandiFiles.map((f, idx) => (
                  <div key={`${f.FileName}-${idx}`} className="flex flex-col items-center">
                    {isImageExt(f.fileExtend) ? (
                      <img
                        src={f.url}
                        alt={f.FileName}
                        crossOrigin="anonymous"
                        onClick={() => {
                          setPreviewImg(f.url);
                          setPreviewTitle(f.FileName);
                          setZoom(1);
                          setOffset({ x: 0, y: 0 });
                          setPreviewOpen(true);
                        }}
                        style={{
                          width: "100px",
                          height: "130px",
                          objectFit: "cover",
                          border: "1px solid #999",
                          borderRadius: "8px",
                          cursor: "zoom-in",
                        }}
                      />

                    ) : (
                      <div
                        style={{
                          width: "100px",
                          height: "130px",
                          border: "1px solid #999",
                          borderRadius: "8px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          color: "#555",
                          background: "#f3f4f6",
                        }}
                      >
                        فایل غیرتصویری
                      </div>
                    )}

                    <div
                      dir="ltr"
                      className="text-[11px] text-gray-600 mt-1 w-[100px] truncate text-center"
                      title={f.FileName}
                    >
                      {f.FileName}
                    </div>
                  </div>
                ))
              ) : (
                <div className="shabnam text-[16px] text-gray-500">پیوستی ثبت نشده است.</div>
              )}
            </div>
          </div>

          {/* ✅ ردیف/جدول شورای تحقیق (بعد از پیوست‌ها) */}
          <div
            className="mt-3"
            style={{
              width: "98%",
              justifyContent: "center",
              margin: "auto",
              border: "2px solid #000",
              borderRadius: "5px",
              padding: "10px",
              boxSizing: "border-box",
              background: "#fff",
            }}
          >
            <div className="bnaznin bg-sky-300 p-2 text-[25px] rounded-2xl">ارجاع به شورای تحقیق</div>

            {shoraLoading ? (
              <div className="shabnam text-[15px] text-gray-500">در حال دریافت اطلاعات...</div>
            ) : shoraError ? (
              <div className="shabnam text-[15px] text-red-600">{shoraError}</div>
            ) : shoraItems && shoraItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-slate-200 shabnam">
                      <th className="text-[16px] text-right p-2 border">نام و نام خانوادگی</th>
                      <th className="text-[16px] text-right p-2 border">وضعیت</th>
                      <th className="text-[16px] text-right p-2 border">زمان</th>
                      <th className="text-[16px] text-center p-2 border">عملیات</th>
                    </tr>
                  </thead>

                  <tbody>
                    {shoraItems.map((r, i) => (
                      <tr
                        key={i}
                        className={`${i % 2 === 0 ? "bg-white" : "bg-slate-50"} hover:bg-sky-50 transition-colors`}
                      >
                        <td className="shabnam text-[16px] p-2 border text-purple-800">
                          {r.FullNamePerson || "—"}
                        </td>

                        <td className="shabnam text-[16px] p-2 border">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-[16px] border ${r.RecordState === 2
                                ? "bg-green-50 border-green-300 text-green-700"
                                : r.RecordState === 3
                                  ? "bg-amber-50 border-amber-300 text-amber-700"
                                  : r.RecordState === 1
                                    ? "bg-gray-50 border-gray-300 text-gray-700"
                                    : "bg-red-50 border-red-300 text-red-700"
                              }`}
                          >
                            {recordStateLabel(r.RecordState)}
                          </span>
                        </td>

                        <td className="shabnam text-[14px] p-2 border" dir="ltr">
                          {formatDT(r.CreateDateTime)}
                        </td>

                        {/* ✅ عملیات */}
                        <td className="p-2 border text-center">
                          {r.RecordState === 1 ? (
                            <button
                              onClick={deleteShoraItem}
                              className="px-3 py-1 rounded-lg bg-red-600 text-white hover:bg-red-700 cursor-pointer text-[13px]"
                            >
                              حذف
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[12px]">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>

                </table>
              </div>
            ) : (
              <div className="shabnam text-[15px] text-gray-500">اطلاعاتی برای شورای تحقیق ثبت نشده است.</div>
            )}
          </div>



          {previewOpen && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
              {/* بک‌گراند */}
              <div
                className="absolute inset-0 bg-black/70"
                onClick={() => setPreviewOpen(false)}
              />

              {/* محتوای مودال */}
              <div className="relative z-10 w-[96vw] h-[92vh] bg-white rounded-xl shadow-2xl p-3 flex flex-col">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <div className="text-[13px] text-gray-700 truncate max-w-[70vw]" dir="ltr" title={previewTitle}>
                    {previewTitle} — {Math.round(zoom * 100)}%
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => setZoom(z => clamp(z * 1.2, 1, 6))}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 cursor-pointer"
                    >
                      +
                    </button>

                    <button
                      onClick={() =>
                        setZoom(z => {
                          const nz = clamp(z / 1.2, 1, 6);
                          if (nz === 1) setOffset({ x: 0, y: 0 });
                          return nz;
                        })
                      }
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 cursor-pointer"
                    >
                      −
                    </button>

                    <button
                      onClick={resetZoomPan}
                      className="px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 cursor-pointer"
                    >
                      Reset
                    </button>

                    <button
                      onClick={() => setPreviewOpen(false)}
                      className="w-9 h-9 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center cursor-pointer"
                      aria-label="close"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* ✅ Viewer */}
                <div
                  ref={viewerRef}
                  onWheel={handleWheelZoom}
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={handlePointerUp}
                  className="flex-1 rounded-lg bg-gray-50 overflow-hidden"
                  style={{
                    touchAction: "none",
                    overscrollBehavior: "contain",
                    cursor: zoom > 1 ? "grab" : "default",
                  }}
                >
                  <img
                    src={previewImg}
                    alt={previewTitle}
                    crossOrigin="anonymous"
                    draggable={false}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",

                      // ✅ ترتیب مهم: translate قبل از scale (world units)
                      transform: `scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`,
                      transformOrigin: "0 0",
                      userSelect: "none",
                    }}
                    onDoubleClick={resetZoomPan}
                  />
                </div>

                <div className="mt-2 text-[12px] text-gray-500">
                  اسکرول ماوس = زوم | Drag = جابه‌جایی | Double-Click = Reset
                </div>
              </div>
            </div>
          )}




        </div>

      </div>




      {/* مودال افزودن آیتم */}
      {data.length > 0 && ModalOpenErjaBeHozeh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* پس‌زمینه نیمه شفاف */}
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => {
              setModalOpenErjaBeHozeh(false)
              setTozihat("");

            }
            }
          ></div>

          {/* محتوای مودال */}
          <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-96 relative">
            <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
              <h2 className="text-lg font-bold">افزودن ارجاع جدید</h2>
            </div>
            <hr className="mb-3 text-blue-800" />

            <InputUserDropdown
              label="شهرستان حوزه اصلی"
              pCityId={data[0].MahalReciver}
              CityIdNo={0}
              IsMarkaz={1}
              onSelect={(info) => {
                setCityMarkaz(info ? info.id : null);
              }}
              error={CityMarkaz === null}
              errorMessage={CityMarkaz === null ? "لطفاً شهرستان را انتخاب کنید" : ""}
            />

            {/* <div className="">
              <PersianDateInput
                label="تاریخ ارجاع"
                value={tarikh}
                allowPastDates={false}
                onChange={(v: any) => setTarikh(v)}
              />
            </div> */}

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
      )}

      {/* مودال افزودن آیتم */}

      {data.length > 0 && ModalOpenErjaBeOstan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* پس‌زمینه نیمه شفاف */}
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setModalOpenErjaBeOstan(false)}
          ></div>

          {/* محتوای مودال */}
          <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-96 relative">
            <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
              <h2 className="text-lg font-bold">افزودن ارجاع جدید</h2>
            </div>
            <hr className="mb-3 text-blue-800" />

            <InputUserDropdown
              label="استان"
              CityIdNo={data[0].MahalReciver}
              IsMarkaz={0}
              pCityId={1}
              onSelect={(info) => {
                setCityMarkaz(info ? info.id : null);
              }}
              error={CityMarkaz === null}
              errorMessage={CityMarkaz === null ? "لطفاً استان را انتخاب کنید" : ""}
            />

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
                onClick={() => setModalOpenErjaBeOstan(false)}
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
      )}



      {data.length > 0 && ModalOpenErjaBeMohaghegh && (
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

            <EjraBeMohaghegh
              codeEntekhabat={31201}
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
      )}


      {modalJambandi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setModalJambandi(false)}
          ></div>

          <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[800px] relative max-h-[90vh] flex flex-col">
            <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
              <h2 className="text-lg font-bold">ثبت جمع‌بندی</h2>
            </div>

            <hr className="mb-3 text-blue-800" />

            <RichTextEditor
              content={Jambandi}
              onChange={(newContent) => setJambandi(newContent)}
              justify={true}
              minHeight="min-h-[350px]"
              maxHeight="max-h-[600px]"  // 👈 حداکثر ارتفاع
            />



            <div className="flex justify-end gap-2 mt-5">
              <button
                className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded cursor-pointer"
                onClick={() => setModalJambandi(false)}
              >
                انصراف
              </button>
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-2xl cursor-pointer"
                onClick={() =>
                  UpdateJambandi(
                    data[0].ErjaId,
                    true,
                    Jambandi,
                    user.UserId
                  )
                }
              >
                <span className="flex gap-2">
                  <Check size={15} className="mt-1" />
                  تایید
                </span>
              </button>
            </div>
          </div>
        </div>
      )}


      {data.length > 0 && ModalOpenErjaBeShorayeTahghigh && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setModalModalOpenErjaBeShorayeTahghigh(false)}
          ></div>

          {/* محتوای مودال */}
          <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-96 relative">
            <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
              <h2 className="text-lg font-bold">انتخاب شورای تحقیق</h2>
            </div>
            <hr className="mb-3 text-blue-800" />

            <EjraBeMohaghegh
              codeEntekhabat={31201}
              label="کاربر شورای تحقیق استان"
              mahal={data[0].MahalReciver}
              noeHamkari={2}
              vije={8}
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
              className="text-[15px] mt-2 w-full h-24 border border-gray-300 rounded p-2 mb-2 resize-none focus:ring-1 focus:ring-indigo-400 focus:border-indigo-400 outline-none"
              placeholder="توضیحات ارجاع پرونده "
              value={tozihat}
              onChange={(e: any) => setTozihat(e.target.value)}
            />

            {/* دکمه‌ها */}
            <div className="flex justify-end gap-2 mt-5">
              <button
                className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded cursor-pointer"
                onClick={() => setModalModalOpenErjaBeShorayeTahghigh(false)}
              >
                انصراف
              </button>
              <button
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded cursor-pointer"
                onClick={() => (saveErjaBeShorayeTahghigh(erjaId, tozihat, tarikh!, CodeMohaghegh!, user.UserId ?? ""))}              >
                تایید
              </button>
            </div>
          </div>
        </div>




      )}

      {ModalOpenAdamNeyazBeTahghigh && (
        <div className="fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setModalOpenAdamNeyazBeTahghigh(false)}
          ></div>

          <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[30%] max-h-[90vh] overflow-hidden absolute top-5 left-1/2 -translate-x-1/2">

            <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
              <h2 className="text-lg font-bold">عدم امکان تحقیق</h2>
            </div>
            <hr className="mb-3 text-blue-800" />

            <TextArea1
              height="h-90"
              justify={true}
              readOnly={false}
              label="توضیحات عدم امکان تحقیق :"
              placeholder="توضیحات مورد نظر را وارد کنید"
              value={tozihat || ""}
              onChange={(e: any) => setTozihat(e.target.value)}
              maxLength={3000}
              onlyNumber={false}
              error={errortozihat}
              errorMessage={errortozihat ? "این فیلد اجباری است حداقل 10 رقم " : ""}
            />

            <div className="flex justify-end mt-4 gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 px-4 py-1 cursor-pointer rounded"
                onClick={() => setModalOpenAdamNeyazBeTahghigh(false)}
              >
                بستن
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (tozihat.length > 10) {
                    setErrortozihat(false);
                    await ResultTo(erjaId, 8, tozihat);
                  }
                  else {
                    setErrortozihat(true);

                  }

                }}
                // disabled={!canSubmit}
                className={`cursor-pointer px-4 py-1 rounded-xl bg-green-700 text-white 
                  ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                ارسال
              </button>

            </div>
          </div>

        </div >
      )
      }


      {ModalOpenErjabeOstanBedonTahghigh && (
        <div className="fixed inset-0 z-50">

          <div
            className="absolute inset-0 bg-black opacity-40"
            onClick={() => setModalOpenErjabeOstanBedonTahghigh(false)}
          ></div>

          <div className="bg-white rounded-lg px-6 pb-4 shadow-lg z-50 w-[30%] max-h-[90vh] overflow-hidden absolute top-5 left-1/2 -translate-x-1/2">

            <div className="bg-gray-200 -mx-6 p-3 rounded-t-lg border-b border-gray-300">
              <h2 className="text-lg font-bold">عدم نیاز به تحقیق</h2>
            </div>
            <hr className="mb-3 text-blue-800" />

            <TextArea1
              height="h-90"
              justify={true}
              readOnly={false}
              label="توضیحات عدم نیاز به تحقیق :"
              placeholder="توضیحات مورد نظر را وارد کنید"
              value={tozihat || ""}
              onChange={(e: any) => setTozihat(e.target.value)}
              maxLength={3000}
              onlyNumber={false}
              error={errortozihat}
              errorMessage={errortozihat ? "این فیلد اجباری است حداقل 10 رقم " : ""}
            />

            <div className="flex justify-end mt-4 gap-2">
              <button
                className="bg-gray-300 hover:bg-gray-400 px-4 py-1 cursor-pointer rounded"
                onClick={() => setModalOpenErjabeOstanBedonTahghigh(false)}
              >
                بستن
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (tozihat.length > 10) {
                    setErrortozihat(false);
                    await ResultTo(erjaId, 8, tozihat);
                  }
                  else {
                    setErrortozihat(true);

                  }

                }}
                // disabled={!canSubmit}
                className={`cursor-pointer px-4 py-1 rounded-xl bg-green-700 text-white 
                  ? "bg-green-600 hover:bg-green-700 cursor-pointer"
                  : "bg-gray-300 cursor-not-allowed"
                  }`}
              >
                ارسال
              </button>

            </div>
          </div>

        </div >
      )
      }



      {
        ModalOpenCreateForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* پس‌زمینه تیره */}
            <div
              className="absolute inset-0 bg-black opacity-40"
              onClick={() => setModalOpenCreateForm(false)}
            ></div>

            <div
              className="bg-white rounded-lg shadow-2xl z-50 relative overflow-auto flex items-start justify-center"
              style={{
                width: "100vw",
                height: "100vh",
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div className="w-full h-full flex flex-col items-center">

                <div className="w-[210mm] flex justify-center gap-3 mt-3">
                  <button
                    onClick={() => {
                      SaveKarbargTajmiOstan();
                    }
                    }

                    className="cursor-pointer  bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    ارسال پرونده
                  </button>
                  <button
                    onClick={() => setModalOpenCreateForm(false)}
                    className="cursor-pointer  bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    بستن
                  </button>
                </div>


                <div>
                  <ShowTahghigh
                    key={refreshKey}
                    erjaid={erjaId}
                    onJambandiAllChange={(htmlAll) => {
                      setJambandiOstan(htmlAll);      // ✅ همه‌ی محل‌ها یک‌جا
                      seterrorjambandiOsatn("");
                    }}
                  />



                </div>

                <div id="div_image_page1"
                  // ref={divRef}
                  style={{
                    width: "330mm",           // افزایش عرض از 210mm به 280mm
                    minHeight: "466mm",       // ارتفاع متناسب با نسبت A4
                    marginTop: "5px",        // کمی فاصله از دکمه‌ها
                    padding: "5mm",
                    backgroundColor: "white",
                    color: "black",
                    fontSize: 20,
                    lineHeight: 1.9,
                    boxSizing: "border-box",
                    border: "3px solid #2563eb",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 0 25px rgba(0,0,0,0.25)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "140px",
                      marginBottom: "8px",
                      display: "flex",
                      flexDirection: "row",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: "30%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src="/logo/KarbargOstan/mohr.jpg"
                        alt="لوگو اول"
                        style={{
                          height: "110px",
                          width: "150px",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        width: "75%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src="/logo/KarbargOstan/toplogo.png"
                        alt="لوگو دوم"
                        style={{
                          width: "100%",         // عرض کامل بخش وسط
                          maxWidth: "400px",     // حداکثر عرض (قابل تغییر)
                          height: "130px",        // تناسب حفظ می‌شود
                          objectFit: "contain",
                          margin: 0,
                          padding: 0,
                          display: "block",
                        }}
                      />

                    </div>

                    <div
                      style={{
                        width: "45%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        gap: "2px",
                        paddingRight: "5px",
                      }}
                    >
                      <div className="flex items-center justify-end">
                        <span className="bnaznin text-[20px]">شماره سریال :</span>
                        <span className="mx-1 text-[16px]">....................</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="bnaznin text-[20px]">استان :</span>
                        <span className="mx-1 text-[16px]">{NameOstan}</span>
                      </div>
                      <div className="flex items-center justify-end">
                        <span className="bnaznin text-[20px]">حوزه انتخابیه:</span>
                        <span className="mx-1 text-[13px]"> {NameHozeh}</span>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "130px",
                      marginBottom: "8px",
                      display: "flex",
                      flexDirection: "row",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#e5e5e5",
                        borderLeft: "2px solid #000",
                        boxSizing: "border-box",
                        borderTopLeftRadius: "8px",
                        borderBottomLeftRadius: "8px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: "rotate(-90deg)",
                          transformOrigin: "center",
                          whiteSpace: "nowrap",
                          fontSize: "17px",
                          fontWeight: "bold",
                          fontFamily: "B Titr",
                        }}
                      >
                        مشخصات داوطلب
                      </span>
                    </div>

                    <div className="flex flex-col justify-center h-full">

                      {/* ردیف اول */}
                      <div className="flex flex-wrap bnaznin text-[20px] px-2 gap-y-2 items-center">
                        <div className="flex items-center mx-2">
                          <span>نام :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-3 py-0 inline-flex items-center">
                            {Davtalab?.FirstName}
                          </span>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>نام خانوادگی :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-3 py-0 inline-flex items-center">
                            {Davtalab?.LastName}
                          </span>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>نام مشهور / مستعار :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-3 py-0 inline-flex items-center">
                            {Davtalab?.NameMostar}
                          </span>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>نام پدر :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-3 py-0 inline-flex items-center">
                            {Davtalab?.NamePedar}
                          </span>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>سال تولد  :</span>
                          <div className="flex gap-0.5 text-[18px] mr-2" dir="ltr">
                            {String(Davtalab?.SalTavalod).split("").map((num, idx) => (
                              <span
                                key={idx}
                                className="my-2 w-6 h-8 flex items-center justify-center border border-black rounded-md"
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center mx-1">
                          <span>دین - مذهب :</span>
                          <span className="mx-1 bg-gray-200 rounded-2xl px-2 py-0 inline-flex items-center">
                            {Davtalab?.DinMazhab_NameFarsi}
                          </span>
                        </div>

                      </div>

                      {/* ردیف دوم */}
                      <div className="flex flex-wrap bnaznin text-[20px] px-2 gap-y-2 mt-3">
                        <div className="flex items-center mx-2">
                          <span>شماره ملی :</span>
                          <div className="flex gap-0.5 text-[20px] mr-1" dir="ltr">
                            {String(Davtalab?.CodeMelli).split("").map((num, idx) => (
                              <span
                                key={idx}
                                className="my-2 w-5 h-8 flex items-center justify-center border border-black rounded-md"
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>



                        <div className="flex items-center mx-1">
                          <span>شغل  :</span>
                          <span className="mx-1 bg-gray-200 rounded-2xl px-2 py-0 inline-flex items-center">
                            {Davtalab?.Shoghl}
                          </span>
                        </div>

                        <div className="flex items-center mx-1">
                          <span>تحصیلات  :</span>
                          <span className="mx-1 bg-gray-200 rounded-2xl px-2 py-0 inline-flex items-center">
                            {Davtalab?.Tahsilat}
                          </span>
                        </div>

                        <div className="flex items-center mx-1">
                          <span>سابقه داوطلبی  :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-1.5 py-0 inline-flex items-center">
                            {Davtalab?.Sabeghe}
                          </span>
                        </div>



                      </div>




                    </div>






                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "130px",
                      marginBottom: "8px",
                      display: "flex",
                      flexDirection: "row",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#e5e5e5",
                        borderLeft: "2px solid #000",
                        boxSizing: "border-box",
                        borderTopLeftRadius: "8px",
                        borderBottomLeftRadius: "8px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: "rotate(-90deg)",
                          transformOrigin: "center",
                          whiteSpace: "nowrap",
                          fontSize: "17px",
                          fontWeight: "bold",
                          fontFamily: "B Titr",
                        }}
                      >
                        مشخصات تحقیقات
                      </span>
                    </div>

                    <div className="flex flex-col justify-center h-full">

                      {/* ردیف اول */}
                      <div className="flex flex-wrap bnaznin text-[20px] px-2 gap-y-2 items-center">
                        <div className="flex items-center mx-2">
                          <span>تعداد کل منابع تحقیق شده :</span>
                          <div className="flex gap-0.5 text-[20px] mr-2" dir="ltr">
                            <span className="border mx-1 bg-gray-200 rounded-xl px-2 py-0 my-0 h-8 inline-flex items-center">
                              {Davtalab?.CountKarbarg}
                            </span>

                          </div>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>محل کار :</span>
                          <div className="flex gap-0.5 text-[20px] mr-2" dir="ltr">
                            <span className="border mx-1 bg-gray-200 rounded-xl px-2 py-0 my-0 h-8 inline-flex items-center">
                              {Davtalab?.CountKarbarg_Type1}
                            </span>

                          </div>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>محل تحصیل :</span>
                          <div className="flex gap-0.5 text-[20px] mr-2" dir="ltr">
                            <span className="border mx-1 bg-gray-200 rounded-xl px-2 py-0 my-0 h-8 inline-flex items-center">
                              {Davtalab?.CountKarbarg_Type2}
                            </span>

                          </div>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>محل زندگی :</span>
                          <div className="flex gap-0.5 text-[20px] mr-2" dir="ltr">
                            <span className="border mx-1 bg-gray-200 rounded-xl px-2 py-0 my-0 h-8 inline-flex items-center">
                              {Davtalab?.CountKarbarg_Type3}
                            </span>

                          </div>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>تعداد پیوست :</span>

                          <div className="flex items-center gap-1 mr-2" dir="ltr">
                            <AnimatePresence initial={false}>
                              {showControls && (
                                <motion.button
                                  key="minus"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() =>
                                    setCountExtraPeyvast((prev) => Math.max(prev - 1, 0))
                                  }
                                  className="w-8 h-8 flex items-center justify-center
                     rounded-xl border bg-red-100 hover:bg-red-200
                     text-lg font-bold select-none"
                                >
                                  −
                                </motion.button>
                              )}
                            </AnimatePresence>

                            {/* عدد (کلیک برای نمایش/مخفی کردن کنترل‌ها) */}
                            <span
                              onClick={() => setShowControls((p) => !p)}
                              className="w-10 h-8 flex items-center justify-center
                 rounded-xl border bg-sky-100 text-[20px]
                 cursor-pointer select-none"
                            >
                              {CountExtraPeyvast}
                            </span>

                            <AnimatePresence initial={false}>
                              {showControls && (
                                <motion.button
                                  key="plus"
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.8 }}
                                  transition={{ duration: 0.2 }}
                                  onClick={() =>
                                    setCountExtraPeyvast((prev) => prev + 1)
                                  }
                                  className="w-8 h-8 flex items-center justify-center
                     rounded-xl border bg-green-100 hover:bg-green-200
                     text-lg font-bold select-none"
                                >
                                  +
                                </motion.button>
                              )}
                            </AnimatePresence>
                          </div>

                          <div className="flex items-center mx-1">
                            <span>صفحه</span>
                          </div>
                        </div>

                      </div>

                      <div className="flex flex-wrap bnaznin text-[20px] px-2 gap-y-2 items-center">
                        <div className="flex items-center mx-2">
                          <span>تعداد کاربرگ ها و شماره سریال آنها :</span>
                          <span>تحقیق از داوطلب :</span>
                          <span className="border mx-1 bg-gray-200 rounded-xl px-1 py-0 my-0 h-8 inline-flex items-center">
                            0
                          </span>

                        </div>

                        <div className="flex items-center mx-2">
                          <span>تحقیق کامل 3 برگی  :</span>
                          <div className="flex gap-0.5 text-[20px] mr-2" dir="ltr">
                            <span className="border mx-1 bg-gray-200 rounded-xl px-1 py-0 my-0 h-8 inline-flex items-center">
                              {Davtalab?.TahghighType1}
                            </span>

                          </div>
                        </div>



                      </div>


                      <div className="flex flex-wrap bnaznin text-[20px] px-2 gap-y-2 items-center">
                        <div className="flex items-center mx-2">
                          <span>  گزارش تحقیق محدود :</span>
                          <span className="border mx-1 bg-gray-200 rounded-xl px-1 py-0 my-0 h-8 inline-flex items-center">
                            {Davtalab?.TahghighType2}
                          </span>
                          <span className="text-gray-400"> ....................................................................................  </span>
                          <span>  بازخوانی پرونده :</span>
                          <span className="border mx-1 bg-gray-200 rounded-xl px-1 py-0 my-0 h-8 inline-flex items-center">
                            {Davtalab?.TahghighType3}
                          </span>

                          <span className="text-gray-400"> ....................................................................................  </span>

                        </div>


                      </div>

                    </div>


                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "100%",
                      marginBottom: "2px",
                      paddingTop: "0px",
                      paddingRight: "10px",
                      paddingLeft: "10px",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      gap: "2px",   // فاصله کمتر شد
                    }}
                  >
                    <div className="flex flex-col bnaznin text-[22px] leading-[1.3] mt-2">
                      <span>1. اعتقاد و التزام عملی داوطلب به مسائل دینی ، اعتقادی و عبادی :</span>
                    </div>

                    <div className="flex items-center bnaznin text-[23px] leading-[1.2] flex-wrap">

                      {items1.map((text, index) => (
                        <div key={index} className="flex items-center mr-8">
                          <span className="mx-1">{text}</span>

                          <span
                            onClick={() => setSelected1(index)}
                            className={`
            w-5 h-5 inline-block rounded-full border border-black cursor-pointer
            ${selected1 === index ? "bg-gray-600" : "bg-white"}
          `}
                          ></span>
                        </div>
                      ))}

                    </div>

                    <div className="flex flex-col bnaznin text-[20px] leading-[1.2]">
                      <span className="flex">توضیح با ذکر مصادیق :</span>
                    </div>

                    <div className="flex text-sky-900 flex-col shabnam text-[18px] leading-loose mb-3">
                      <span className="text-red-600 text-[16px] text-center">{errorPasokh1}</span>
                      <span
                        contentEditable
                        className="
    editable-placeholder 
    border 
    border-transparent 
    focus:border-blue-500 
    outline-none 
    px-1
  "
                        data-id="item-1"
                        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                        }}
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                          setPasokh1(target.innerText);
                          seterrorPasokh1("");
                        }}
                      ></span>


                    </div>

                    <div className="flex flex-col bnaznin text-[22px] leading-[1.2] ">
                      <span>2. وضعیت داوطلب در حوزه مسائل اخلاقی، رفتاری و شخصیتی :</span>
                    </div>
                    <div className="flex items-center bnaznin text-[23px] leading-[1.2] flex-wrap">

                      {items2.map((text, index) => (
                        <div key={index} className="flex items-center mr-8">

                          <span className="mx-1">{text}</span>

                          <span
                            onClick={() => setSelected2(index)}
                            className={`
              w-5 h-5 inline-block rounded-full border border-black cursor-pointer
              ${selected2 === index ? "bg-gray-600" : "bg-white"}
            `}
                          ></span>

                        </div>
                      ))}

                    </div>
                    <div className="flex flex-col bnaznin text-[20px] leading-[1.2]">
                      <span>توضیح با ذکر مصادیق :</span>
                    </div>
                    <div className="flex text-sky-900 flex-col shabnam text-[18px] leading-loose mb-3">
                      <span className="text-red-600 text-[16px] text-center">{errorPasokh2}</span>
                      <span
                        contentEditable
                        className="
    editable-placeholder 
    border 
    border-transparent 
    focus:border-blue-500 
    outline-none 
    px-1
  "
                        data-id="item-1"
                        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                        }}
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                          setPasokh2(target.innerText);
                          seterrorPasokh2("");
                        }}
                      ></span>


                    </div>


                    <div className="flex flex-col bnaznin text-[22px] leading-[1.2] ">
                      <span>3. اعتقاد و التزام عملی داوطلب به نظام مقدس جمهوری اسلامی ایران و مواضع و عملکرد وی در حوزه مسائل سیاسی و امنیتی :</span>
                    </div>
                    <div className="flex items-center bnaznin text-[23px] leading-[1.2] flex-wrap">

                      {items3.map((text, index) => (
                        <div key={index} className="flex items-center mr-8">

                          <span className="mx-1">{text}</span>

                          <span
                            onClick={() => setSelected3(index)}
                            className={`
              w-5 h-5 inline-block rounded-full border border-black cursor-pointer
              ${selected3 === index ? "bg-gray-600" : "bg-white"}
            `}
                          ></span>

                        </div>
                      ))}

                    </div>
                    <div className="flex flex-col bnaznin text-[20px] leading-[1.2]">
                      <span>توضیح با ذکر مصادیق :</span>
                    </div>
                    <div className="flex text-sky-900 flex-col shabnam text-[18px] leading-loose mb-3">
                      <span className="text-red-600 text-[16px] text-center">{errorPasokh3}</span>
                      <span
                        contentEditable
                        className="
    editable-placeholder 
    border 
    border-transparent 
    focus:border-blue-500 
    outline-none 
    px-1
  "
                        data-id="item-1"
                        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                        }}
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                          setPasokh3(target.innerText);
                          seterrorPasokh3("");
                        }}
                      ></span>


                    </div>


                    <div className="flex flex-col bnaznin text-[22px] leading-[1.2] ">
                      <span>4. مواضع و عملکرد داوطلب نسبت به اصل ولایت مطلقه وسطح پایبندی وی به دستورات، سیاست ها و منویات مقام معظم رهبری :</span>
                    </div>
                    <div className="flex items-center bnaznin text-[23px] leading-[1.2] flex-wrap">

                      {items2.map((text, index) => (
                        <div key={index} className="flex items-center mr-8">

                          <span className="mx-1">{text}</span>

                          <span
                            onClick={() => setSelected4(index)}
                            className={`
              w-5 h-5 inline-block rounded-full border border-black cursor-pointer
              ${selected4 === index ? "bg-gray-600" : "bg-white"}
            `}
                          ></span>

                        </div>
                      ))}

                    </div>
                    <div className="flex flex-col bnaznin text-[20px] leading-[1.2]">
                      <span>توضیح با ذکر مصادیق :</span>
                    </div>
                    <div className="flex text-sky-900 flex-col shabnam text-[18px] leading-loose mb-3">
                      <span className="text-red-600 text-[16px] text-center">{errorPasokh4}</span>
                      <span
                        contentEditable
                        className="
    editable-placeholder 
    border 
    border-transparent 
    focus:border-blue-500 
    outline-none 
    px-1
  "
                        data-id="item-4"
                        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                        }}
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                          setPasokh4(target.innerText);
                          seterrorPasokh4("");
                        }}
                      ></span>


                    </div>


                    <div className="flex flex-col bnaznin text-[22px] leading-[1.2] ">
                      <span>5. اعتقاد و التزام عملی داوطلب به قوانین و مقررات کشور (قانون اساسی و قوانین عادی)   :</span>
                    </div>
                    <div className="flex items-center bnaznin text-[23px] leading-[1.2] flex-wrap">

                      {items5.map((text, index) => (
                        <div key={index} className="flex items-center mr-8">

                          <span className="mx-1">{text}</span>

                          <span
                            onClick={() => setSelected5(index)}
                            className={`
              w-5 h-5 inline-block rounded-full border border-black cursor-pointer
              ${selected5 === index ? "bg-gray-600" : "bg-white"}
            `}
                          ></span>

                        </div>
                      ))}

                    </div>
                    <div className="flex flex-col bnaznin text-[20px] leading-[1.2]">
                      <span>توضیح با ذکر مصادیق :</span>
                    </div>
                    <div className="flex text-sky-900 flex-col shabnam text-[18px] leading-loose mb-3">
                      <span className="text-red-600 text-[16px] text-center">{errorPasokh5}</span>
                      <span
                        contentEditable
                        className="
    editable-placeholder 
    border 
    border-transparent 
    focus:border-blue-500 
    outline-none 
    px-1
  "
                        data-id="item-4"
                        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                        }}
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                          setPasokh5(target.innerText);
                          seterrorPasokh5("");
                        }}
                      ></span>
                    </div>


                    <div className="flex flex-col bnaznin text-[22px] leading-[1.2] ">
                      <span>6. وضعیت داوطلب در حوزه مسائل اقتصادی و مالی  :</span>
                    </div>
                    <div className="flex items-center bnaznin text-[23px] leading-[1.2] flex-wrap">

                      {items6.map((text, index) => (
                        <div key={index} className="flex items-center mr-8">

                          <span className="mx-1">{text}</span>

                          <span
                            onClick={() => setSelected6(index)}
                            className={`
              w-5 h-5 inline-block rounded-full border border-black cursor-pointer
              ${selected6 === index ? "bg-gray-600" : "bg-white"}
            `}
                          ></span>

                        </div>
                      ))}

                    </div>
                    <div className="flex flex-col bnaznin text-[20px] leading-[1.2]">
                      <span>توضیح با ذکر مصادیق :</span>
                    </div>
                    <div className="flex text-sky-900 flex-col shabnam text-[18px] leading-loose mb-3">
                      <span className="text-red-600 text-[16px] text-center">{errorPasokh6}</span>
                      <span
                        contentEditable
                        className="
    editable-placeholder 
    border 
    border-transparent 
    focus:border-blue-500 
    outline-none 
    px-1
  "
                        data-id="item-4"
                        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                        }}
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                          setPasokh6(target.innerText);
                          seterrorPasokh6("");
                        }}
                      ></span>


                    </div>


                    <div className="flex flex-col bnaznin text-[22px] leading-[1.2] ">
                      <span>7.  وضعیت خانواده بستگان درجه یک / سببی و نسبی ، دوستان و معاشرین داوطلب در حوزه مسائل عقیدتی ، اخلاقی ، اقتصادی ، سیاسی و رعایت ظواهر و شئونات اسلامی و ..:</span>
                    </div>
                    <div className="flex items-center bnaznin text-[23px] leading-[1.2] flex-wrap">

                      {items7.map((text, index) => (
                        <div key={index} className="flex items-center mr-8">

                          <span className="mx-1">{text}</span>

                          <span
                            onClick={() => setSelected7(index)}
                            className={`
              w-5 h-5 inline-block rounded-full border border-black cursor-pointer
              ${selected7 === index ? "bg-gray-600" : "bg-white"}
            `}
                          ></span>

                        </div>
                      ))}

                    </div>
                    <div className="flex flex-col bnaznin text-[20px] leading-[1.2]">
                      <span>توضیح با ذکر مصادیق :</span>
                    </div>
                    <div className="flex text-sky-900 flex-col shabnam text-[18px] leading-loose mb-3">
                      <span className="text-red-600 text-[16px] text-center">{errorPasokh7}</span>
                      <span
                        contentEditable
                        className="
    editable-placeholder 
    border 
    border-transparent 
    focus:border-blue-500 
    outline-none 
    px-1
  "
                        data-id="item-4"
                        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                        }}
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                          setPasokh7(target.innerText);
                          seterrorPasokh7("");
                        }}
                      ></span>


                    </div>


                    <div className="flex flex-col bnaznin text-[22px] leading-[1.2] ">
                      <span>8.  ویژگی ها، موفقیت ها یا خدمات برجسته داوطلب که در مقایسه با افراد مشابه واجد ارزش بوده و به صورت مستقیم یا غیرمستقیم می تواند منجر به خدمت به جامعه گردد ..:</span>
                    </div>

                    <div className="flex text-sky-900 flex-col shabnam text-[18px] leading-loose mb-3">
                      <span className="text-red-600 text-[16px] text-center">{errorPasokh8}</span>
                      <span
                        contentEditable
                        className="
    editable-placeholder 
    border 
    border-transparent 
    focus:border-blue-500 
    outline-none 
    px-1
  "
                        data-id="item-4"
                        onInput={(e: React.FormEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                        }}
                        onBlur={(e: React.FocusEvent<HTMLSpanElement>) => {
                          const target = e.currentTarget;
                          setPasokh8(target.innerText);
                          seterrorPasokh8("");
                        }}
                      ></span>


                    </div>

                  </div>
                </div>

                <div id="div_image_page2"
                  style={{
                    width: "330mm",
                    minHeight: "466mm",
                    marginTop: "5px",
                    padding: "5mm",
                    backgroundColor: "white",
                    color: "black",
                    fontSize: 20,
                    lineHeight: 1.9,
                    boxSizing: "border-box",
                    border: "3px solid #2563eb",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 0 25px rgba(0,0,0,0.25)",
                  }}
                >
                  {/* اگر می‌خوای هدر صفحه دوم هم باشد، همینجا هدر رو کپی کن */}

                  <div
                    style={{
                      width: "100%",
                      minHeight: "430mm",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      padding: "12px",
                      boxSizing: "border-box",
                      display: "flex",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <p
                      className="text-[22px] m-0 bnaznin"
                      style={{ lineHeight: "3.4rem", marginTop: 0 }}
                    >
                      جمع بندی تحقیقات صورت گرفته براساس مهم ترین موارد درج شده در کاربرگ های تحقیق :
                    </p>
                    <p className="text-red-500 text-[16px]">{errorjambandiOsatn}</p>


                    <div
                      ref={jambandiBoxRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="shabnam text-[18px] leading-loose"
                      style={{
                        flex: 1,
                        minHeight: "280mm",
                        border: "1px dashed #999",
                        borderRadius: "10px",
                        padding: "12px",
                        outline: "none",
                        color: "#0c4a6e",
                        whiteSpace: "pre-wrap",
                      }}
                      onBlur={(e) => setJambandiOstan(e.currentTarget.innerHTML)}
                    />

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "40px",
                        fontSize: "22px",
                        fontFamily: "bnaznin",
                      }}
                    >
                      <span>نام و نام خانوادگی کارشناس واحد اسناد و بررسی دفتر استان :</span>
                      <span>تاریخ:</span>
                      <span className="ml-30">امضاء:</span>
                    </div>
                  </div>
                </div>
              </div>

              <style>{`
          @media print {
            #div_image > div {
              box-shadow: none !important;
              margin-top: 0 !important;
            }
          }
        `}
              </style>
            </div >
          </div >
        )
      }



      {
        ModalOpenKargroupMosahebe && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black opacity-40"
              onClick={() => setModalOpenKargroupMosahebe(false)}
            ></div>

            <div
              className="bg-white rounded-lg shadow-2xl z-50 relative overflow-auto flex items-start justify-center"
              style={{
                width: "100vw",
                height: "100vh",
                padding: "20px",
                boxSizing: "border-box",
              }}
            >
              <div className="w-full h-full flex flex-col items-center">

                <div className="w-[210mm] flex justify-center gap-3 mt-3">
                  <button
                    onClick={() => {
                      SaveKarbargMosaheghe();
                    }
                    }
                    className="cursor-pointer  bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
                  >
                    ارسال پرونده
                  </button>
                  <button
                    onClick={() => setModalOpenKargroupMosahebe(false)}
                    className="cursor-pointer  bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600"
                  >
                    بستن
                  </button>
                </div>


                <div
                  id="div_image_page3"
                  style={{
                    width: "330mm",
                    minHeight: "466mm",
                    marginTop: "5px",
                    padding: "5mm",
                    backgroundColor: "white",
                    color: "black",
                    fontSize: 20,
                    lineHeight: 1.9,
                    boxSizing: "border-box",
                    border: "3px solid #2563eb",
                    borderRadius: "10px",
                    display: "flex",
                    flexDirection: "column",
                    boxShadow: "0 0 25px rgba(0,0,0,0.25)",
                  }}
                >
                  <div
                    style={{
                      width: "100%",
                      height: "140px",
                      marginBottom: "8px",
                      display: "flex",
                      flexDirection: "row",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    <div
                      style={{
                        width: "20%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                      }}
                    >
                      <img
                        src="/logo/KarbargOstan/mohr.jpg"
                        alt="لوگو اول"
                        style={{
                          height: "110px",
                          width: "150px",
                          objectFit: "contain",
                        }}
                      />
                    </div>

                    <div
                      style={{
                        width: "70%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src="/logo/KarbargMosahebe/Logo.png"
                        alt="لوگو دوم"
                        style={{
                          width: "100%",
                          maxWidth: "400px",
                          height: "130px",
                          objectFit: "contain",
                          margin: 0,
                          padding: 0,
                          display: "block",
                        }}
                      />
                    </div>

                    {/* ستون سوم: متن راست (۴۰٪) */}
                    <div
                      style={{
                        width: "30%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        justifyContent: "center",
                        gap: "5px",
                        paddingRight: "2px",
                        paddingLeft: "20px",
                      }}
                    >
                      <div className="flex items-center justify-start w-full">
                        <span className="bnaznin text-[20px]" >شماره سریال :</span>
                        <span className="mx-2 text-[16px]">....................</span>
                      </div>
                      <div className="flex items-center justify-start w-full">
                        <span className="bnaznin text-[20px]" >استان :</span>
                        <span className="mx-2 text-[16px]">{NameOstan}</span>
                      </div>
                      <div className="flex items-center justify-start w-full">
                        <span className="bnaznin text-[20px]">حوزه انتخابیه:</span>
                        <span className="mx-2 text-[13px]"> {NameHozeh}</span>
                      </div>
                    </div>
                  </div>

                  {/* --- بخش مشخصات داوطلب --- */}
                  <div
                    style={{
                      width: "100%",
                      height: "130px",
                      marginBottom: "8px",
                      display: "flex",
                      flexDirection: "row",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                    }}
                  >
                    {/* ستون کناری (عنوان عمودی) */}
                    <div
                      style={{
                        width: "40px",
                        height: "100%",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#e5e5e5",
                        borderLeft: "2px solid #000",
                        boxSizing: "border-box",
                        borderTopLeftRadius: "8px",
                        borderBottomLeftRadius: "8px",
                      }}
                    >
                      <span
                        style={{
                          display: "inline-block",
                          transform: "rotate(-90deg)",
                          transformOrigin: "center",
                          whiteSpace: "nowrap",
                          fontSize: "17px",
                          fontWeight: "bold",
                          fontFamily: "B Titr",
                        }}
                      >
                        مشخصات داوطلب
                      </span>
                    </div>

                    {/* ستون محتوا */}
                    <div className="flex flex-col justify-center h-full w-full">
                      {/* ردیف اول */}
                      <div className="flex flex-wrap bnaznin text-[20px] px-2 gap-y-2 items-center">
                        <div className="flex items-center mx-2">
                          <span>نام :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-3 py-0 inline-flex items-center">
                            {Davtalab?.FirstName}
                          </span>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>نام خانوادگی :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-3 py-0 inline-flex items-center">
                            {Davtalab?.LastName}
                          </span>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>نام مشهور / مستعار :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-3 py-0 inline-flex items-center">
                            {Davtalab?.NameMostar}
                          </span>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>نام پدر :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-3 py-0 inline-flex items-center">
                            {Davtalab?.NamePedar}
                          </span>
                        </div>

                        <div className="flex items-center mx-2">
                          <span>سال تولد :</span>
                          <div className="flex gap-0.5 text-[18px] mr-2" dir="ltr">
                            {String(Davtalab?.SalTavalod).split("").map((num, idx) => (
                              <span
                                key={idx}
                                className="my-2 w-6 h-8 flex items-center justify-center border border-black rounded-md"
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center mx-1">
                          <span>دین - مذهب :</span>
                          <span className="mx-1 bg-gray-200 rounded-2xl px-2 py-0 inline-flex items-center">
                            {Davtalab?.DinMazhab_NameFarsi}
                          </span>
                        </div>
                      </div>

                      {/* ردیف دوم */}
                      <div className="flex flex-wrap bnaznin text-[20px] px-2 gap-y-2 mt-3">
                        <div className="flex items-center mx-2">
                          <span>شماره ملی :</span>
                          <div className="flex gap-0.5 text-[20px] mr-1" dir="ltr">
                            {String(Davtalab?.CodeMelli).split("").map((num, idx) => (
                              <span
                                key={idx}
                                className="my-2 w-5 h-8 flex items-center justify-center border border-black rounded-md"
                              >
                                {num}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center mx-1">
                          <span>شغل :</span>
                          <span className="mx-1 bg-gray-200 rounded-2xl px-2 py-0 inline-flex items-center">
                            {Davtalab?.Shoghl}
                          </span>
                        </div>

                        <div className="flex items-center mx-1">
                          <span>تحصیلات :</span>
                          <span className="mx-1 bg-gray-200 rounded-2xl px-2 py-0 inline-flex items-center">
                            {Davtalab?.Tahsilat}
                          </span>
                        </div>

                        <div className="flex items-center mx-1">
                          <span>سابقه داوطلبی :</span>
                          <span className="mx-2 bg-gray-200 rounded-2xl px-1.5 py-0 inline-flex items-center">
                            {Davtalab?.Sabeghe}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      flex: 1,
                      boxSizing: "border-box",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      padding: "0px",
                      display: "grid",
                      gridTemplateRows: "auto 1fr",
                      gridTemplateColumns: "1fr 2fr",
                      columnGap: "2px", // فاصله بین ستون‌ها
                      backgroundColor: "#000", // رنگ پس‌زمینه کانتینر (رنگ خط)
                      overflow: "hidden",
                    }}
                  >
                    {/* سطر اول */}
                    <div style={{ borderBottom: "1px solid #ccc", backgroundColor: "#fff" }}>
                      <p className="text-[17px] text-center">
                        سوالات و موارد مطرح شده توسط محقق :
                      </p>
                    </div>
                    <div style={{ borderBottom: "1px solid #ccc", backgroundColor: "#fff" }}>
                      <p className="text-[17px] text-center">
                        مشروح اظهارات داوطلب :
                      </p>
                    </div>
                    {/* سطر دوم */}
                    <div style={{ backgroundColor: "#fff" }}>

                      <div
                        ref={SoalatBoxRef}
                        contentEditable
                        suppressContentEditableWarning
                        className="shabnam text-[16px] leading-loose"
                        style={{
                          flex: 1,
                          margin: "5px",
                          minHeight: "265mm",
                          border: "1px dashed #999",
                          borderRadius: "10px",
                          padding: "12px",
                          outline: "none",
                          color: "#0c4a6e",
                          whiteSpace: "pre-wrap",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: SoalatParvandeh,
                        }}
                        onBlur={(e) => {
                          const content = e.currentTarget.innerHTML;
                          setSoalatParvandeh(content);
                        }}
                      />
                    </div>
                    <div style={{ backgroundColor: "#fff" }}>
                      <div
                        ref={PasokhBoxRef}
                        contentEditable
                        suppressContentEditableWarning
                        className="shabnam text-[16px] leading-loose"
                        style={{
                          flex: 1,
                          margin: "5px",
                          minHeight: "265mm",
                          border: "1px dashed #999",
                          borderRadius: "10px",
                          padding: "12px",
                          outline: "none",
                          color: "#0c4a6e",
                          whiteSpace: "pre-wrap",
                        }}
                        dangerouslySetInnerHTML={{
                          __html: PasokhParvandeh,
                        }}
                        onBlur={(e) => {
                          const content = e.currentTarget.innerHTML;
                          setPasokhParvandeh(content);
                        }}
                      />
                    </div>
                  </div>
                  <div
                    style={{
                      width: "100%",
                      height: "auto", // ارتفاع بر اساس محتوا تنظیم شود
                      minHeight: "20mm", // حداقل ارتفاع
                      padding: "12px",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      marginTop: "4px",
                      display: "flex",
                      flexDirection: "column", // چیدمان عمودی (متن بالا، جدول پایین)
                      alignItems: "flex-start", // محتوا از چپ شروع شود
                      gap: "10px", // فاصله بین متن و جدول
                    }}
                  >
                    <div>
                      <p className="text-[22px] leading-9 m-0">
                        <span className="bnaznin">مشخصات منابع جدید به منظور تحقیق یا استعلام جهت بررسی های تکمیلی : (شامل نام رده ، اداره یا سازمان ، نام و نام خانوادگی و شماره تماس) </span>
                      </p>
                    </div>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr", // دو ستون هم‌اندازه
                        width: "100%",
                        gap: "5px", // فاصله بین خانه‌ها
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center", // تراز عمودی وسط
                          width: "100%",
                          gap: "5px", // فاصله بین عدد و باکس
                        }}
                      >
                        <p style={{ margin: "0", minWidth: "20px" }}>1-</p>
                        <div
                          ref={Manabe1JadidBoxRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="shabnam text-[16px]"
                          style={{
                            flex: 1, // پر کردن باقی‌مانده فضا
                            margin: "0px",
                            border: "1px dashed #999",
                            borderRadius: "5px",
                            padding: "5px",
                            outline: "none",
                            color: "#0c4a6e",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.5",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: Manabe1,
                          }}
                          onBlur={(e) => {
                            const content = e.currentTarget.innerHTML;
                            setManabe1(content || "");
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center", // تراز عمودی وسط
                          width: "100%",
                          gap: "5px", // فاصله بین عدد و باکس
                        }}
                      >
                        <p style={{ margin: "0", minWidth: "20px" }}>2-</p>
                        <div
                          ref={Manabe2JadidBoxRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="shabnam text-[16px]"
                          style={{
                            flex: 1, // پر کردن باقی‌مانده فضا
                            margin: "0px",
                            border: "1px dashed #999",
                            borderRadius: "5px",
                            padding: "5px",
                            outline: "none",
                            color: "#0c4a6e",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.5",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: Manabe2,
                          }}
                          onBlur={(e) => {
                            const content = e.currentTarget.innerHTML;
                            if (content && content.trim() !== "" && content !== "<br>" && content !== "<p><br></p>") {
                              setManabe2(content);
                            }
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center", // تراز عمودی وسط
                          width: "100%",
                          gap: "5px", // فاصله بین عدد و باکس
                        }}
                      >
                        <p style={{ margin: "0", minWidth: "20px" }}>3-</p>
                        <div
                          ref={Manabe3JadidBoxRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="shabnam text-[16px]"
                          style={{
                            flex: 1, // پر کردن باقی‌مانده فضا
                            margin: "0px",
                            border: "1px dashed #999",
                            borderRadius: "5px",
                            padding: "5px",
                            outline: "none",
                            color: "#0c4a6e",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.5",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: Manabe3,
                          }}
                          onBlur={(e) => {
                            const content = e.currentTarget.innerHTML;
                            if (content && content.trim() !== "" && content !== "<br>" && content !== "<p><br></p>") {
                              setManabe3(content);
                            }
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center", // تراز عمودی وسط
                          width: "100%",
                          gap: "5px", // فاصله بین عدد و باکس
                        }}
                      >
                        <p style={{ margin: "0", minWidth: "20px" }}>4-</p>
                        <div
                          ref={Manabe4JadidBoxRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="shabnam text-[16px]"
                          style={{
                            flex: 1, // پر کردن باقی‌مانده فضا
                            margin: "0px",
                            border: "1px dashed #999",
                            borderRadius: "5px",
                            padding: "5px",
                            outline: "none",
                            color: "#0c4a6e",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.5",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: Manabe4,
                          }}
                          onBlur={(e) => {
                            const content = e.currentTarget.innerHTML;
                            if (content && content.trim() !== "" && content !== "<br>" && content !== "<p><br></p>") {
                              setManabe4(content);
                            }
                          }}
                        />
                      </div>

                      <div
                        style={{
                          display: "flex",
                          alignItems: "center", // تراز عمودی وسط
                          width: "100%",
                          gap: "5px", // فاصله بین عدد و باکس
                        }}
                      >
                        <p style={{ margin: "0", minWidth: "20px" }}>5-</p>
                        <div
                          ref={Manabe5JadidBoxRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="shabnam text-[16px]"
                          style={{
                            flex: 1, // پر کردن باقی‌مانده فضا
                            margin: "0px",
                            border: "1px dashed #999",
                            borderRadius: "5px",
                            padding: "5px",
                            outline: "none",
                            color: "#0c4a6e",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.5",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: Manabe5,
                          }}
                          onBlur={(e) => {
                            const content = e.currentTarget.innerHTML;
                            if (content && content.trim() !== "" && content !== "<br>" && content !== "<p><br></p>") {
                              setManabe5(content);
                            }
                          }}
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center", // تراز عمودی وسط
                          width: "100%",
                          gap: "5px", // فاصله بین عدد و باکس
                        }}
                      >
                        <p style={{ margin: "0", minWidth: "20px" }}>6-</p>
                        <div
                          ref={Manabe6JadidBoxRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="shabnam text-[16px]"
                          style={{
                            flex: 1, // پر کردن باقی‌مانده فضا
                            margin: "0px",
                            border: "1px dashed #999",
                            borderRadius: "5px",
                            padding: "5px",
                            outline: "none",
                            color: "#0c4a6e",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.5",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: Manabe6,
                          }}
                          onBlur={(e) => {
                            const content = e.currentTarget.innerHTML;

                            if (!content || content.trim() === "" || content === "<br>" || content === "<p><br></p>") {
                              setManabe6("");
                            } else {
                              setManabe6(content);
                            }
                          }}
                        />
                      </div>


                    </div>
                  </div>

                  <div
                    style={{
                      width: "100%",
                      height: "auto", // ارتفاع بر اساس محتوا تنظیم شود
                      minHeight: "20mm", // حداقل ارتفاع
                      padding: "12px",
                      border: "2px solid #000",
                      borderRadius: "5px",
                      boxSizing: "border-box",
                      marginTop: "4px",
                      display: "flex",
                      flexDirection: "column", // چیدمان عمودی (متن بالا، جدول پایین)
                      alignItems: "flex-start", // محتوا از چپ شروع شود
                      gap: "10px", // فاصله بین متن و جدول
                    }}
                  >
                    <div className="m-0 p-0" style={{ marginBottom: "0px", padding: "0px" }}>
                      <p className="text-[22px] m-0 p-0" style={{ lineHeight: "1.2" }}>
                        <span className="bnaznin">نظریه و توضیحات محقق : </span>
                      </p>
                    </div>
                    <div
                      ref={TozhatMohagheghBoxRef}
                      contentEditable
                      suppressContentEditableWarning
                      className="shabnam text-[16px]"
                      style={{
                        flex: 1,
                        margin: "0px",
                        width: "100%",
                        minHeight: "20mm",
                        border: "1px dashed #999",
                        borderRadius: "5px",
                        padding: "5px",
                        outline: "none",
                        color: "#0c4a6e",
                        whiteSpace: "pre-wrap",
                        lineHeight: "1.5",
                      }}
                      dangerouslySetInnerHTML={{
                        __html: TozihatMohaghegh,
                      }}
                      onBlur={(e) => {
                        const content = e.currentTarget.innerHTML;
                        setTozihatMohaghegh(content);
                      }}
                    />

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "3fr 1fr 1fr 0.5fr", // دو ستون هم‌اندازه
                        width: "100%",
                        gap: "5px", // فاصله بین خانه‌ها
                      }}
                    >


                      <div
                        style={{
                          display: "flex",
                          alignItems: "center", // تراز عمودی وسط
                          width: "100%",
                          gap: "5px", // فاصله بین عدد و باکس
                        }}
                      >
                        <p className="text-[16px]" style={{ margin: "0", minWidth: "20px" }}>تعداد پیوست ها و مستندات ارائه شده توسط داوطلب</p>
                        <div
                          ref={PeyvastBoxRef}
                          contentEditable
                          suppressContentEditableWarning
                          className="shabnam text-[16px]"
                          style={{
                            flex: 1, // پر کردن باقی‌مانده فضا
                            margin: "0px",
                            border: "1px dashed #999",
                            borderRadius: "5px",
                            padding: "5px",
                            outline: "none",
                            color: "#0c4a6e",
                            whiteSpace: "pre-wrap",
                            lineHeight: "1.5",
                          }}
                          dangerouslySetInnerHTML={{
                            __html: PeyvastDavtalab,
                          }}
                          onBlur={(e) => {
                            const content = e.currentTarget.innerHTML;
                            setPeyvastDavtalab(content);
                          }}
                        />
                      </div>


                      <div className="bnaznin">شناسه محقق :</div>
                      <div className="bnaznin">تاریخ تکمیل :</div>
                      <div className="bnaznin">امضاء :</div>

                    </div>
                  </div>


                </div>




              </div>

              <style>{`
          @media print {
            #div_image > div {
              box-shadow: none !important;
              margin-top: 0 !important;
            }
          }
        `}
              </style>
            </div >
          </div >
        )
      }


    </>
  );
}
