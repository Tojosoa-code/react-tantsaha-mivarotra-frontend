import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@/lib/utils";
import { Loading03Icon } from "@hugeicons/core-free-icons";

// On utilise Omit pour retirer 'icon' des props obligatoires du Spinner
interface SpinnerProps extends Omit<
  React.ComponentProps<typeof HugeiconsIcon>,
  "icon"
> {
  className?: string;
}

export const Spinner = ({
  className,
  strokeWidth = 2,
  ...rest
}: SpinnerProps) => {
  return (
    <HugeiconsIcon
      // On place {...rest} AVANT pour que nos valeurs locales (icon, strokeWidth, etc.)
      // écrasent tout le reste sans lever d'erreur TypeScript.
      {...rest}
      icon={Loading03Icon}
      strokeWidth={strokeWidth}
      role="status"
      aria-label="Loading"
      className={cn("size-4 animate-spin", className)}
    />
  );
};
