import JsBarcode from "jsbarcode";

export interface BarcodeLabelItem {
  item_name?: string;
  sku?: string | null;
  barcode?: string | null;
  serial_number?: string | null;
  category?: string | null;
  brand?: string | null;
  model?: string | null;
  warehouse?: string | null;
  quantity?: number | null;
  purchase_price?: number | null;
  selling_price?: number | null;
}

/**
 * Generate a printable PNG label containing the item's barcode plus all key details,
 * then trigger a download in the browser.
 */
export function downloadBarcodeLabel(item: BarcodeLabelItem) {
  const code = item.barcode || item.sku || item.serial_number;
  if (!code) {
    throw new Error("This item has no barcode, SKU, or serial number to encode.");
  }

  // Render barcode to an offscreen canvas first.
  const barcodeCanvas = document.createElement("canvas");
  JsBarcode(barcodeCanvas, code, {
    format: "CODE128",
    height: 90,
    width: 2,
    displayValue: true,
    margin: 8,
    fontSize: 16,
  });

  // Build details list
  const details: Array<[string, string]> = [];
  if (item.item_name) details.push(["Item", item.item_name]);
  if (item.sku) details.push(["SKU", String(item.sku)]);
  if (item.serial_number) details.push(["Serial", String(item.serial_number)]);
  if (item.category) details.push(["Category", String(item.category)]);
  if (item.brand) details.push(["Brand", String(item.brand)]);
  if (item.model) details.push(["Model", String(item.model)]);
  if (item.warehouse) details.push(["Warehouse", String(item.warehouse)]);
  if (item.quantity != null) details.push(["Quantity", String(item.quantity)]);
  if (item.purchase_price != null)
    details.push(["Purchase", `SAR ${Number(item.purchase_price).toLocaleString()}`]);
  if (item.selling_price != null)
    details.push(["Selling", `SAR ${Number(item.selling_price).toLocaleString()}`]);

  // Layout
  const padding = 24;
  const titleHeight = item.item_name ? 32 : 0;
  const rowHeight = 22;
  const detailsHeight = details.length * rowHeight + 12;
  const width = Math.max(barcodeCanvas.width + padding * 2, 420);
  const height = padding + titleHeight + barcodeCanvas.height + 16 + detailsHeight + padding;

  const canvas = document.createElement("canvas");
  const scale = 2; // crisp output
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(scale, scale);

  // Background
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);

  // Border
  ctx.strokeStyle = "#d4d4d8";
  ctx.lineWidth = 1;
  ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

  let y = padding;

  // Title
  if (item.item_name) {
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.item_name, width / 2, y + 20);
    y += titleHeight;
  }

  // Barcode (centered)
  const barcodeX = (width - barcodeCanvas.width) / 2;
  ctx.drawImage(barcodeCanvas, barcodeX, y);
  y += barcodeCanvas.height + 16;

  // Details
  ctx.textAlign = "left";
  ctx.font = "13px system-ui, -apple-system, sans-serif";
  details.forEach(([label, value]) => {
    ctx.fillStyle = "#64748b";
    ctx.fillText(`${label}:`, padding, y + 14);
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 13px system-ui, -apple-system, sans-serif";
    ctx.fillText(value, padding + 90, y + 14);
    ctx.font = "13px system-ui, -apple-system, sans-serif";
    y += rowHeight;
  });

  // Trigger download
  const link = document.createElement("a");
  const safeName = (item.item_name || code).replace(/[^a-z0-9-_]+/gi, "_");
  link.download = `barcode_${safeName}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
