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
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="space-y-6">
        {children}
        <div className="flex items-center justify-between pt-4 border-t">
          {prev ? (
            <Button variant="ghost" onClick={() => navigate(prev)}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
          ) : (
            <span />
          )}
          <Button onClick={() => navigate(next)} disabled={!canContinue}>
            {nextLabel} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
