"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DescriptionWithModal from './DescriptionWithModal';
import { CircleAlert, Delete, PlusCircle } from "lucide-react";
import { useConfirm } from "@/Utils/ConfirmModalContext";
import { DeleteErjabyId } from '@/Lib/ApiService';
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { GetTahghighByID } from '@/Lib/ApiService'
import TahghighatStateModal from './TahghighatStateModal'

interface TahghighItem {
  ErjaId: number;
  ID: number;
  CountKolErja: number;
  CountErjaShahrestan: number;
  CountErjaShahrestanDone: number;
  CountErjaMohaghegh: number;
  CountErjaMohagheghDone: number;
  CountErja: number;
  ErjaLastStat: number;
  IsDone: boolean;
  ShomarehParvandeh: string;
  FirstName: string;
  LastName: string;
  NameHozeh: string;
  MahalSender_NameFarsi: string;
  MahalReciver_NameFarsi: string;
  CreateDateTime: string;
  Description: string;
}

interface FehrestErjaParvandehProps {
  erjaParentId: number;
}

const FehrestErjaParvandeh = ({ erjaParentId }: FehrestErjaParvandehProps) => {

  const user = useSelector((state: RootState) => state.user);

  const [Mahal, SetMahal] = useState(0);
  const [UserId, SetUserId] = useState(0);
  const { showConfirm } = useConfirm();
  const router = useRouter();
  const [data, setData] = useState<TahghighItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [open, setOpen] = useState(false);
  const [erjaId, setErjaId] = useState<number | null>(123);


  const loadData = async () => {
    try {
      const result = await GetTahghighByID(0, erjaParentId, 3);
      if (result.status == 200) {
        setData(result.data || []);
      } else if (result.status === 401) {
        router.push("/Login");
      } else {
        setData([]);
      }

    } catch (err) {
      console.error(err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    SetMahal(user.Mahal);
    SetUserId(user.UserId);

    loadData();
  }, [erjaParentId, router]);

  if (loading) return <div>در حال بارگذاری...</div>;
  if (data.length === 0) return <div>داده‌ای وجود ندارد.</div>;

  const DeleteErja = async (ID: number) => {
    const result = await DeleteErjabyId(ID, UserId);
    loadData();
  }

  return (
    <div className="px-1">
      <ul className="">
        {data.map((item) => (
          <li
            key={item.ErjaId}
            className={`
    my-1 py-1 p-3 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 flex justify-between items-center
    ${item.IsDone === true ? "bg-green-100" : "bg-white"}
  `}
          >

            <div className="flex gap-5 whitespace-nowrap">
              {(item.CountKolErja == 0 && item.IsDone == false) &&
                (
                  <p className="cursor-pointer">
                    <Delete
                      onClick={
                        () =>
                          showConfirm(
                            "آیا از حذف ارجاع اطمینان دارید؟",
                            () => DeleteErja(item.ErjaId),
                            "هشدار!",
                            "error"
                          )
                      }
                      className="text-red-500"></Delete>
                  </p>

                )}
              {(item.CountKolErja > 0 || item.IsDone == true) &&
                (
                  <p>
                    <Delete
                      className="text-gray-700"></Delete>
                  </p>

                )}
              <p>
                <span className="font-semibold text-blue-600 text-[13px]">ارسال به استان :</span>
                <span className="text-gray-700 text-[15px] mr-2 inline-block min-w-[250px]">
                  {item.MahalReciver_NameFarsi}
                </span>
              </p>

              <p>
                <span className="font-semibold text-blue-600 text-[13px]">زمان ارجاع :</span>
                <span className="text-gray-700 text-[14px] mr-2">{item.CreateDateTime}</span>
              </p>
              <p>
                <span className="font-semibold text-blue-600 text-[13px]"> تعداد ارجاع  :</span>
                <span className="text-gray-700 text-[14px] mr-2">{item.CountKolErja}</span>
              </p>
              <p>
                <span className="font-semibold text-blue-600 text-[13px]">  ارجاع به شهرستان :</span>
                <span className="text-gray-700 text-[14px] mr-2">{item.CountErjaShahrestan}</span>
              </p>
              <p>
                <span className="font-semibold text-blue-600 text-[13px]">  ارجاع به محقق :</span>
                <span className="text-gray-700 text-[14px] mr-2">{item.CountErjaMohaghegh}</span>
              </p>
              <p>
                <span className="font-semibold text-blue-600 text-[13px]">توضیحات :</span>
                <DescriptionWithModal
                  status="info"
                  description={item.Description || ""}
                />

              </p>
              <button
                onClick={() => {
                  setOpen(true);
                  setErjaId(item.ErjaId);
                  // setTozihat("");
                }
                }
                className="flex items-center gap-1 p-1 px-4 bg-purple-500 text-white  rounded shadow hover:bg-purple-700 transition-colors text-sm cursor-pointer">
                <CircleAlert className="w-4 h-4" />
                مشاهده تغییرات
              </button>

            </div>


          </li>
        ))}
      </ul>

      <TahghighatStateModal
        isOpen={open}
        onClose={() => setOpen(false)}
        erjaid={erjaId}
      />

    </div>
  );



};

export default FehrestErjaParvandeh;
