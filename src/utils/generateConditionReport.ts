import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";
import type { MapRoom, MapItem, MapPhoto } from "@/hooks/useConditionMapper";
import { CONDITION_LABELS, type ItemCondition } from "@/utils/conditionMapperDefaults";

// Brand colours (LISTD navy/teal)
const NAVY: [number, number, number] = [15, 23, 42];
const TEAL: [number, number, number] = [20, 184, 166];
const WHITE: [number, number, number] = [255, 255, 255];
const LIGHT_GRAY: [number, number, number] = [241, 245, 249];
const DARK_GRAY: [number, number, number] = [100, 116, 139];

const CONDITION_BADGE_COLORS: Record<ItemCondition, [number, number, number]> = {
  good: [16, 185, 129],
  fair: [234, 179, 8],
  poor: [239, 68, 68],
  na: [156, 163, 175],
};

interface PropertyInfo {
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  postcode: string;
}

interface ConditionReportParams {
  jobId: string;
  inspectionType?: string;
  scheduledDate?: string;
  property?: PropertyInfo | null;
  rooms: MapRoom[];
  items: MapItem[];
  photos: MapPhoto[];
  clerkName?: string;
}

async function loadImageAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function generateConditionReportPDF(
  params: ConditionReportParams,
  onProgress?: (pct: number) => void
): Promise<jsPDF> {
  const { property, rooms, items, photos, inspectionType, scheduledDate, clerkName } = params;
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 20) {
      doc.addPage();
      y = margin;
    }
  };

  // ── Cover Header ────────────────────────────────────────────────
  doc.setFillColor(...NAVY);
  doc.rect(0, 0, pageWidth, 52, "F");
  doc.setFillColor(...TEAL);
  doc.rect(0, 52, pageWidth, 3, "F");

  // Brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(...WHITE);
  doc.text("LISTD", margin, 22);

  // Report type
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  const typeLabel = inspectionType
    ? inspectionType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Condition Report";
  doc.text(typeLabel + " — Condition Report", margin, 34);

  // Date
  doc.setFontSize(10);
  const dateStr = scheduledDate
    ? format(new Date(scheduledDate), "dd MMMM yyyy")
    : format(new Date(), "dd MMMM yyyy");
  doc.text(dateStr, margin, 44);

  // Address on right
  if (property) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(property.address_line_1, pageWidth - margin, 22, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const addr2 = [property.address_line_2, property.city, property.postcode]
      .filter(Boolean)
      .join(", ");
    doc.text(addr2, pageWidth - margin, 30, { align: "right" });
  }

  y = 62;
  onProgress?.(5);

  // ── Summary Table ──────────────────────────────────────────────
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Summary", margin, y);
  y += 7;

  const totalItems = items.length;
  const ratedItems = items.filter((i) => i.condition !== "na");
  const goodCount = items.filter((i) => i.condition === "good").length;
  const fairCount = items.filter((i) => i.condition === "fair").length;
  const poorCount = items.filter((i) => i.condition === "poor").length;
  const naCount = items.filter((i) => i.condition === "na").length;

  const summaryRows = [
    ["Total Rooms", String(rooms.length)],
    ["Total Items", String(totalItems)],
    ["Items Rated", `${ratedItems.length} / ${totalItems}`],
    ["Good", String(goodCount)],
    ["Fair", String(fairCount)],
    ["Poor", String(poorCount)],
    ["N/A", String(naCount)],
  ];

  if (clerkName) {
    summaryRows.unshift(["Inspector", clerkName]);
  }

  autoTable(doc, {
    startY: y,
    head: [],
    body: summaryRows,
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: { fontSize: 9, cellPadding: 2, textColor: NAVY },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 40, textColor: DARK_GRAY as any },
      1: { cellWidth: contentWidth - 40 },
    },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  onProgress?.(10);

  // ── Schedule of Condition (overview) ────────────────────────────
  ensureSpace(30);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Schedule of Condition", margin, y);
  y += 7;

  const scheduleRows = rooms.map((room) => {
    const roomItems = items.filter((i) => i.room_id === room.id);
    const rated = roomItems.filter((i) => i.condition !== "na").length;
    const total = roomItems.length;

    // Derive overall from worst condition
    const conditions = roomItems.map((i) => i.condition).filter((c) => c !== "na");
    let overall = "—";
    if (conditions.includes("poor")) overall = "Poor";
    else if (conditions.includes("fair")) overall = "Fair";
    else if (conditions.includes("good")) overall = "Good";

    return [room.room_name, String(total), `${rated}/${total}`, overall];
  });

  autoTable(doc, {
    startY: y,
    head: [["Room / Area", "Items", "Rated", "Overall"]],
    body: scheduleRows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3 },
    alternateRowStyles: { fillColor: LIGHT_GRAY as any },
  });

  y = (doc as any).lastAutoTable.finalY + 10;
  onProgress?.(20);

  // ── Detailed Room Sections ──────────────────────────────────────
  for (let ri = 0; ri < rooms.length; ri++) {
    const room = rooms[ri];
    const roomItems = items.filter((i) => i.room_id === room.id);
    const roomPhotos = photos.filter((p) => roomItems.some((i) => i.id === p.item_id));

    ensureSpace(40);

    // Room heading with teal accent
    doc.setFillColor(...TEAL);
    doc.rect(margin, y - 1, 3, 8, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...NAVY);
    doc.text(room.room_name, margin + 6, y + 5);
    y += 12;

    // Items table
    if (roomItems.length > 0) {
      const itemRows = roomItems.map((item) => [
        item.item_name,
        CONDITION_LABELS[item.condition] || "N/A",
        item.notes || "—",
      ]);

      autoTable(doc, {
        startY: y,
        head: [["Item", "Condition", "Notes"]],
        body: itemRows,
        margin: { left: margin, right: margin },
        headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: "bold", fontSize: 7 },
        styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 25 },
          2: { cellWidth: contentWidth - 65 },
        },
        alternateRowStyles: { fillColor: LIGHT_GRAY as any },
        didParseCell: (data: any) => {
          // Color-code the condition column
          if (data.section === "body" && data.column.index === 1) {
            const condValue = roomItems[data.row.index]?.condition;
            if (condValue && CONDITION_BADGE_COLORS[condValue]) {
              data.cell.styles.textColor = CONDITION_BADGE_COLORS[condValue];
              data.cell.styles.fontStyle = "bold";
            }
          }
        },
      });

      y = (doc as any).lastAutoTable.finalY + 5;
    }

    // Photos for items in this room
    if (roomPhotos.length > 0) {
      ensureSpace(40);
      const thumbSize = 30;
      const gap = 4;
      const perRow = Math.floor(contentWidth / (thumbSize + gap));
      let col = 0;

      for (const photo of roomPhotos) {
        if (col >= perRow) {
          col = 0;
          y += thumbSize + gap + 4;
          ensureSpace(thumbSize + gap);
        }

        const imgData = await loadImageAsDataUrl(photo.photo_url);
        if (imgData) {
          const x = margin + col * (thumbSize + gap);
          try {
            doc.addImage(imgData, "JPEG", x, y, thumbSize, thumbSize);
          } catch {
            // Skip invalid images
          }
          col++;
        }
      }
      y += thumbSize + 8;
    }

    y += 5;
    onProgress?.(20 + Math.round(((ri + 1) / rooms.length) * 60));
  }

  // ── Glossary ────────────────────────────────────────────────────
  ensureSpace(50);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...NAVY);
  doc.text("Condition Definitions", margin, y);
  y += 7;

  const glossaryRows = [
    ["Good", "Item is in good working order with no significant damage, marks, or wear."],
    ["Fair", "Minor signs of wear, small marks, or light discolouration. Functional and acceptable."],
    ["Poor", "Significant wear, damage, stains, or defects. May require repair or replacement."],
    ["N/A", "Not applicable — item not present or not assessed."],
  ];

  autoTable(doc, {
    startY: y,
    head: [["Rating", "Definition"]],
    body: glossaryRows,
    margin: { left: margin, right: margin },
    headStyles: { fillColor: NAVY as any, textColor: WHITE as any, fontStyle: "bold", fontSize: 8 },
    styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 25 },
      1: { cellWidth: contentWidth - 25 },
    },
    alternateRowStyles: { fillColor: LIGHT_GRAY as any },
  });

  y = (doc as any).lastAutoTable.finalY + 10;

  // ── Disclaimer ─────────────────────────────────────────────────
  ensureSpace(20);
  doc.setFontSize(7);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(...DARK_GRAY);
  const disclaimer =
    "This condition report has been prepared by a LISTD inventory clerk and provides a fair and accurate representation of the property's condition at the time of inspection. " +
    "All observations are made in good faith. This document may be used as evidence in any deposit dispute resolution.";
  const discLines = doc.splitTextToSize(disclaimer, contentWidth);
  doc.text(discLines, margin, y);

  // ── Footers ────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...DARK_GRAY);
    doc.text(
      `Page ${i} of ${totalPages}  •  LISTD Condition Report  •  ${format(new Date(), "dd/MM/yyyy HH:mm")}`,
      pageWidth / 2,
      pageHeight - 8,
      { align: "center" }
    );
    doc.setFillColor(...TEAL);
    doc.rect(0, pageHeight - 3, pageWidth, 3, "F");
  }

  onProgress?.(100);
  return doc;
}
