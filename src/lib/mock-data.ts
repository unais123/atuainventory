export const inventoryItems = [
  { id: "INV-001", name: "HVAC Compressor Unit", category: "HVAC", brand: "Carrier", model: "38AUZ", serialNumber: "CR-2024-001", supplier: "Carrier Saudi", purchasePrice: 2500, sellingPrice: 3800, quantity: 12, minStock: 5, warehouse: "Riyadh Main" },
  { id: "INV-002", name: "Split AC Indoor Unit", category: "AC Units", brand: "Daikin", model: "FTKF35", serialNumber: "DK-2024-045", supplier: "Daikin Arabia", purchasePrice: 1200, sellingPrice: 1950, quantity: 28, minStock: 10, warehouse: "Riyadh Main" },
  { id: "INV-003", name: "Industrial Exhaust Fan", category: "Ventilation", brand: "Systemair", model: "AW500", serialNumber: "SA-2024-012", supplier: "Systemair ME", purchasePrice: 800, sellingPrice: 1350, quantity: 3, minStock: 5, warehouse: "Jeddah Branch" },
  { id: "INV-004", name: "Copper Pipe 3/8\"", category: "Parts", brand: "Mueller", model: "Type L", serialNumber: "ML-BULK-001", supplier: "Gulf Metals", purchasePrice: 45, sellingPrice: 75, quantity: 150, minStock: 50, warehouse: "Riyadh Main" },
  { id: "INV-005", name: "Thermostat Controller", category: "Controls", brand: "Honeywell", model: "T6 Pro", serialNumber: "HW-2024-089", supplier: "Honeywell ME", purchasePrice: 350, sellingPrice: 580, quantity: 18, minStock: 8, warehouse: "Riyadh Main" },
  { id: "INV-006", name: "Refrigerant R410A", category: "Consumables", brand: "Chemours", model: "R410A-11.3kg", serialNumber: "CH-BULK-045", supplier: "Cool Gas Co", purchasePrice: 180, sellingPrice: 320, quantity: 2, minStock: 10, warehouse: "Dammam Branch" },
];

export const customers = [
  { id: "CUS-001", company: "Al Rajhi Commercial", contact: "Mohammed Al Rajhi", phone: "+966 50 123 4567", email: "mohammed@alrajhi-com.sa", address: "Riyadh, King Fahd Road", vatNumber: "300012345600003" },
  { id: "CUS-002", company: "Jeddah Grand Mall", contact: "Sara Ahmed", phone: "+966 55 987 6543", email: "sara@jgmall.sa", address: "Jeddah, Tahlia Street", vatNumber: "300098765400003" },
  { id: "CUS-003", company: "SABIC Industrial Complex", contact: "Fahd Al Saud", phone: "+966 53 456 7890", email: "fahd@sabic-ic.sa", address: "Jubail Industrial City", vatNumber: "300045678900003" },
  { id: "CUS-004", company: "Hilton Riyadh Hotel", contact: "Ahmad Hassan", phone: "+966 50 222 3333", email: "ahmad@hiltonriyadh.sa", address: "Riyadh, Olaya District", vatNumber: "300022233300003" },
];

export const serviceRequests = [
  { id: "SR-001", customer: "Al Rajhi Commercial", type: "Maintenance", description: "HVAC system annual maintenance", priority: "Medium", technician: "Omar Khalid", location: "Riyadh, King Fahd Road", status: "In Progress" as const },
  { id: "SR-002", customer: "Jeddah Grand Mall", type: "Installation", description: "New split AC installation - 15 units", priority: "High", technician: "Yusuf Ali", location: "Jeddah, Tahlia Street", status: "Assigned" as const },
  { id: "SR-003", customer: "SABIC Industrial Complex", type: "Repair", description: "Compressor failure in Unit #7", priority: "Urgent", technician: "Unassigned", location: "Jubail Industrial City", status: "Pending" as const },
  { id: "SR-004", customer: "Hilton Riyadh Hotel", type: "Maintenance", description: "Quarterly HVAC inspection", priority: "Low", technician: "Omar Khalid", location: "Riyadh, Olaya District", status: "Completed" as const },
  { id: "SR-005", customer: "Al Rajhi Commercial", type: "Repair", description: "Thermostat malfunction - Floor 3", priority: "High", technician: "Yusuf Ali", location: "Riyadh, King Fahd Road", status: "Invoiced" as const },
];

export const invoices = [
  { id: "INV-2024-001", customer: "Al Rajhi Commercial", jobRef: "SR-005", date: "2024-12-15", hardware: 1160, service: 500, labor: 300, vat: 294, total: 2254, status: "Paid" as const },
  { id: "INV-2024-002", customer: "Hilton Riyadh Hotel", jobRef: "SR-004", date: "2024-12-20", hardware: 0, service: 800, labor: 400, vat: 180, total: 1380, status: "Paid" as const },
  { id: "INV-2024-003", customer: "Jeddah Grand Mall", jobRef: "SR-002", date: "2025-01-05", hardware: 29250, service: 3000, labor: 2500, vat: 5212.5, total: 39962.5, status: "Pending" as const },
  { id: "INV-2024-004", customer: "SABIC Industrial Complex", jobRef: "SR-003", date: "2025-01-10", hardware: 3800, service: 1200, labor: 600, vat: 840, total: 6440, status: "Overdue" as const },
];

export const suppliers = [
  { id: "SUP-001", name: "Carrier Saudi", contact: "Ali Ibrahim", email: "ali@carriersaudi.sa", address: "Riyadh Industrial Area" },
  { id: "SUP-002", name: "Daikin Arabia", contact: "Hassan Omar", email: "hassan@daikinarabia.sa", address: "Jeddah, Industrial Zone" },
  { id: "SUP-003", name: "Honeywell ME", contact: "Fatima Al Dosari", email: "fatima@honeywellme.com", address: "Dubai, UAE" },
  { id: "SUP-004", name: "Gulf Metals", contact: "Khalid Nasser", email: "khalid@gulfmetals.sa", address: "Dammam, Industrial Port" },
];

export const dashboardStats = {
  totalInventoryValue: 187450,
  lowStockItems: 2,
  pendingRequests: 1,
  jobsInProgress: 1,
  monthlyRevenue: 50036.5,
  pendingInvoices: 46402.5,
};
