import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (value: string) => void;
}

export function BarcodeScannerDialog({ open, onOpenChange, onScan }: Props) {
  const [typed, setTyped] = useState("");
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "barcode-scanner-region";

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { await scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const startScanner = async () => {
    try {
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;
      setScanning(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 120 } },
        (decoded) => {
          onScan(decoded);
          stopScanner();
          onOpenChange(false);
        },
        () => {}
      );
    } catch (e: any) {
      toast.error("Unable to access camera. Type the barcode instead.");
      setScanning(false);
    }
  };

  useEffect(() => {
    if (!open) stopScanner();
    return () => { stopScanner(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submitTyped = () => {
    if (!typed.trim()) return;
    onScan(typed.trim());
    setTyped("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan or Type Barcode</DialogTitle>
          <DialogDescription>Use your camera to scan a barcode, or type it in manually.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div id={elementId} className="w-full rounded-lg overflow-hidden bg-muted min-h-[180px] flex items-center justify-center">
            {!scanning && <ScanLine className="h-12 w-12 text-muted-foreground" />}
          </div>

          {scanning ? (
            <Button onClick={stopScanner} variant="outline" className="w-full">
              <CameraOff className="h-4 w-4 mr-1" /> Stop Camera
            </Button>
          ) : (
            <Button onClick={startScanner} className="w-full">
              <Camera className="h-4 w-4 mr-1" /> Start Camera
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or type manually</span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="manual-barcode">Barcode</Label>
            <div className="flex gap-2">
              <Input
                id="manual-barcode"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder="Enter barcode..."
                onKeyDown={(e) => e.key === "Enter" && submitTyped()}
                autoFocus
              />
              <Button onClick={submitTyped} disabled={!typed.trim()}>Use</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
