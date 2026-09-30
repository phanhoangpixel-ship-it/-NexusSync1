import React from "react";

export type StatusBadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "purple"
  | "neutral";

export interface StatusBadgeProps {
  variant?: StatusBadgeVariant;
  label: React.ReactNode;
  icon?: React.ReactNode;
  dot?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant = "neutral",
  label,
  icon,
  dot = false,
  className = "",
  size = "md",
}) => {
  let styleClasses = "";
  let dotColor = "";

  switch (variant) {
    case "success":
      styleClasses = "bg-emerald-100 text-emerald-950 border-emerald-300 dark:bg-emerald-950/90 dark:text-emerald-200 dark:border-emerald-700 font-bold";
      dotColor = "bg-emerald-600 dark:bg-emerald-400";
      break;
    case "warning":
      styleClasses = "bg-amber-100 text-amber-950 border-amber-300 dark:bg-amber-950/90 dark:text-amber-200 dark:border-amber-700 font-bold";
      dotColor = "bg-amber-600 dark:bg-amber-400";
      break;
    case "danger":
      styleClasses = "bg-rose-100 text-rose-950 border-rose-300 dark:bg-rose-950/90 dark:text-rose-200 dark:border-rose-700 font-bold";
      dotColor = "bg-rose-600 dark:bg-rose-400";
      break;
    case "info":
      styleClasses = "bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/90 dark:text-blue-200 dark:border-blue-700 font-bold";
      dotColor = "bg-blue-600 dark:bg-blue-400";
      break;
    case "purple":
      styleClasses = "bg-purple-100 text-purple-950 border-purple-300 dark:bg-purple-950/90 dark:text-purple-200 dark:border-purple-700 font-semibold";
      dotColor = "bg-purple-600 dark:bg-purple-400";
      break;
    case "neutral":
    default:
      styleClasses = "bg-slate-100 text-slate-900 border-slate-300 dark:bg-slate-700 dark:text-slate-100 dark:border-slate-600 font-medium";
      dotColor = "bg-slate-500 dark:bg-slate-300";
      break;
  }

  const sizeClass = size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border shadow-2xs select-none ${sizeClass} ${styleClasses} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="leading-none">{label}</span>
    </span>
  );
};
