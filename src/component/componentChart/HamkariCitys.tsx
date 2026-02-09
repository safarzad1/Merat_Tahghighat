import React, { useState, useEffect } from 'react';
import { GetCityAmarHamaran } from '@/Lib/ApiServiseHamkari';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useRouter } from "next/navigation";

interface CityDataItem {
    FullName: string;
    EttelaResan: number;
    Mohaghegh: number;
    ManabeHamkar: number;
}

interface ApiResponse {
    status: number;
    data: CityDataItem[];
}

interface FileStatusChartProps {
    mahal: number;
}

const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function FileStatusChart({ mahal }: FileStatusChartProps) {
    const [chartData, setChartData] = useState<CityDataItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const response = await GetCityAmarHamaran(mahal);
                console.log('API Response:', response);

                if (response.status == 401) {
                    router.push("/Login");
                    return;
                }

                if (response && response.status === 200 && response.data && Array.isArray(response.data)) {
                    console.log('Data received:', response.data);

                    // تبدیل اعداد رشته‌ای به عدد
                    const formattedData = response.data.map((item: any) => {
                        return {
                            FullName: item.FullName || 'بدون نام',
                            EttelaResan: parseInt(item.EttelaResan) || 0,
                            Mohaghegh: parseInt(item.Mohaghegh) || 0,
                            ManabeHamkar: parseInt(item.ManabeHamkar) || 0
                        };
                    });

                    console.log('Formatted data:', formattedData);
                    setChartData(formattedData);
                } else {
                    console.warn('Invalid response structure:', response);
                    setChartData([]);
                }
            } catch (err) {
                setError('خطا در دریافت داده‌ها');
                console.error('Error fetching data:', err);
            } finally {
                setLoading(false);
            }
        };

        if (mahal) {
            fetchData();
        }
    }, [mahal]);

    if (loading) {
        return (
            <div className="flex justify-center items-center">
                <div className="m-2 w-full max-w-6xl rounded-lg shadow-lg bg-white border border-gray-100 overflow-hidden">
                    <div className="bg-green-700 h-12 flex items-center justify-between px-4">
                        <h2 className="text-lg font-bold text-white">
                            آمار همکاران بر اساس شهرستان
                        </h2>
                    </div>
                    <div className="p-6 h-[350px] flex items-center justify-center">
                        <div className="flex flex-col items-center">
                            <div className="w-10 h-10 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4"></div>
                            <p className="text-gray-500">در حال بارگذاری داده‌ها...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex justify-center items-center">
                <div className="m-2 w-full rounded-lg shadow-lg bg-white border border-gray-100 overflow-hidden">
                    <div className="bg-green-700 h-12 flex items-center justify-between px-4">
                        <h2 className="text-lg font-bold text-white">
                            آمار همکاران بر اساس شهرستان
                        </h2>
                    </div>
                    <div className="p-6 h-[350px] flex flex-col items-center justify-center">
                        <div className="text-red-500 text-4xl mb-4">⚠️</div>
                        <p className="text-red-500 font-medium mb-2">{error}</p>
                        <p className="text-gray-500 text-sm">لطفاً دوباره تلاش کنید</p>
                    </div>
                </div>
            </div>
        );
    }

    if (chartData.length === 0) {
        return (
            <div className="flex justify-center items-center">
                <div className="m-2 w-full rounded-lg shadow-lg bg-white border border-gray-100 overflow-hidden">
                    <div className="bg-green-700 h-12 flex items-center justify-between px-4">
                        <h2 className="text-lg font-bold text-white">
                            آمار همکاران بر اساس شهرستان
                        </h2>
                    </div>
                    <div className="p-6 h-[350px] flex items-center justify-center">
                        <p className="text-gray-500">داده‌ای برای نمایش وجود ندارد</p>
                    </div>
                </div>
            </div>
        );
    }

    // تابع سفارشی برای Tooltip
    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 shadow-lg rounded-lg border border-gray-200 ">
                    <p className="font-bold text-gray-800 mb-2 text-center">{label}</p>
                    <div className="space-y-2">
                        {payload.map((entry: any, index: number) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                    <div
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: entry.color }}
                                    ></div>
                                    <span className="text-gray-600">{entry.name}:</span>
                                </div>
                                <span className="font-bold text-blue-600">
                                    {entry.value.toLocaleString('fa-IR')}
                                </span>
                            </div>
                        ))}
                        <div className="pt-2 mt-2 border-t border-gray-200">
                            <div className="flex justify-between font-bold">
                                <span className="text-gray-800">جمع کل:</span>
                                <span className="text-green-600">
                                    {payload.reduce((sum: number, entry: any) => sum + entry.value, 0).toLocaleString('fa-IR')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };

    // محاسبه مجموع کل
    const calculateTotal = () => {
        let totalEttelaResan = 0;
        let totalMohaghegh = 0;
        let totalManabeHamkar = 0;

        chartData.forEach(item => {
            totalEttelaResan += item.EttelaResan;
            totalMohaghegh += item.Mohaghegh;
            totalManabeHamkar += item.ManabeHamkar;
        });

        return {
            totalEttelaResan,
            totalMohaghegh,
            totalManabeHamkar,
            grandTotal: totalEttelaResan + totalMohaghegh + totalManabeHamkar
        };
    };

    const totals = calculateTotal();

    return (
        <div className="flex justify-center items-center">
            <div className="mx-2 mt-1 w-full rounded-lg shadow-lg bg-white border border-gray-100 overflow-hidden">
                <div className="bg-green-700 h-12 flex items-center justify-between px-4">
                    <h2 className="text-lg font-bold text-white">
                        آمار همکاران بر اساس شهرستان
                    </h2>
                </div>

                <div className="p-4">
                    <div className="h-96">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 25, right: 30, left: 20, bottom: 40 }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#f0f0f0"
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey="FullName"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    tickMargin={8}
                                    angle={-45}
                                    textAnchor="end"
                                    height={70}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#6b7280', fontSize: 11 }}
                                    tickMargin={8}
                                    tickFormatter={(value) => value.toLocaleString('fa-IR')}
                                    width={50}
                                />
                                <Tooltip
                                    content={<CustomTooltip />}
                                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                                />
                                <Legend
                                    wrapperStyle={{
                                        paddingTop: '20px',
                                        marginTop: '30px',
                                        fontSize: '11px'
                                    }}
                                    iconType="circle"
                                    iconSize={8}
                                    layout="horizontal"
                                    verticalAlign="bottom"
                                />
                                <Bar
                                    dataKey="EttelaResan"
                                    name="اطلاع‌رسان"
                                    fill={colors[0]}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={25}
                                />
                                <Bar
                                    dataKey="Mohaghegh"
                                    name="محقق"
                                    fill={colors[1]}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={25}
                                />
                                <Bar
                                    dataKey="ManabeHamkar"
                                    name="منابع همکار"
                                    fill={colors[2]}
                                    radius={[4, 4, 0, 0]}
                                    maxBarSize={25}
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-6 pt-4 border-t border-gray-100">
                        {/* خلاصه آماری */}
                        <div className="mb-4">
                            <h3 className="text-sm font-bold text-gray-700 mb-2">خلاصه آمار</h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                                <div className="bg-blue-50 p-3 rounded-lg">
                                    <div className="flex items-center mb-1">
                                        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                        <span className="text-sm text-gray-600">اطلاع‌رسان</span>
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">
                                        {totals.totalEttelaResan.toLocaleString('fa-IR')} نفر
                                    </div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg">
                                    <div className="flex items-center mb-1">
                                        <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                        <span className="text-sm text-gray-600">محقق</span>
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">
                                        {totals.totalMohaghegh.toLocaleString('fa-IR')} نفر
                                    </div>
                                </div>
                                <div className="bg-yellow-50 p-3 rounded-lg">
                                    <div className="flex items-center mb-1">
                                        <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                        <span className="text-sm text-gray-600">منابع همکار</span>
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">
                                        {totals.totalManabeHamkar.toLocaleString('fa-IR')} نفر
                                    </div>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg">
                                    <div className="flex items-center mb-1">
                                        <div className="w-3 h-3 rounded-full bg-gray-500 mr-2"></div>
                                        <span className="text-sm text-gray-600">جمع کل</span>
                                    </div>
                                    <div className="text-lg font-bold text-gray-800">
                                        {totals.grandTotal.toLocaleString('fa-IR')} نفر
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* نمایش جزئیات آماری با کادر و خطوط */}
                        <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
                            <h3 className="mb-0 p-3 bg-green-700 text-white border-b border-gray-200">
                                جزئیات بر اساس شهرستان
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-gray-600">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="p-3 text-right border border-gray-200">شهرستان</th>
                                            <th className="p-3 text-left border border-gray-200">اطلاع‌رسان</th>
                                            <th className="p-3 text-left border border-gray-200">محقق</th>
                                            <th className="p-3 text-left border border-gray-200">منابع همکار</th>
                                            <th className="p-3 text-left border border-gray-200">جمع</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {chartData.map((item, index) => {
                                            const cityTotal = item.EttelaResan + item.Mohaghegh + item.ManabeHamkar;
                                            return (
                                                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                    <td className="p-3 font-medium border border-gray-200">{item.FullName}</td>
                                                    <td className="p-3 border border-gray-200">{item.EttelaResan.toLocaleString('fa-IR')}</td>
                                                    <td className="p-3 border border-gray-200">{item.Mohaghegh.toLocaleString('fa-IR')}</td>
                                                    <td className="p-3 border border-gray-200">{item.ManabeHamkar.toLocaleString('fa-IR')}</td>
                                                    <td className="p-3 font-bold border border-gray-200 text-blue-600">
                                                        {cityTotal.toLocaleString('fa-IR')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {/* ردیف جمع کل */}
                                        <tr className="bg-gray-100 font-bold">
                                            <td className="p-3 border border-gray-200">جمع کل</td>
                                            <td className="p-3 border border-gray-200">{totals.totalEttelaResan.toLocaleString('fa-IR')}</td>
                                            <td className="p-3 border border-gray-200">{totals.totalMohaghegh.toLocaleString('fa-IR')}</td>
                                            <td className="p-3 border border-gray-200">{totals.totalManabeHamkar.toLocaleString('fa-IR')}</td>
                                            <td className="p-3 border border-gray-200 text-green-600">
                                                {totals.grandTotal.toLocaleString('fa-IR')}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}