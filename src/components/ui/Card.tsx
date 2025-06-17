import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  shadow?: "none" | "sm" | "md" | "lg";
}

export default function Card({
  children,
  className = "",
  padding = "md",
  shadow = "md",
}: CardProps) {
  const paddingClasses = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  const shadowClasses = {
    none: "",
    sm: "shadow-sm",
    md: "shadow-lg",
    lg: "shadow-xl",
  };

  const classes = `w-full bg-white rounded-xl border border-slate-200 ${paddingClasses[padding]} ${shadowClasses[shadow]} ${className}`;

  return <div className={classes}>{children}</div>;
}
