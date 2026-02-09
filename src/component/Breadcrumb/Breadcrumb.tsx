"use client";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbkhabar({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center text-black text-base" aria-label="Breadcrumb">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <span key={index} className="flex items-center">
            {item.href ? (
              <a href={item.href} className="
              p-4 h-5 bg-white rounded-xl flex items-center gap-1 text-black text-sm md:text-base cursor-pointer hover:bg-sky-500 hover:text-white
              ">
                {item.icon && <span className="ml-1 text-blue-600 text-lg ">{item.icon}</span>}
                {item.label}
              </a>
            ) : (
              <span className={`flex items-center ${isLast ? "text-black" : "text-black"}`}>
                {item.icon && <span className="ml-1 text-lg text-blue-500">{item.icon}</span>}
                {item.label}
              </span>
            )}

            {!isLast && <span className="mx-2">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
