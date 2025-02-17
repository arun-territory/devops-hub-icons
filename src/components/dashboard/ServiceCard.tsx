
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ServiceCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  className?: string;
}

export const ServiceCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  className,
}: ServiceCardProps) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-6 rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group",
        className
      )}
    >
      <div className="flex items-center space-x-4">
        <div className="p-2 rounded-lg bg-gray-50 group-hover:bg-gray-100 transition-colors">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
        <div>
          <h3 className="font-medium text-gray-900">{title}</h3>
          <p className="text-sm text-gray-500">{description}</p>
        </div>
      </div>
    </div>
  );
};
