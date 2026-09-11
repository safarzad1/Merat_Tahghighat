"use client";

import { useEffect, useState } from "react";
import Select, { SingleValue, StylesConfig } from "react-select";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface User {
  CityId: number;
  FullName: string;
}

interface OptionType {
  value: number;
  label: string;
  data: User;
}

interface Props {
  pCityId: number;
  CityIdNo: number;
  IsMarkaz: number;
  label?: string;
  onSelect?: (info: { id: number; title: string } | null) => void;
  error?: boolean;
  errorMessage?: string;
}

const InputUserDropdown = ({
  pCityId,
  CityIdNo,
  IsMarkaz,
  label,
  onSelect,
  error,
  errorMessage,
}: Props) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    console.log("pCityId = " + pCityId);



    const fetchUsers = async () => {
      try {
        const res = await fetch("/Api/Citys/GetListCity", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ pcityId: pCityId, cityIdNo: CityIdNo, isMarkaz: IsMarkaz }),
        });

        const result = await res.json();
        if (res.ok) setUsers(result.data);
        else if (res.status === 401) router.push("/Login");
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    if (pCityId) fetchUsers();
  }, [pCityId]);

  const options: OptionType[] = users.map((u) => ({
    value: u.CityId,
    label: u.FullName,
    data: u,
  }));

  const handleChange = (option: SingleValue<OptionType>) => {
    if (option) {
      const selected = option.data;
      setSelectedUser(selected);
      onSelect?.({ id: selected.CityId, title: selected.FullName });
    } else {
      setSelectedUser(null);
      onSelect?.(null);
    }
  };

  // ✅ استایل ساده شبیه InputPersianDate
  const customStyles: StylesConfig<OptionType> = {
    control: (provided, state) => ({
      ...provided,
      fontSize: "15px",
      minHeight: "34px",
      direction: "rtl",
      borderRadius: "8px",
      borderColor: error
        ? "#f87171"
        : state.isFocused
          ? "#6366f1"
          : "#d1d5db",
      boxShadow: "none",
      "&:hover": {
        borderColor: error ? "#f87171" : "#6366f1",
      },
    }),
    menu: (provided) => ({
      ...provided,
      direction: "rtl",
      textAlign: "right",
      fontSize: "15px",
      zIndex: 9999,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isFocused ? "#f3f4f6" : "white",
      color: "#333",
    }),
    placeholder: (provided) => ({
      ...provided,
      color: "#9ca3af",
    }),
  };

  return (
    <div className="flex flex-col my-2 w-full">
      {label && (
        <label className="text-sm text-gray-700 mb-1 text-right font-semibold">
          {label}
        </label>
      )}

      <Select<OptionType>
        instanceId="user-select"
        options={options}
        value={
          selectedUser
            ? options.find((o) => o.value === selectedUser.CityId)
            : null
        }
        onChange={handleChange}
        placeholder="انتخاب..."
        isClearable
        styles={customStyles}
      />

      <AnimatePresence>
        {errorMessage && (
          <motion.p
            initial={{ opacity: 0, y: -3 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -3 }}
            transition={{ duration: 0.25 }}
            className="text-red-600 text-sm mt-1 text-right font-medium"
          >
            {errorMessage}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InputUserDropdown;
