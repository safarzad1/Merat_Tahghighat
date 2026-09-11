export interface FieldConfig {
    name: string;
    label: string;
    placeholder?: string;
    required?: boolean;
    errorMessage?: string;
    type?: "text" | "number" | "tarikh" | "dropdown"; // مشخص می‌کند فیلد حروفی است یا عددی
    dropdownCode?: number; // برای دراپ‌داون
    maxLength?: number; // حداکثر طول کاراکتر
    value?: string | number;
}
export const personalFields: FieldConfig[] = [
    { name: "firstname", label: "نام", required: true, errorMessage: "نام نمی‌تواند خالی باشد", type: "text", maxLength: 20 },
    { name: "lastname", label: "نام خانوادگی", required: true, errorMessage: "نام خانوادگی نمی‌تواند خالی باشد", type: "text", maxLength: 30 },
    { name: "fathername", label: "نام پدر", required: true, errorMessage: "نام پدر نمی‌تواند خالی باشد", type: "text", maxLength: 20 },

    { name: "nationalCode", label: "شماره ملی", required: true, type: "number", maxLength: 10 },
    { name: "birthCertNumber", label: "شماره شناسنامه", required: true, type: "number", maxLength: 10 },
    { name: "tarikhtavalod", label: "تاریخ تولد", required: true, type: "tarikh", maxLength: 10 },
    { name: "serialNumber", label: "شماره سریال شناسنامه", required: true, type: "number", maxLength: 6 },
    { name: "birthPlace", label: "محل تولد", required: true, type: "text", maxLength: 50 },
    { name: "issuePlace", label: "محل صدور", required: true, type: "text", maxLength: 50 },
    { name: "certType", label: "نوع شناسنامه", required: true, type: "dropdown", dropdownCode: 201 },
    { name: "IssueDate", label: "علت صدور المثنی", type: "text", maxLength: 100 },
    { name: "duplicateIssueDate", label: "تاریخ صدور المثنی", type: "tarikh", maxLength: 10 },
    { name: "firstlastold", label: "نام یا نام خانوادگی قبلی", type: "text", maxLength: 100 },
    { name: "sayfirstlast", label: "نام مستعار", type: "text", maxLength: 100 },
    { name: "nationality", label: "ملیت", required: true, type: "text", dropdownCode: 0 },
    { name: "nowNationality", label: "تابعیت فعلی", type: "text", required: true, dropdownCode: 0 },
    { name: "previousNationality", label: "تابعیت قبلی", type: "text", dropdownCode: 0 },
    { name: "dualNationality", label: "تابعیت مضاعف", type: "text", dropdownCode: 0 },

    { name: "surgery", label: "وضعیت جسمانی", type: "dropdown", maxLength: 100, dropdownCode: 202 },
    { name: "medicationHistory", label: "سابقه مصرف دارو", type: "text", maxLength: 100 },
    { name: "surgeryHistory", label: "سابقه جراحی و بستری", type: "text", maxLength: 100 },
    { name: "hospitalizationReason", label: "علت بستری", type: "text", maxLength: 100 },

    { name: "bloodtype", label: "گروه خونی", type: "dropdown", maxLength: 3, dropdownCode: 203 },
    { name: "height", label: "قد", type: "number", maxLength: 3 },
    { name: "weight", label: "وزن", type: "number", maxLength: 3 },

    { name: "faceColor", label: "رنگ چهره", type: "text", maxLength: 20 },
    { name: "hairColor", label: "رنگ مو", type: "text", maxLength: 20 },
    { name: "eyeColor", label: "رنگ چشم", type: "text", maxLength: 20 },
    { name: "bodyMark", label: "علامت مشخص بر بدن", type: "text", maxLength: 50 },

    { name: "din", label: "دین و مذهب", type: "dropdown", maxLength: 50, dropdownCode: 205 },
    { name: "marja", label: "مرجع تقلید", type: "text", maxLength: 50 },
    { name: "educationDegree", label: "مدرک تحصیلی", type: "dropdown", maxLength: 3, dropdownCode: 204 },
    { name: "fieldOfStudy", label: "رشته تحصیلی", type: "text", maxLength: 50 },
    { name: "major", label: "گرایش", type: "text", maxLength: 50 },
    { name: "graduationDate", label: "تاریخ فارغ التحصیلی", type: "tarikh", maxLength: 10 },
    { name: "grade", label: "معدل", type: "number", maxLength: 5 },


    { name: "passporttype", label: "نوع گذرنامه", type: "dropdown", maxLength: 3, dropdownCode: 206 },
    { name: "passportNumber", label: "شماره گذرنامه", type: "text", maxLength: 20 },
    { name: "passportIssueDate", label: "تاریخ صدور گذرنامه", type: "tarikh", maxLength: 10 },


    { name: "tahol", label: " وضعیت تاهل", type: "dropdown", maxLength: 3, dropdownCode: 207 },
    { name: "marriageDate", label: "تاریخ ازدواج", type: "tarikh", maxLength: 10 },

    { name: "spouseFullName", label: "نام و نام خانوادگی همسر", type: "text", maxLength: 50 },
    { name: "spouseFatherName", label: "نام پدر همسر", type: "text", maxLength: 30 },
    { name: "tarikhtavalodhamsar", label: "تاریخ تولد همسر", type: "tarikh", maxLength: 10 },
    { name: "codemellihamsar", label: "شماره ملی همسر", type: "text", maxLength: 10 },
    { name: "passportNumberhamsar", label: "شماره گذرنامه همسر", type: "text", maxLength: 10 },
    { name: "passportIssueDatehamsar", label: "تاریخ صدور گذرنامه", type: "tarikh", maxLength: 10 },
    { name: "dinhamsar", label: "دین و مذهب", type: "dropdown", maxLength: 50, dropdownCode: 205 },
    { name: "educationDegreehamsar", label: "مدرک تحصیلی", type: "dropdown", maxLength: 3, dropdownCode: 204 },
    { name: "fieldOfStudyhamsar", label: "رشته تحصیلی", type: "text", maxLength: 50 },
    { name: "majorhamsar", label: "گرایش", type: "text", maxLength: 50 },

    { name: "spouseNationality", label: "تابعیت همسر", type: "text" },
    { name: "spouseCurrentNationality", label: "تابعیت فعلی همسر", type: "text" },
    { name: "spousePreviousNationality", label: "تابعیت قبلی همسر", type: "text" },
    { name: "spouseJob", label: "شغل همسر", type: "text", maxLength: 50 },
    { name: "spouseWorkAddress", label: "آدرس محل اشتغال فعلی همسر", type: "text", maxLength: 100 },

    { name: "childrenCount", label: "تعداد فرزندان", type: "number", maxLength: 2 },
    { name: "boysCount", label: "تعداد پسر", type: "number", maxLength: 2 },
    { name: "girlsCount", label: "تعداد دختر", type: "number", maxLength: 2 },
];
