"use client";

import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import { useEffect, useState } from "react";

import TahghighatChart from '@/component/componentChart/TahghighatChart'
import HamkariChart from '@/component/componentChart/HamkariChart'
import HamkariCitys from '@/component/componentChart/HamkariCitys'
const page = () => {
    const user = useSelector((state: RootState) => state.user);
    return (
        <div>

            <div className="flex gap-1">
                <TahghighatChart mahal={user.Mahal} />
                <HamkariChart mahal={user.Mahal} />
            </div>
            <HamkariCitys mahal={user.Mahal} />
        </div>
    );
}

export default page;