import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface Props {
  value: string;
  height?: number;
  width?: number;
  displayValue?: boolean;
  className?: string;
}

export function BarcodeDisplay({ value, height = 60, width = 2, displayValue = true, className }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      try {
        JsBarcode(svgRef.current, value, {
          format: "CODE128",
          height,
          width,
          displayValue,
          margin: 4,
          fontSize: 12,
        });
      } catch (e) {
        // ignore invalid input
      }
    }
  }, [value, height, width, displayValue]);

  if (!value) return null;
  return <svg ref={svgRef} className={className} />;
}

export function generateBarcodeValue(prefix = "ITM") {
  const ts = Date.now().toString().slice(-9);
  const rand = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return `${prefix}${ts}${rand}`;
}
