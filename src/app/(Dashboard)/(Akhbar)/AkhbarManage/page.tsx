"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Joyride, { CallBackProps, STATUS, Step } from "react-joyride";
import { useSelector } from "react-redux";
import {
  Home,
  Newspaper,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Loader2,
  UsersRound,
  Images,
  ClipboardCheck,
  FileText,
  ChevronLeft,
  ChevronRight,
  CircleCheck,
  Search,
  UserPlus,
  Upload,
  Music,
  Video,
  HelpCircle,
  FileImage,
} from "lucide-react";
import Breadcrumbkhabar from "@/component/Breadcrumb/Breadcrumb";
import DynamicTable from "@/component/DataTable/CustomTable1";
import FormInput from "@/component/Objects/FormInput1";
import TextArea from "@/component/Objects/Textarea1";
import PersianDateInput from "@/component/Objects/InputPersianDatePicker";
import CustomDropdown from "@/component/DFN/GetDFNByPID";
import GetDFNByPIDId from "@/component/DFN/GetDFNByPIDId";
import DropDownSelect from "@/component/Objects/DropDownSelect";
import { RootState } from "@/redux/store";
import { useConfirm } from "@/Utils/ConfirmModalContext";
import { showToast } from "@/component/CustomToast";
import {
  DeleteKhabar,
  GetAkhbarLookups,
  GetKhabar,
  GetKhabarList,
  InsertKhabar,
  InsertNoghteKhabarkhiz,
  UpdateKhabar,
  SearchAkhbarAshkhas,
  GetKhabarAshkhas,
  InsertKhabarShakhs,
  DeleteKhabarShakhs,
  UploadKhabarPeyvast,
  GetKhabarPeyvastha,
  DeleteKhabarPeyvast,
  GetKhabarPeyvastUrl,
} from "@/Lib/ApiServiceAkhbar";

type LookupItem = {
  ManbaKhabarId?: number;
  NoghteKhabarkhizId?: number;
  Mahal?: number;
  Onvan: string;
};

type KhabarShakhs = {
  KhabarShakhsId: number;
  ShomarehParvandeh: number;
  FirstName: string;
  LastName: string;
  NamePedar: string;
  TotalCount?: number;
};


type KhabarPeyvast = {
  KhabarPeyvastId: number;
  ShomareKhabar: number;
  FileName: string;
  FileSize: number;
  CreateDateTime: string;
};

type PeyvastKind = "image" | "video" | "audio" | "unknown";

function getPeyvastKind(fileName: string): PeyvastKind {
  const ext = (fileName.split(".").pop() || "").toLowerCase();
  if (["png", "jpg", "jpeg"].includes(ext)) return "image";
  if (["mp4", "webm", "mov", "m4v"].includes(ext)) return "video";
  if (ext === "mp3") return "audio";
  return "unknown";
}

function formatFileSize(kb: number) {
  const value = Number(kb || 0);
  if (value >= 1024) return `${(value / 1024).toFixed(1)} MB`;
  return `${value} KB`;
}

type FormState = {
  shomareKhabar: number;
  tabaqehBandi: number;
  manbaKhabarId: number;
  noeKhabar: number;
  tarikhNameh: string;
  shomareNameh: string;
  onvanKhabar: string;
  sharhKhabar: string;
  molahazatKhabar: string;
  noghteKhabarkhizId: number;
  mahalNoghteKhabarkhiz: string;
  tarikhEnteshar: string;
};

const emptyForm: FormState = {
  shomareKhabar: 0,
  tabaqehBandi: 1,
  manbaKhabarId: 0,
  noeKhabar: 1,
  tarikhNameh: "",
  shomareNameh: "",
  onvanKhabar: "",
  sharhKhabar: "",
  molahazatKhabar: "",
  noghteKhabarkhizId: 0,
  mahalNoghteKhabarkhiz: "",
  tarikhEnteshar: "",
};

type WizardStep = 1 | 2 | 3 | 4;

const wizardSteps = [
  { id: 1 as WizardStep, title: "مشخصات خبر", icon: FileText },
  { id: 2 as WizardStep, title: "اشخاص وابسته", icon: UsersRound },
  { id: 3 as WizardStep, title: "پیوست‌ها", icon: Images },
  { id: 4 as WizardStep, title: "مرور و ارسال", icon: ClipboardCheck },
];

