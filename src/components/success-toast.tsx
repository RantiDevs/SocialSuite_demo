import { useState, useEffect } from "react";
import { X, CheckCircle } from "lucide-react";

export interface SuccessToastProps {
  title: string;
  message: string;
  onClose: () => void;
}

export function SuccessToast({ title, message, onClose }: SuccessToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      onClose();
    }, 4000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 max-w-md z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-emerald-500/95 backdrop-blur-md border border-emerald-400/40 rounded-lg p-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 pt-0.5">
            <CheckCircle className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white mb-0.5">{title}</h3>
            <p className="text-sm text-white/85">{message}</p>
          </div>
          <button
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
