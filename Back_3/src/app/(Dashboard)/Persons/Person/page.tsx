import Breadcrumbkhabar from '@/component/Breadcrumb/Breadcrumb';
import { DockIcon, Home, Newspaper } from 'lucide-react';
import FormPerson from './FormPerson'

const page = () => {
    return (
        <div>
            <div className="bg-sky-200 mt-1 mx-1 rounded py-2 px-10">
                <Breadcrumbkhabar
                    items={[
                        { label: 'داشبورد', href: '/Dashboard', icon: <Home className="w-4 h-4" /> },
                        { label: 'مشخصات فردی', href: '/Dashboard', icon: <DockIcon className="w-4 h-4" /> },
                        { label: 'قاسم صفرزاد', icon: <Newspaper className="w-4 h-4" /> },
                    ]}
                />
            </div>

            <div className="bg-gray-100 m-1 py-2 px-2 flex justify-center items-start">
                <div className="bg-white w-[370mm] h-[297mm] shadow-lg rounded-lg p-5">
                    <h2 className="mb-4 text-center titr text-purple-600">پرونده دیجیتالی قاسم صفرزاد </h2>
                    <FormPerson />
                </div>
            </div>
        </div>
    );
}

export default page;

