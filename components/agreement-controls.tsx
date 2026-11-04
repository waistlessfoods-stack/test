"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function AgreementSelect({ label, value, onValueChange, options, disabled = false, className }: {
  label: string; value: string; onValueChange: (value: string) => void;
  options: { value: string; label: string }[]; disabled?: boolean; className?: string;
}) {
  return <Select value={value} onValueChange={onValueChange} disabled={disabled}>
    <SelectTrigger aria-label={label} className={className}><SelectValue placeholder="Choose…" /></SelectTrigger>
    <SelectContent className="agreement-theme">{options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}</SelectContent>
  </Select>;
}

export function useAgreementConfirmation() {
  const [message, setMessage] = useState<string | null>(null);
  const pending = useRef<((confirmed: boolean) => void) | null>(null);
  useEffect(() => () => { pending.current?.(false); }, []);
  function answer(confirmed: boolean) {
    pending.current?.(confirmed); pending.current = null; setMessage(null);
  }
  function confirm(text: string): Promise<boolean> {
    pending.current?.(false); setMessage(text);
    return new Promise(resolve => { pending.current = resolve; });
  }
  const confirmationDialog = <Dialog open={message !== null} onOpenChange={open => { if (!open) answer(false); }}>
    <DialogContent className="agreement-theme w-[calc(100%-2rem)] rounded-xl border-border text-foreground [&>button]:focus:ring-ring">
      <DialogHeader><DialogTitle>Confirm action</DialogTitle><DialogDescription className="pt-2 leading-6 text-muted-foreground">{message}</DialogDescription></DialogHeader>
      <DialogFooter className="gap-2"><Button type="button" variant="outline" onClick={() => answer(false)}>Cancel</Button><Button type="button" onClick={() => answer(true)}>Continue</Button></DialogFooter>
    </DialogContent>
  </Dialog>;
  return { confirm, confirmationDialog };
}