export default function AkhbarManagePage() {
  const user = useSelector((state: RootState) => state.user);
  const { showConfirm } = useConfirm();

  const [rows, setRows] = useState<any[]>([]);
  const [hotspots, setHotspots] = useState<LookupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [hotspotModalOpen, setHotspotModalOpen] = useState(false);
  const [hotspotTitle, setHotspotTitle] = useState("");
  const [hotspotSaving, setHotspotSaving] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [tourRun, setTourRun] = useState(false);

  const [attachments, setAttachments] = useState<KhabarPeyvast[]>([]);
  const [activeAttachmentId, setActiveAttachmentId] = useState<number | null>(null);
  const [attachmentLoading, setAttachmentLoading] = useState(false);
  const [attachmentUploading, setAttachmentUploading] = useState(false);
  const [attachmentActionLoading, setAttachmentActionLoading] = useState<number | null>(null);


  const tourSteps: Step[] = useMemo(() => {
    if (currentStep === 1) {
      return [
        { target: '[data-tour="wizard-steps"]', content: "ثبت خبر در چهار مرحله انجام می‌شود. مرحله فعال با رنگ آبی مشخص است.", placement: "bottom", disableBeacon: true },
        { target: '[data-tour="spec-basic"]', content: "طبقه‌بندی، منبع و نوع خبر را از دراپ‌دان‌های استاندارد سامانه انتخاب کنید.", placement: "bottom" },
        { target: '[data-tour="spec-title"]', content: "عنوان خبر اجباری است و باید خلاصه و روشن نوشته شود.", placement: "bottom" },
        { target: '[data-tour="spec-texts"]', content: "شرح و ملاحظات خبر در این قسمت ثبت می‌شوند.", placement: "top" },
        { target: '[data-tour="spec-hotspot"]', content: "نقطه خبرخیز را انتخاب کنید؛ اگر انتخاب نشود، درج محل نقطه خبرخیز اجباری است.", placement: "top" },
        { target: '[data-tour="wizard-next"]', content: "با «ثبت و ادامه» خبر ثبت شده و شماره خبر برای مراحل بعد ساخته می‌شود.", placement: "top" },
      ];
    }
    if (currentStep === 2) {
      return [
        { target: '[data-tour="wizard-steps"]', content: "اکنون در مرحله تعیین اشخاص وابسته به خبر هستید.", placement: "bottom", disableBeacon: true },
        { target: '[data-tour="person-search"]', content: "نام، نام خانوادگی یا نام پدر را وارد کنید. جستجو دو ثانیه بعد از آخرین تایپ و در SQL انجام می‌شود.", placement: "bottom" },
        { target: '[data-tour="person-linked"]', content: "اشخاص اضافه‌شده به خبر اینجا نمایش داده می‌شوند و در صورت نیاز قابل حذف هستند.", placement: "top" },
        { target: '[data-tour="wizard-next"]', content: "بعد از تکمیل اشخاص، به مرحله پیوست‌ها بروید.", placement: "top" },
      ];
    }
    if (currentStep === 3) {
      return [
        { target: '[data-tour="wizard-steps"]', content: "در این مرحله پیوست‌های تصویر، ویدئو و MP3 خبر ثبت می‌شوند.", placement: "bottom", disableBeacon: true },
        { target: '[data-tour="attachment-upload"]', content: "فایل را انتخاب کنید. تصویر PNG/JPG/JPEG و MP3 تا 5MB و ویدئو تا 10MB مجاز است.", placement: "left" },
        { target: '[data-tour="attachment-list"]', content: "فهرست پیوست‌های ثبت‌شده و امکان حذف آن‌ها در این بخش قرار دارد.", placement: "left" },
        { target: '[data-tour="attachment-preview"]', content: "پیوست انتخابی به‌صورت بزرگ در این قسمت پیش‌نمایش می‌شود.", placement: "right" },
        { target: '[data-tour="attachment-thumbs"]', content: "نمای کوچک پیوست‌ها به‌صورت عمودی در سمت چپ پیش‌نمایش قرار دارد.", placement: "right" },
        { target: '[data-tour="wizard-next"]', content: "پس از بررسی پیوست‌ها، وارد مرور نهایی خبر شوید.", placement: "top" },
      ];
    }
    return [
      { target: '[data-tour="wizard-steps"]', content: "این مرحله برای مرور نهایی اطلاعات خبر است.", placement: "bottom", disableBeacon: true },
      { target: '[data-tour="review-info"]', content: "مشخصات اصلی خبر را قبل از بستن یا ارسال بررسی کنید.", placement: "top" },
      { target: '[data-tour="review-relations"]', content: "تعداد اشخاص وابسته و پیوست‌های خبر در این بخش خلاصه شده است.", placement: "top" },
    ];
  }, [currentStep]);

  const startTour = () => {
    setTourRun(false);
    window.setTimeout(() => setTourRun(true), 20);
  };

  const onTourCallback = (data: CallBackProps) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(data.status)) setTourRun(false);
  };

  useEffect(() => {
    setTourRun(false);
  }, [currentStep]);

  const [personSearch, setPersonSearch] = useState("");
  const [personDebouncedSearch, setPersonDebouncedSearch] = useState("");
  const [personSearchRows, setPersonSearchRows] = useState<KhabarShakhs[]>([]);
  const [linkedPersons, setLinkedPersons] = useState<KhabarShakhs[]>([]);
  const [personSearchPage, setPersonSearchPage] = useState(1);
  const [personSearchTotal, setPersonSearchTotal] = useState(0);
  const [personSearchLoading, setPersonSearchLoading] = useState(false);
  const [personSearchWaiting, setPersonSearchWaiting] = useState(false);
  const [personActionLoading, setPersonActionLoading] = useState<number | null>(null);
  const personPageSize = 8;

  const [page, setPage] = useState(1);
  const [sizePage] = useState(10);
  const [totalRecord, setTotalRecord] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortIndex, setSortIndex] = useState(1);
  const [sortDirection, setSortDirection] = useState(2);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => window.clearTimeout(t);
  }, [search]);

  useEffect(() => {
    const normalizedSearch = personSearch.trim();

    if (normalizedSearch.length < 2) {
      setPersonSearchWaiting(false);
      setPersonDebouncedSearch("");
      setPersonSearchPage(1);
      return;
    }

    // از همان لحظه توقف تایپ، لودینگ دوره انتظار Debounce نمایش داده شود.
    setPersonSearchWaiting(true);

    const t = window.setTimeout(() => {
      setPersonDebouncedSearch(normalizedSearch);
      setPersonSearchPage(1);
      setPersonSearchWaiting(false);
    }, 2000);

    return () => window.clearTimeout(t);
  }, [personSearch]);

  const loadLookups = useCallback(async () => {
    if (!user?.UserId) return;
    try {
      const res = await GetAkhbarLookups(user.UserId);
      setHotspots(res?.hotspots || []);
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در دریافت اطلاعات دراپ‌دان‌ها");
    }
  }, [user?.UserId]);

  const loadRows = useCallback(async () => {
    if (!user?.UserId) return;
    setLoading(true);
    try {
      const res = await GetKhabarList(
        user.UserId,
        page,
        sizePage,
        sortIndex,
        sortDirection,
        debouncedSearch
      );
      const data = res?.data || [];
      setRows(data);
      setTotalRecord(Number(data?.[0]?.TotalCount || 0));
    } catch (e) {
      setRows([]);
      setTotalRecord(0);
      showToast.error(e instanceof Error ? e.message : "خطا در دریافت فهرست اخبار");
    } finally {
      setLoading(false);
    }
  }, [user?.UserId, page, sizePage, sortIndex, sortDirection, debouncedSearch]);

  useEffect(() => {
    void loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    void loadRows();
  }, [loadRows]);

  const loadLinkedPersons = useCallback(async () => {
    if (!user?.UserId || !form.shomareKhabar) {
      setLinkedPersons([]);
      return;
    }

    try {
      const res = await GetKhabarAshkhas(form.shomareKhabar, user.UserId);
      setLinkedPersons(res?.data || []);
    } catch (e) {
      setLinkedPersons([]);
      showToast.error(e instanceof Error ? e.message : "خطا در دریافت اشخاص وابسته خبر");
    }
  }, [user?.UserId, form.shomareKhabar]);

  const searchPersons = useCallback(async () => {
    if (!form.shomareKhabar || personDebouncedSearch.length < 2) {
      setPersonSearchRows([]);
      setPersonSearchTotal(0);
      return;
    }

    setPersonSearchLoading(true);
    try {
      const res = await SearchAkhbarAshkhas(
        form.shomareKhabar,
        user?.UserId,
        personDebouncedSearch,
        personSearchPage,
        personPageSize
      );
      const data = res?.data || [];
      setPersonSearchRows(data);
      setPersonSearchTotal(Number(data?.[0]?.TotalCount || 0));
    } catch (e) {
      setPersonSearchRows([]);
      setPersonSearchTotal(0);
      showToast.error(e instanceof Error ? e.message : "خطا در جستجوی اشخاص");
    } finally {
      setPersonSearchLoading(false);
    }
  }, [form.shomareKhabar, user?.UserId, personDebouncedSearch, personSearchPage]);

  useEffect(() => {
    if (currentStep !== 2) return;
    void loadLinkedPersons();
  }, [currentStep, loadLinkedPersons]);

  useEffect(() => {
    if (currentStep !== 2) return;
    void searchPersons();
  }, [currentStep, searchPersons]);

  const loadAttachments = useCallback(async () => {
    if (!user?.UserId || !form.shomareKhabar) {
      setAttachments([]);
      setActiveAttachmentId(null);
      return;
    }
    setAttachmentLoading(true);
    try {
      const res = await GetKhabarPeyvastha(form.shomareKhabar, user.UserId);
      const data: KhabarPeyvast[] = res?.data || [];
      setAttachments(data);
      setActiveAttachmentId((current) =>
        current && data.some((x) => Number(x.KhabarPeyvastId) === Number(current))
          ? current
          : data.length > 0
            ? Number(data[0].KhabarPeyvastId)
            : null
      );
    } catch (e) {
      setAttachments([]);
      setActiveAttachmentId(null);
      showToast.error(e instanceof Error ? e.message : "خطا در دریافت پیوست‌های خبر");
    } finally {
      setAttachmentLoading(false);
    }
  }, [user?.UserId, form.shomareKhabar]);

  useEffect(() => {
    if (currentStep !== 3 && currentStep !== 4) return;
    void loadAttachments();
  }, [currentStep, loadAttachments]);

  const handleUploadAttachment = async (files: FileList | null) => {
    if (!files?.length || !user?.UserId || !form.shomareKhabar) return;

    const accepted = Array.from(files);
    const validateClient = (file: File) => {
      const ext = `.${(file.name.split(".").pop() || "").toLowerCase()}`;
      const image = [".png", ".jpg", ".jpeg"].includes(ext);
      const video = [".mp4", ".webm", ".mov", ".m4v"].includes(ext);
      const audio = ext === ".mp3";
      if (!image && !video && !audio) return "نوع فایل مجاز نیست.";
      const max = video ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      if (file.size > max) return video ? "حجم ویدئو حداکثر 10MB است." : audio ? "حجم MP3 حداکثر 5MB است." : "حجم تصویر حداکثر 5MB است.";
      return "";
    };

    for (const file of accepted) {
      const error = validateClient(file);
      if (error) {
        showToast.warning(`${file.name}: ${error}`);
        return;
      }
    }

    setAttachmentUploading(true);
    try {
      for (const file of accepted) {
        await UploadKhabarPeyvast(form.shomareKhabar, user.UserId, file);
      }
      showToast.success(accepted.length > 1 ? "پیوست‌ها با موفقیت ثبت شدند" : "پیوست با موفقیت ثبت شد");
      await loadAttachments();
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در ثبت پیوست");
    } finally {
      setAttachmentUploading(false);
    }
  };

  const handleDeleteAttachment = async (row: KhabarPeyvast) => {
    if (!user?.UserId) return;
    setAttachmentActionLoading(row.KhabarPeyvastId);
    try {
      await DeleteKhabarPeyvast(row.KhabarPeyvastId, user.UserId);
      showToast.success("پیوست حذف شد");
      await loadAttachments();
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در حذف پیوست");
    } finally {
      setAttachmentActionLoading(null);
    }
  };

  const activeAttachment = attachments.find((x) => Number(x.KhabarPeyvastId) === Number(activeAttachmentId)) || null;
  const activeAttachmentUrl = activeAttachment && user?.UserId
    ? GetKhabarPeyvastUrl(form.shomareKhabar, user.UserId, activeAttachment.FileName)
    : "";

  const handleAddPerson = async (row: KhabarShakhs) => {
    if (!user?.UserId || !form.shomareKhabar) return;

    setPersonActionLoading(row.ShomarehParvandeh);
    try {
      await InsertKhabarShakhs(form.shomareKhabar, row.ShomarehParvandeh, user.UserId);
      showToast.success("شخص به خبر اضافه شد");
      await loadLinkedPersons();
      await searchPersons();
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در افزودن شخص");
    } finally {
      setPersonActionLoading(null);
    }
  };

  const handleDeletePerson = async (row: KhabarShakhs) => {
    if (!user?.UserId || !row.KhabarShakhsId) return;

    setPersonActionLoading(row.KhabarShakhsId);
    try {
      await DeleteKhabarShakhs(row.KhabarShakhsId, user.UserId);
      showToast.success("شخص از خبر حذف شد");
      await loadLinkedPersons();
      await searchPersons();
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در حذف شخص");
    } finally {
      setPersonActionLoading(null);
    }
  };

  const openCreate = () => {
    setForm(emptyForm);
    setErrors({});
    setCurrentStep(1);
    setPersonSearch("");
    setPersonSearchRows([]);
    setLinkedPersons([]);
    setPersonSearchPage(1);
    setPersonSearchTotal(0);
    setAttachments([]);
    setActiveAttachmentId(null);
    setTourRun(false);
    setModalOpen(true);
  };

  const openEdit = async (row: any) => {
    if (!user?.UserId) return;
    setLoading(true);
    try {
      const res = await GetKhabar(row.ShomareKhabar, user.UserId);
      const d = res?.data;
      if (!d) {
        showToast.warning("اطلاعات خبر یافت نشد");
        return;
      }
      setForm({
        shomareKhabar: Number(d.ShomareKhabar || 0),
        tabaqehBandi: Number(d.TabaqehBandi || 1),
        manbaKhabarId: Number(d.ManbaKhabarId || 0),
        noeKhabar: Number(d.NoeKhabar || 1),
        tarikhNameh: (d.TarikhNameh || "").trim(),
        shomareNameh: d.ShomareNameh || "",
        onvanKhabar: d.OnvanKhabar || "",
        sharhKhabar: d.SharhKhabar || "",
        molahazatKhabar: d.MolahazatKhabar || "",
        noghteKhabarkhizId: Number(d.NoghteKhabarkhizId || 0),
        mahalNoghteKhabarkhiz: d.MahalNoghteKhabarkhiz || "",
        tarikhEnteshar: (d.TarikhEnteshar || "").trim(),
      });
      setErrors({});
      setCurrentStep(1);
      setPersonSearch("");
      setPersonSearchRows([]);
      setLinkedPersons([]);
      setPersonSearchPage(1);
      setPersonSearchTotal(0);
      setModalOpen(true);
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در دریافت خبر");
    } finally {
      setLoading(false);
    }
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: false }));
  };

  const validate = () => {
    const e: Record<string, boolean> = {};
    if (!form.tabaqehBandi) e.tabaqehBandi = true;
    if (!form.manbaKhabarId) e.manbaKhabarId = true;
    if (!form.noeKhabar) e.noeKhabar = true;
    if (!form.onvanKhabar.trim()) e.onvanKhabar = true;
    if (!form.sharhKhabar.trim()) e.sharhKhabar = true;
    if (!form.molahazatKhabar.trim()) e.molahazatKhabar = true;
    if (!form.noghteKhabarkhizId && !form.mahalNoghteKhabarkhiz.trim()) {
      e.mahalNoghteKhabarkhiz = true;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInsertHotspot = async () => {
    if (!user?.UserId) {
      showToast.error("اطلاعات کاربر در دسترس نیست");
      return;
    }

    const title = hotspotTitle.trim();
    if (!title) {
      showToast.warning("عنوان نقطه خبرخیز را وارد کنید");
      return;
    }

    setHotspotSaving(true);
    try {
      const res = await InsertNoghteKhabarkhiz(title, user.UserId);
      const newId = Number(res?.data?.NoghteKhabarkhizId || 0);
      await loadLookups();
      if (newId) setField("noghteKhabarkhizId", newId);
      setHotspotTitle("");
      setHotspotModalOpen(false);
      showToast.success("نقطه خبرخیز برای محل شما ثبت شد");
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در ثبت نقطه خبرخیز");
    } finally {
      setHotspotSaving(false);
    }
  };

  const saveSpecificationsAndContinue = async () => {
    if (!user?.UserId || !validate()) {
      if (!user?.UserId) showToast.error("اطلاعات کاربر در دسترس نیست");
      else showToast.warning("فیلدهای اجباری را تکمیل کنید");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        noghteKhabarkhizId: form.noghteKhabarkhizId || null,
      };

      let savedNumber = form.shomareKhabar;

      if (form.shomareKhabar > 0) {
        await UpdateKhabar({ ...payload, lastEditUserId: user.UserId });
        showToast.success("مشخصات خبر اصلاح شد");
      } else {
        const res = await InsertKhabar({ ...payload, createUserId: user.UserId });
        savedNumber = Number(res?.data?.ShomareKhabar || 0);
        if (!savedNumber) throw new Error("شماره خبر پس از ثبت دریافت نشد");

        setForm((prev) => ({ ...prev, shomareKhabar: savedNumber }));
        showToast.success(`خبر با شماره ${savedNumber} ثبت شد`);
      }

      setPage(1);
      await loadRows();
      setCurrentStep(2);
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در ثبت اطلاعات خبر");
    } finally {
      setSaving(false);
    }
  };

  const closeWizard = async () => {
    setTourRun(false);
    setModalOpen(false);
    setCurrentStep(1);
    await loadRows();
  };

  const handleDelete = async (shomareKhabar: number) => {
    if (!user?.UserId) return;
    try {
      await DeleteKhabar(shomareKhabar, user.UserId);
      showToast.success("خبر حذف شد");
      if (rows.length === 1 && page > 1) setPage((p) => p - 1);
      else await loadRows();
    } catch (e) {
      showToast.error(e instanceof Error ? e.message : "خطا در حذف خبر");
    }
  };

  const sortMap = useMemo<Record<string, number>>(
    () => ({
      ShomareKhabar: 1,
      OnvanKhabar: 2,
      TabaqehBandiName: 3,
      NoeKhabarName: 4,
      CreateDateTime: 5,
    }),
    []
  );

  const columns = useMemo(
    () => [
      { title: "ردیف", field: "Rdf", width: "70px" },
      { title: "شماره خبر", field: "ShomareKhabar", width: "110px" },
      { title: "عنوان خبر", field: "OnvanKhabar" },
      { title: "طبقه‌بندی", field: "TabaqehBandiName", width: "130px" },
      { title: "نوع خبر", field: "NoeKhabarName", width: "110px" },
      { title: "منبع خبر", field: "ManbaKhabarName", width: "150px" },
      { title: "تاریخ انتشار", field: "TarikhEnteshar", width: "120px" },
      { title: "تاریخ ایجاد", field: "CreateDateTime", width: "170px" },
    ],
    []
  );

  return (
    <div className="relative">
      <Joyride
        steps={tourSteps}
        run={tourRun}
        continuous
        showProgress
        showSkipButton
        scrollToFirstStep
        callback={onTourCallback}
        styles={{
          options: { zIndex: 1500, primaryColor: "#0369a1" },
          tooltip: { fontFamily: "Shabnam", direction: "rtl", textAlign: "right" },
          buttonNext: { fontFamily: "Shabnam" },
          buttonBack: { fontFamily: "Shabnam" },
          buttonSkip: { fontFamily: "Shabnam" },
        }}
        locale={{ back: "قبلی", close: "بستن", last: "اتمام", next: "بعدی", skip: "رد کردن" }}
      />
      <div className="bg-sky-200 mt-1 mx-1 rounded py-2 px-10">
        <Breadcrumbkhabar
          items={[
            { label: "داشبورد", href: "/Dashboard", icon: <Home className="w-4 h-4" /> },
            { label: "مدیریت اخبار", icon: <Newspaper className="w-4 h-4" /> },
          ]}
        />
      </div>

      <div className="bg-white m-1 p-3 rounded-b-xl shadow-sm min-h-[400px]">
        <DynamicTable
          data={rows}
          columns={columns}
          title="اخبار ثبت‌شده توسط من"
          totalRecord={totalRecord}
          recordsPerPage={sizePage}
          page={page}
          search={search}
          onPageChange={setPage}
          onSearch={setSearch}
          onRefresh={() => void loadRows()}
          onSortChange={(field, direction) => {
            setSortIndex(sortMap[field] || 1);
            setSortDirection(direction === "asc" ? 1 : 2);
            setPage(1);
          }}
          rowKeyField="ShomareKhabar"
          headerActions={[
            {
              icon: <Plus size={17} />,
              title: "ثبت خبر جدید",
              onClick: openCreate,
              className: "bg-blue-600 hover:bg-blue-500",
            },
          ]}
          actions={[
            {
              icon: <Pencil size={15} />,
              title: "ویرایش",
              colorClass: "bg-amber-500",
              onClick: (row) => void openEdit(row),
            },
            {
              icon: <Trash2 size={15} />,
              title: "حذف",
              colorClass: "bg-red-600",
              onClick: (row) =>
                showConfirm(
                  `خبر شماره ${row.ShomareKhabar} حذف شود؟`,
                  () => void handleDelete(Number(row.ShomareKhabar)),
                  "حذف خبر",
                  "error"
                ),
            },
          ]}
        />
      </div>

      {loading && (
        <div className="fixed inset-0 z-[1000] bg-black/10 flex items-center justify-center pointer-events-none">
          <div className="bg-white rounded-xl shadow px-5 py-3 flex items-center gap-2 text-gray-700">
            <Loader2 className="animate-spin" size={18} /> در حال دریافت اطلاعات...
          </div>
        </div>
      )}

      {hotspotModalOpen && (
        <div className="fixed inset-0 z-[1200] bg-black/35 flex items-center justify-center p-3" dir="rtl">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-sky-100 border-b px-5 py-3 flex items-center justify-between">
              <span className="text-[16px] text-gray-800">افزودن نقطه خبرخیز</span>
              <button
                type="button"
                onClick={() => setHotspotModalOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-4">
              <FormInput
                label="عنوان نقطه خبرخیز"
                required
                value={hotspotTitle}
                onChange={(e) => setHotspotTitle(e.target.value)}
                maxLength={300}
              />
              <div className="mt-2 text-[12px] text-gray-500">این نقطه فقط برای محل کاربری شما ثبت و در اخبار همین محل قابل انتخاب است.</div>
            </div>
            <div className="border-t bg-gray-50 px-4 py-3 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHotspotModalOpen(false)}
                className="h-9 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={() => void handleInsertHotspot()}
                disabled={hotspotSaving}
                className="h-9 px-4 rounded-lg bg-green-700 hover:bg-green-600 text-white inline-flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {hotspotSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                ثبت نقطه
              </button>
            </div>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[1100] bg-black/35 flex items-center justify-center p-3" dir="rtl">
          <div className="bg-white w-full max-w-6xl max-h-[94vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
            <div className="bg-sky-100 border-b px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-800">
                <Newspaper size={19} />
                <span className="text-[17px]">
                  {form.shomareKhabar ? `خبر شماره ${form.shomareKhabar}` : "ثبت خبر جدید"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startTour}
                  className="h-8 px-3 rounded-lg border border-sky-300 bg-white/80 hover:bg-white text-sky-800 inline-flex items-center gap-1.5 cursor-pointer text-[12px]"
                  title="راهنمای این مرحله"
                >
                  <HelpCircle size={16} />
                  راهنما
                </button>
                <button
                  type="button"
                  onClick={() => void closeWizard()}
                  className="w-8 h-8 rounded-full hover:bg-white flex items-center justify-center cursor-pointer"
                  title="بستن"
                >
                  <X size={19} />
                </button>
              </div>
            </div>

            <div className="px-4 pt-4 pb-2 border-b bg-white" data-tour="wizard-steps">
              <div className="grid grid-cols-4 gap-2">
                {wizardSteps.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.id;
                  const isDone = currentStep > step.id;
                  return (
                    <div key={step.id} className="relative">
                      {index < wizardSteps.length - 1 && (
                        <div
                          className={`absolute top-[19px] right-[58%] w-[84%] h-[2px] ${
                            isDone ? "bg-emerald-500" : "bg-gray-200"
                          }`}
                        />
                      )}
                      <div className="relative z-10 flex flex-col items-center gap-1">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition ${
                            isActive
                              ? "bg-sky-600 border-sky-600 text-white shadow"
                              : isDone
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "bg-white border-gray-300 text-gray-400"
                          }`}
                        >
                          {isDone ? <CircleCheck size={19} /> : <StepIcon size={18} />}
                        </div>
                        <div
                          className={`text-[12px] md:text-[13px] text-center ${
                            isActive ? "text-sky-800" : isDone ? "text-emerald-700" : "text-gray-500"
                          }`}
                        >
                          {step.title}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 overflow-y-auto flex-1">
              {currentStep === 1 && (
                <div>
                  <div className="mb-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-2 text-[13px] text-sky-900">
                    ابتدا مشخصات خبر را تکمیل کنید. با «ثبت و ادامه» خبر در پایگاه داده ثبت می‌شود و شماره خبر برای مراحل بعد ایجاد می‌گردد.
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-tour="spec-basic">
                    <CustomDropdown
                      PID={71101}
                      label="طبقه‌بندی خبر"
                      required
                      defaultValue={form.tabaqehBandi || undefined}
                      onSelect={(item) => setField("tabaqehBandi", Number(item?.Value || 0))}
                      error={errors.tabaqehBandi}
                      errorMessage={errors.tabaqehBandi ? "طبقه‌بندی خبر اجباری است" : undefined}
                    />

                    <GetDFNByPIDId
                      PID={10201}
                      instanceId="akhbar-manba-khabar"
                      label="منبع خبر"
                      placeholder="جستجو و انتخاب منبع خبر..."
                      required
                      value={form.manbaKhabarId}
                      onChange={(v) => setField("manbaKhabarId", v)}
                      error={errors.manbaKhabarId}
                      errorMessage={errors.manbaKhabarId ? "منبع خبر اجباری است" : undefined}
                    />

                    <CustomDropdown
                      PID={71102}
                      label="نوع خبر"
                      required
                      defaultValue={form.noeKhabar || undefined}
                      onSelect={(item) => setField("noeKhabar", Number(item?.Value || 0))}
                      error={errors.noeKhabar}
                      errorMessage={errors.noeKhabar ? "نوع خبر اجباری است" : undefined}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                    <PersianDateInput
                      label="تاریخ نامه"
                      value={form.tarikhNameh}
                      allowPastDates
                      onChange={(v) => setField("tarikhNameh", v || "")}
                    />
                    <FormInput
                      label="شماره نامه"
                      value={form.shomareNameh}
                      onChange={(e) => setField("shomareNameh", e.target.value)}
                      maxLength={100}
                    />
                    <PersianDateInput
                      label="تاریخ انتشار"
                      value={form.tarikhEnteshar}
                      allowPastDates
                      onChange={(v) => setField("tarikhEnteshar", v || "")}
                    />
                  </div>

                  <div className="mt-3" data-tour="spec-title">
                    <FormInput
                      label="عنوان خبر"
                      required
                      value={form.onvanKhabar}
                      onChange={(e) => setField("onvanKhabar", e.target.value)}
                      maxLength={500}
                      error={errors.onvanKhabar}
                      errorMessage={errors.onvanKhabar ? "عنوان خبر اجباری است" : undefined}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3" data-tour="spec-texts">
                    <TextArea
                      label="شرح خبر *"
                      value={form.sharhKhabar}
                      onChange={(e) => setField("sharhKhabar", e.target.value)}
                      rows={7}
                      height="h-44"
                      error={errors.sharhKhabar}
                      errorMessage={errors.sharhKhabar ? "شرح خبر اجباری است" : undefined}
                    />
                    <TextArea
                      label="ملاحظات خبر *"
                      value={form.molahazatKhabar}
                      onChange={(e) => setField("molahazatKhabar", e.target.value)}
                      rows={7}
                      height="h-44"
                      error={errors.molahazatKhabar}
                      errorMessage={errors.molahazatKhabar ? "ملاحظات خبر اجباری است" : undefined}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3" data-tour="spec-hotspot">
                    <div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <DropDownSelect
                            instanceId="akhbar-noghte-khabarkhiz"
                            label="نقطه خبرخیز"
                            value={form.noghteKhabarkhizId}
                            onChange={(v) => setField("noghteKhabarkhizId", v)}
                            placeholder="انتخاب نشده"
                            options={hotspots.map((item) => ({
                              value: Number(item.NoghteKhabarkhizId || 0),
                              label: item.Onvan,
                            }))}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setHotspotTitle("");
                            setHotspotModalOpen(true);
                          }}
                          className="h-9 mb-[1px] px-3 rounded-lg border border-sky-300 bg-sky-50 hover:bg-sky-100 text-sky-800 inline-flex items-center gap-1 cursor-pointer whitespace-nowrap"
                          title="افزودن نقطه خبرخیز برای محل من"
                        >
                          <Plus size={15} /> افزودن
                        </button>
                      </div>
                      <div className="text-[12px] text-gray-500 mt-1">فقط نقاط خبرخیز محل کاربر نمایش داده می‌شود.</div>
                    </div>

                    <FormInput
                      label={`محل نقطه خبرخیز${form.noghteKhabarkhizId ? "" : " *"}`}
                      value={form.mahalNoghteKhabarkhiz}
                      onChange={(e) => setField("mahalNoghteKhabarkhiz", e.target.value)}
                      maxLength={500}
                      error={errors.mahalNoghteKhabarkhiz}
                      errorMessage={
                        errors.mahalNoghteKhabarkhiz
                          ? "در صورت عدم انتخاب نقطه خبرخیز، درج محل اجباری است"
                          : undefined
                      }
                    />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                    <div>
                      <div className="text-[17px] text-gray-800 flex items-center gap-2">
                        <UsersRound size={19} className="text-sky-700" />
                        اشخاص وابسته به خبر
                      </div>
                      <div className="text-[12px] text-gray-500 mt-1">
                        جستجو فقط بر اساس نام، نام خانوادگی و نام پدر انجام می‌شود و عبارت‌های مشابه هم پیدا می‌شوند.
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-100 border px-3 py-2 text-[13px] text-gray-700">
                      شماره خبر: <span className="text-sky-800">{form.shomareKhabar}</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-3 mb-4" data-tour="person-search">
                    <label className="text-[12px] text-gray-700 mb-1 block">جستجوی شخص</label>
                    <div className="relative">
                      <Search size={17} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={personSearch}
                        onChange={(e) => setPersonSearch(e.target.value)}
                        placeholder="نام، نام خانوادگی یا نام پدر را وارد کنید..."
                        className="w-full h-10 rounded-lg border border-gray-300 bg-white pr-10 pl-3 outline-none focus:border-sky-500 text-[13px]"
                      />
                      {(personSearchWaiting || personSearchLoading) && (
                        <Loader2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 animate-spin text-sky-600" />
                      )}
                    </div>
                    <div className="text-[11px] text-gray-500 mt-1">
                      جستجو از ۲ کاراکتر شروع می‌شود؛ عبارت چندکلمه‌ای و مشابه پشتیبانی می‌شود و ۲ ثانیه بعد از آخرین تغییر متن، در SQL انجام می‌شود.
                    </div>

                    {(personSearchWaiting || personSearchLoading) && personSearch.trim().length >= 2 && (
                      <div className="mt-2 h-9 rounded-lg border border-sky-200 bg-white/80 px-3 flex items-center gap-2 text-[12px] text-sky-700">
                        <Loader2 size={16} className="animate-spin shrink-0" />
                        <span>
                          {personSearchWaiting ? "در انتظار جستجو..." : "در حال جستجو در اشخاص..."}
                        </span>
                      </div>
                    )}
                  </div>

                  {personDebouncedSearch.length >= 2 && (
                    <div className="border rounded-xl overflow-hidden mb-4">
                      <div className="grid grid-cols-[55px_1fr_1fr_1fr_90px] bg-gray-100 border-b text-[12px] text-gray-700">
                        <div className="p-2 text-center">ردیف</div>
                        <div className="p-2">نام</div>
                        <div className="p-2">نام خانوادگی</div>
                        <div className="p-2">نام پدر</div>
                        <div className="p-2 text-center">افزودن</div>
                      </div>

                      {personSearchRows.length > 0 ? (
                        personSearchRows.map((row, index) => (
                          <div
                            key={row.ShomarehParvandeh}
                            className="grid grid-cols-[55px_1fr_1fr_1fr_90px] border-b last:border-b-0 text-[13px] items-center bg-white hover:bg-sky-50/40"
                          >
                            <div className="p-2 text-center text-gray-500">
                              {(personSearchPage - 1) * personPageSize + index + 1}
                            </div>
                            <div className="p-2">{row.FirstName}</div>
                            <div className="p-2">{row.LastName}</div>
                            <div className="p-2">{row.NamePedar}</div>
                            <div className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => void handleAddPerson(row)}
                                disabled={personActionLoading === row.ShomarehParvandeh}
                                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white inline-flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                              >
                                {personActionLoading === row.ShomarehParvandeh ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <UserPlus size={14} />
                                )}
                                افزودن
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="min-h-20 flex items-center justify-center text-[13px] text-gray-400 bg-white">
                          {personSearchWaiting ? "در انتظار شروع جستجو..." : personSearchLoading ? "در حال جستجو..." : "شخصی با عبارت واردشده یافت نشد."}
                        </div>
                      )}

                      {personSearchTotal > personPageSize && (
                        <div className="bg-gray-50 border-t px-3 py-2 flex items-center justify-between text-[12px]">
                          <div>تعداد نتیجه: {personSearchTotal}</div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              disabled={personSearchPage <= 1}
                              onClick={() => setPersonSearchPage((p) => Math.max(1, p - 1))}
                              className="w-8 h-8 rounded border bg-white disabled:opacity-40 cursor-pointer"
                            >
                              <ChevronRight size={15} className="mx-auto" />
                            </button>
                            <span className="px-2">
                              صفحه {personSearchPage} از {Math.max(1, Math.ceil(personSearchTotal / personPageSize))}
                            </span>
                            <button
                              type="button"
                              disabled={personSearchPage >= Math.ceil(personSearchTotal / personPageSize)}
                              onClick={() => setPersonSearchPage((p) => p + 1)}
                              className="w-8 h-8 rounded border bg-white disabled:opacity-40 cursor-pointer"
                            >
                              <ChevronLeft size={15} className="mx-auto" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-2 text-[13px] text-gray-700">
                    اشخاص اضافه‌شده به خبر
                    <span className="mr-2 rounded-full bg-sky-100 text-sky-800 px-2 py-0.5 text-[11px]">
                      {linkedPersons.length}
                    </span>
                  </div>

                  <div className="border rounded-xl overflow-hidden" data-tour="person-linked">
                    <div className="grid grid-cols-[55px_1fr_1fr_1fr_90px] bg-gray-100 border-b text-[12px] text-gray-700">
                      <div className="p-2 text-center">ردیف</div>
                      <div className="p-2">نام</div>
                      <div className="p-2">نام خانوادگی</div>
                      <div className="p-2">نام پدر</div>
                      <div className="p-2 text-center">عملیات</div>
                    </div>

                    {linkedPersons.length > 0 ? (
                      linkedPersons.map((row, index) => (
                        <div
                          key={row.KhabarShakhsId}
                          className="grid grid-cols-[55px_1fr_1fr_1fr_90px] border-b last:border-b-0 text-[13px] items-center bg-white"
                        >
                          <div className="p-2 text-center text-gray-500">{index + 1}</div>
                          <div className="p-2">{row.FirstName}</div>
                          <div className="p-2">{row.LastName}</div>
                          <div className="p-2">{row.NamePedar}</div>
                          <div className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() =>
                                showConfirm(
                                  `${row.FirstName} ${row.LastName} از وابستگان خبر حذف شود؟`,
                                  () => void handleDeletePerson(row),
                                  "حذف شخص",
                                  "error"
                                )
                              }
                              disabled={personActionLoading === row.KhabarShakhsId}
                              className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-white inline-flex items-center justify-center disabled:opacity-50 cursor-pointer"
                              title="حذف از خبر"
                            >
                              {personActionLoading === row.KhabarShakhsId ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <Trash2 size={14} />
                              )}
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="min-h-28 flex flex-col items-center justify-center text-gray-400 gap-2 bg-white">
                        <UsersRound size={30} strokeWidth={1.4} />
                        <div className="text-[13px]">هنوز شخصی به این خبر اضافه نشده است.</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                    <div>
                      <div className="text-[17px] text-gray-800 flex items-center gap-2">
                        <Images size={19} className="text-sky-700" />
                        پیوست‌های خبر
                      </div>
                      <div className="text-[12px] text-gray-500 mt-1">
                        تصویر PNG/JPG/JPEG و MP3 تا 5MB و ویدئو تا 10MB قابل ثبت است. نام فایل در بانک فایل با GUID ذخیره می‌شود.
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-100 border px-3 py-2 text-[13px] text-gray-700">
                      شماره خبر: <span className="text-sky-800">{form.shomareKhabar}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)] gap-4 items-stretch" dir="ltr">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-4 min-h-[430px] flex flex-col lg:order-2" data-tour="attachment-upload" dir="rtl">
                      <div className="text-[14px] text-gray-800 mb-3 flex items-center gap-2">
                        <Upload size={17} className="text-sky-700" />
                        افزودن و مدیریت پیوست
                      </div>

                      <label className={`rounded-xl border-2 border-dashed border-sky-300 bg-white min-h-32 flex flex-col items-center justify-center text-center px-4 transition ${attachmentUploading ? "opacity-60 cursor-wait" : "hover:bg-sky-50 cursor-pointer"}`}>
                        {attachmentUploading ? <Loader2 size={28} className="animate-spin text-sky-600" /> : <Upload size={30} className="text-sky-600" />}
                        <div className="mt-2 text-[13px] text-gray-700">{attachmentUploading ? "در حال ذخیره فایل..." : "برای انتخاب فایل کلیک کنید"}</div>
                        <div className="mt-1 text-[11px] text-gray-500">امکان انتخاب چند فایل وجود دارد</div>
                        <input
                          type="file"
                          multiple
                          disabled={attachmentUploading}
                          accept=".png,.jpg,.jpeg,.mp3,audio/mpeg,video/*,.mp4,.webm,.mov,.m4v"
                          className="hidden"
                          onChange={(e) => {
                            void handleUploadAttachment(e.target.files);
                            e.currentTarget.value = "";
                          }}
                        />
                      </label>

                      <div className="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                        <div className="rounded-lg border bg-white px-2 py-2 text-center"><FileImage size={16} className="mx-auto mb-1 text-emerald-600" />تصویر<br />حداکثر 5MB</div>
                        <div className="rounded-lg border bg-white px-2 py-2 text-center"><Video size={16} className="mx-auto mb-1 text-violet-600" />ویدئو<br />حداکثر 10MB</div>
                        <div className="rounded-lg border bg-white px-2 py-2 text-center"><Music size={16} className="mx-auto mb-1 text-amber-600" />MP3<br />حداکثر 5MB</div>
                      </div>

                      <div className="mt-4 flex-1 min-h-0" data-tour="attachment-list">
                        <div className="flex items-center justify-between mb-2">
                          <div className="text-[13px] text-gray-700">پیوست‌های ثبت‌شده</div>
                          <span className="rounded-full bg-sky-100 text-sky-800 px-2 py-0.5 text-[11px]">{attachments.length}</span>
                        </div>

                        <div className="border rounded-xl overflow-hidden bg-white max-h-52 overflow-y-auto">
                          {attachmentLoading ? (
                            <div className="h-24 flex items-center justify-center gap-2 text-[12px] text-gray-500"><Loader2 size={16} className="animate-spin" /> در حال دریافت پیوست‌ها...</div>
                          ) : attachments.length ? (
                            attachments.map((item, index) => (
                              <div key={item.KhabarPeyvastId} className={`px-3 py-2 border-b last:border-b-0 flex items-center gap-2 text-[12px] ${Number(activeAttachmentId) === Number(item.KhabarPeyvastId) ? "bg-sky-50" : "hover:bg-gray-50"}`}>
                                <button type="button" onClick={() => setActiveAttachmentId(Number(item.KhabarPeyvastId))} className="flex-1 min-w-0 text-right cursor-pointer">
                                  <div className="truncate text-gray-800">{index + 1}. {item.FileName}</div>
                                  <div className="text-[10px] text-gray-400 mt-0.5">{formatFileSize(item.FileSize)}</div>
                                </button>
                                <button
                                  type="button"
                                  disabled={attachmentActionLoading === item.KhabarPeyvastId}
                                  onClick={() => showConfirm("این پیوست حذف شود؟", () => void handleDeleteAttachment(item), "حذف پیوست", "error")}
                                  className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-500 text-white inline-flex items-center justify-center disabled:opacity-50 cursor-pointer"
                                  title="حذف پیوست"
                                >
                                  {attachmentActionLoading === item.KhabarPeyvastId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="h-24 flex items-center justify-center text-[12px] text-gray-400">هنوز پیوستی ثبت نشده است.</div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-3 min-h-[430px] lg:order-1" dir="ltr">
                      <div className="grid grid-cols-[76px_minmax(0,1fr)] gap-3 h-full min-h-[400px]">
                        <div className="border-r pr-2 overflow-y-auto max-h-[520px] space-y-2" data-tour="attachment-thumbs">
                          {attachments.map((item) => {
                            const kind = getPeyvastKind(item.FileName);
                            const url = user?.UserId ? GetKhabarPeyvastUrl(form.shomareKhabar, user.UserId, item.FileName) : "";
                            const active = Number(activeAttachmentId) === Number(item.KhabarPeyvastId);
                            return (
                              <button
                                type="button"
                                key={item.KhabarPeyvastId}
                                onClick={() => setActiveAttachmentId(Number(item.KhabarPeyvastId))}
                                className={`w-16 h-16 rounded-lg border-2 overflow-hidden bg-gray-50 flex items-center justify-center cursor-pointer ${active ? "border-sky-500 ring-2 ring-sky-100" : "border-gray-200 hover:border-sky-300"}`}
                                title={item.FileName}
                              >
                                {kind === "image" ? (
                                  <img src={url} alt="پیوست خبر" className="w-full h-full object-cover" />
                                ) : kind === "video" ? (
                                  <Video size={24} className="text-violet-600" />
                                ) : kind === "audio" ? (
                                  <Music size={24} className="text-amber-600" />
                                ) : (
                                  <FileImage size={24} className="text-gray-500" />
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <div className="rounded-xl bg-gray-950/95 overflow-hidden flex items-center justify-center relative min-h-[390px]" data-tour="attachment-preview" dir="rtl">
                          {activeAttachment && activeAttachmentUrl ? (
                            getPeyvastKind(activeAttachment.FileName) === "image" ? (
                              <img src={activeAttachmentUrl} alt="پیش‌نمایش پیوست" className="max-w-full max-h-[510px] object-contain" />
                            ) : getPeyvastKind(activeAttachment.FileName) === "video" ? (
                              <video src={activeAttachmentUrl} controls className="w-full max-h-[510px] bg-black" />
                            ) : getPeyvastKind(activeAttachment.FileName) === "audio" ? (
                              <div className="w-full px-8 text-center">
                                <Music size={58} className="mx-auto text-amber-400 mb-5" />
                                <audio src={activeAttachmentUrl} controls className="w-full" />
                                <div className="text-white/70 text-[11px] mt-3 break-all">{activeAttachment.FileName}</div>
                              </div>
                            ) : (
                              <div className="text-white/60 text-center"><FileImage size={48} className="mx-auto mb-2" />پیش‌نمایش این فایل در دسترس نیست.</div>
                            )
                          ) : (
                            <div className="text-white/55 text-center px-4">
                              <Images size={52} className="mx-auto mb-3" strokeWidth={1.2} />
                              <div className="text-[14px]">برای مشاهده پیش‌نمایش، یک پیوست انتخاب کنید.</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div>
                  <div className="mb-4">
                    <div className="text-[17px] text-gray-800 flex items-center gap-2">
                      <ClipboardCheck size={19} className="text-sky-700" />
                      مرور خبر
                    </div>
                    <div className="text-[12px] text-gray-500 mt-1">
                      قبل از ارسال، اطلاعات خبر و بخش‌های وابسته در این صفحه مرور می‌شوند.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3" data-tour="review-info">
                    <div className="rounded-xl border bg-gray-50 p-3">
                      <div className="text-[11px] text-gray-500">شماره خبر</div>
                      <div className="mt-1 text-[15px] text-gray-800">{form.shomareKhabar}</div>
                    </div>
                    <div className="rounded-xl border bg-gray-50 p-3">
                      <div className="text-[11px] text-gray-500">شماره نامه</div>
                      <div className="mt-1 text-[14px] text-gray-800">{form.shomareNameh || "—"}</div>
                    </div>
                    <div className="rounded-xl border bg-gray-50 p-3">
                      <div className="text-[11px] text-gray-500">تاریخ انتشار</div>
                      <div className="mt-1 text-[14px] text-gray-800">{form.tarikhEnteshar || "—"}</div>
                    </div>
                  </div>

                  <div className="rounded-xl border mt-3 p-4">
                    <div className="text-[11px] text-gray-500">عنوان خبر</div>
                    <div className="mt-1 text-[16px] text-gray-900">{form.onvanKhabar}</div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                    <div className="rounded-xl border p-4 min-h-36">
                      <div className="text-[11px] text-gray-500 mb-2">شرح خبر</div>
                      <div className="text-[13px] leading-7 text-gray-800 whitespace-pre-wrap">{form.sharhKhabar}</div>
                    </div>
                    <div className="rounded-xl border p-4 min-h-36">
                      <div className="text-[11px] text-gray-500 mb-2">ملاحظات خبر</div>
                      <div className="text-[13px] leading-7 text-gray-800 whitespace-pre-wrap">{form.molahazatKhabar}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3" data-tour="review-relations">
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-2 text-[14px] text-gray-800">
                        <UsersRound size={17} className="text-gray-500" />
                        اشخاص وابسته
                      </div>
                      <div className="mt-2 text-[12px] text-gray-500">
                        {linkedPersons.length > 0
                          ? `${linkedPersons.length} شخص به این خبر متصل شده است.`
                          : "شخصی به این خبر متصل نشده است."}
                      </div>
                    </div>
                    <div className="rounded-xl border p-4">
                      <div className="flex items-center gap-2 text-[14px] text-gray-800">
                        <Images size={17} className="text-gray-500" />
                        پیوست‌های خبر
                      </div>
                      <div className="mt-2 text-[12px] text-gray-500">{attachments.length > 0 ? `${attachments.length} پیوست به این خبر متصل شده است.` : "پیوستی به این خبر متصل نشده است."}</div>
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12px] text-amber-900">
                    دکمه ارسال خبر پس از تکمیل گردش‌کار فعال می‌شود. فعلاً خبر به‌عنوان رکورد ثبت‌شده نگهداری می‌شود.
                  </div>
                </div>
              )}
            </div>

            <div className="border-t bg-gray-50 px-4 py-3 flex items-center justify-between gap-2">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((currentStep - 1) as WizardStep)}
                    className="h-9 px-4 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer inline-flex items-center gap-1"
                  >
                    <ChevronRight size={16} />
                    مرحله قبل
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void closeWizard()}
                  className="h-9 px-5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 cursor-pointer"
                >
                  {currentStep === 4 ? "بستن" : "انصراف"}
                </button>

                {currentStep === 1 && (
                  <button
                    type="button"
                    onClick={() => void saveSpecificationsAndContinue()}
                    data-tour="wizard-next"
                    disabled={saving}
                    className="h-9 px-5 rounded-lg bg-green-700 hover:bg-green-600 text-white flex items-center gap-2 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    ثبت و ادامه
                    {!saving && <ChevronLeft size={16} />}
                  </button>
                )}

                {currentStep === 2 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    data-tour="wizard-next"
                    className="h-9 px-5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white flex items-center gap-2 cursor-pointer"
                  >
                    مرحله بعد
                    <ChevronLeft size={16} />
                  </button>
                )}

                {currentStep === 3 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    data-tour="wizard-next"
                    className="h-9 px-5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white flex items-center gap-2 cursor-pointer"
                  >
                    مرور نهایی
                    <ChevronLeft size={16} />
                  </button>
                )}

                {currentStep === 4 && (
                  <button
                    type="button"
                    onClick={() => void closeWizard()}
                    className="h-9 px-5 rounded-lg bg-green-700 hover:bg-green-600 text-white flex items-center gap-2 cursor-pointer"
                  >
                    <CircleCheck size={16} />
                    ذخیره و بستن
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
