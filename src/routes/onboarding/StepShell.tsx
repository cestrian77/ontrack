import { useLayoutEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Props {
  title: string;
  description?: string;
  prev?: string;
  next: string;
  nextLabel?: string;
  canContinue?: boolean;
  children: React.ReactNode;
}

export function StepShell({
  title,
  description,
  prev,
  next,
  nextLabel = "Continue",
  canContinue = true,
  children,
}: Props) {
  const navigate = useNavigate();
  const fieldsRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = fieldsRef.current;
    if (!root) return;
    const first = root.querySelector<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), [role="combobox"]:not([aria-disabled="true"])',
    );
    first?.focus({ preventScroll: true });
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        <div ref={fieldsRef}>{children}</div>
        <div
          className="flex items-center justify-between gap-3 border-t pt-4 pb-[max(0px,env(safe-area-inset-bottom))]"
        >
          {prev ? (
            <Button variant="ghost" className="min-h-11 touch-manipulation" onClick={() => navigate(prev)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}
          <Button className="min-h-11 touch-manipulation" onClick={() => navigate(next)} disabled={!canContinue}>
            {nextLabel} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
