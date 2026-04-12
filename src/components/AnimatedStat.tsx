import useCountUp from "@/hooks/useCountUp";
import useInView from "@/hooks/useInView";
import { useEffect } from "react";
import { Card, CardContent } from "./ui/card";

export default function AnimatedStat({
  icon: Icon,
  value,
  suffix = "",
  label,
}: any) {
  const { ref, isInView } = useInView();
  const numericValue = parseInt(value.replace(/\D/g, ""));
  const { count, setHasStarted } = useCountUp(numericValue, 2000);

  useEffect(() => {
    if (isInView) {
      setHasStarted(true);
    }
  }, [isInView, setHasStarted]);

  const displayValue = value.includes("+")
    ? `${count}+`
    : value.includes("%")
      ? `+${count}%`
      : `${count}k+`;

  return (
    <Card
      ref={ref}
      className="border-2 hover:shadow-lg transition-all duration-300 hover:scale-105"
    >
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="text-3xl font-bold">{displayValue}</div>
            <div className="text-sm text-muted-foreground">{label}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
