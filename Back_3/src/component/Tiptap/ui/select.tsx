'use client';

import { Menu, Transition } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fragment, useState } from 'react';
import { X } from 'lucide-react';

interface OptionType {
    value: string | number;
    label: string;
}

interface SelectDropdownProps {
    label?: string;
    value?: string | number;
    options: OptionType[];
    placeholder?: string;
    onSelect: (value: string | number | null) => void;
    error?: boolean;
    errorMessage?: string;
}

export default function SelectDropdown({
    label,
    value,
    options,
    placeholder = 'انتخاب...',
    onSelect,
    error,
    errorMessage,
}: SelectDropdownProps) {
    const [selected, setSelected] = useState<string | number | undefined>(value);

    const handleSelect = (val: string | number) => {
        setSelected(val);
        onSelect(val);
    };

    const handleClear = () => {
        setSelected(undefined);
        onSelect(null);
    };

    return (
        <div className="flex flex-col w-full my-2 text-right">
            {label && (
                <label className="text-sm text-gray-700 mb-1 font-semibold">
                    {label}
                </label>
            )}

            <Menu as="div" className="relative w-full text-right">
                <Menu.Button
                    className={`w-full border rounded px-2 py-1 text-right text-sm font-medium flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 ${error ? 'border-red-500' : 'border-gray-300'
                        }`}
                >
                    <span>
                        {selected
                            ? options.find((o) => o.value === selected)?.label
                            : placeholder}
                    </span>
                    {selected && (
                        <X
                            className="w-4 h-4 text-gray-400 cursor-pointer ml-2"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleClear();
                            }}
                        />
                    )}
                </Menu.Button>

                <Transition
                    as={Fragment}
                    enter="transition ease-out duration-100"
                    enterFrom="transform opacity-0 scale-95"
                    enterTo="transform opacity-100 scale-100"
                    leave="transition ease-in duration-75"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                >
                    <Menu.Items className="absolute mt-1 w-full bg-white border border-gray-300 rounded shadow-md z-50 origin-top-right right-0">
                        {options.map((opt) => (
                            <Menu.Item key={opt.value}>
                                {({ active }) => (
                                    <button
                                        onClick={() => handleSelect(opt.value)}
                                        className={`w-full px-2 py-1 text-right text-gray-700 text-sm ${active ? 'bg-gray-100' : ''
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                )}
                            </Menu.Item>
                        ))}
                    </Menu.Items>
                </Transition>
            </Menu>

            <AnimatePresence>
                {errorMessage && (
                    <motion.p
                        initial={{ opacity: 0, y: -3 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -3 }}
                        transition={{ duration: 0.25 }}
                        className="text-red-600 text-sm mt-1 font-medium"
                    >
                        {errorMessage}
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
}
