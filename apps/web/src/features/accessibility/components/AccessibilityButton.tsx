import { Accessibility } from "lucide-react";
import { IconButton } from "../../../shared/components/IconButton";

interface AccessibilityButtonProps {
  className?: string;
}

export function AccessibilityButton({
  className = "",
}: AccessibilityButtonProps) {
  return (
    <IconButton
      className={className}
      label="Accessibility options"
      variant="utility"
    >
      <Accessibility aria-hidden="true" className="size-6" />
    </IconButton>
  );
}
