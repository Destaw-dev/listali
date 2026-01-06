import { X } from "lucide-react";
import { Card, CardBody, CardHeader } from "./Card";
import { Button } from "./Button";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  iconHeader?: React.ReactNode;
  subtitle?: string;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Modal({ children, onClose, title, iconHeader, subtitle, size = "md" }: ModalProps) {

  const sizeClasses = {
    sm: "max-w-sm max-h-[90vh] overflow-y-auto",
    md: "max-w-md max-h-[90vh] overflow-y-auto",
    lg: "max-w-lg max-h-lg overflow-y-auto",
    xl: "max-w-xl max-h-full overflow-y-auto",
    full: "max-w-full max-h-full overflow-y-auto",
  };
  return (
    <div
      className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-background/30 backdrop-blur-[2px]"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`relative w-full rounded-3xl bg-surface shadow-2xl transition-all animate-[fadeIn_.15s_ease-out] animate-in slide-in-from-bottom-4 ${sizeClasses[size]}`}
      >
        <Card>
          <CardHeader padding='xs'>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                {iconHeader}
                <div>
                  <h2 className="text-lg font-bold text-text-primary">
                    {title}
                  </h2>
                  <p className="text-text-muted text-sm">{subtitle}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                rounded={true}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardBody>{children}</CardBody>
        </Card>
      </div>
    </div>
  );
}
