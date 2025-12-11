import React from "react";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useParams } from "next/navigation";

export const ArrowIcon = ({ className, onClick }: { className?: string, onClick?: () => void }) => {
  const params = useParams();
  const locale = params.locale as string;
  const direction = locale === 'he' ? 'left' : 'right';
  return direction === 'left' ? <ArrowRight className={className} onClick={onClick} /> : <ArrowLeft className={className} onClick={onClick} />;
};