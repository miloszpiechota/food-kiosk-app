import { Accessibility } from "lucide-react";
import { IconButton } from "../../../shared/components/IconButton";

interface AccessibilityButtonProps {
  className?: string;
  label?: string;
  onClick: () => void;
}

export function AccessibilityButton({
  className = "",
  label = "Accessibility options",
  onClick,
}: AccessibilityButtonProps) {
  return (
    <IconButton
      className={className}
      label={label}
      onClick={onClick}
      variant="utility"
    >
      <Accessibility aria-hidden="true" className="size-6" />
    </IconButton>
  );
}
