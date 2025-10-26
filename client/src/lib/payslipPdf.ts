import { jsPDF } from "jspdf";

interface PayslipData {
  employee: {
    name: string;
    designation: string;
    employeeId: string;
    agreementRefId?: string;
  };
  period: {
    month: string;
    year: number;
  };
  salary: {
    basic: number;
    hra: number;
    otherAllowances: number;
    gross: number;
    tds: number;
    leaveDeduction: number;
    netSalary: number;
  };
  leaves: {
    taken: number;
    quota: number;
    excess: number;
  };
  settings: {
    workingDays: number;
    tdsRate: number;
  };
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero";

  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const teens = ["Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];

  function convertLessThanThousand(n: number): string {
    if (n === 0) return "";
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + ones[n % 10] : "");
    return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " " + convertLessThanThousand(n % 100) : "");
  }

  function convert(n: number): string {
    if (n === 0) return "Zero";
    
    const crore = Math.floor(n / 10000000);
    const lakh = Math.floor((n % 10000000) / 100000);
    const thousand = Math.floor((n % 100000) / 1000);
    const remainder = n % 1000;

    let result = "";
    if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
    if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
    if (thousand > 0) result += convertLessThanThousand(thousand) + " Thousand ";
    if (remainder > 0) result += convertLessThanThousand(remainder);

    return result.trim();
  }

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = convert(rupees) + " Rupees";
  if (paise > 0) {
    result += " and " + convert(paise) + " Paise";
  }
  return result + " Only";
}

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export async function generatePayslipPDF(data: PayslipData): Promise<void> {
  // A5 landscape dimensions (half of A4): 210mm x 148mm
  const doc = new jsPDF({
    orientation: "landscape",
    unit: "mm",
    format: "a5"
  });

  const pageWidth = 210;
  const pageHeight = 148;
  const margin = 12;
  const contentWidth = pageWidth - (margin * 2);

  let y = margin;

  // Load NeuralArc logo (try to load from public folder)
  try {
    const logoUrl = '/neuralarc-logo.png';
    
    // Load image with proper dimensions
    const loadImage = (src: string): Promise<HTMLImageElement> => {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });
    };
    
    const img = await loadImage(logoUrl);
    
    // Calculate proper dimensions maintaining aspect ratio
    // Original logo: 785x211 = 3.72:1 aspect ratio
    // Target height: 12mm
    const targetHeight = 12;
    const targetWidth = targetHeight * 3.72; // ~45mm to maintain aspect ratio
    
    doc.addImage(img, 'PNG', margin, y, targetWidth, targetHeight);
  } catch (error) {
    console.log('Could not load logo image', error);
    // Draw NeuralArc text as fallback
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("NeuralArc", margin, y + 8);
  }
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.text("Neural Arc Inc", pageWidth - margin, y + 2, { align: "right" });
  doc.text("neuralarc.ai", pageWidth - margin, y + 5, { align: "right" });
  doc.setFontSize(6);
  doc.text("India Office: AMPVC Consulting LLP, Trimurti HoneyGold,", pageWidth - margin, y + 8.5, { align: "right" });
  doc.text("Range Hills Road, Pune 411 007", pageWidth - margin, y + 11.5, { align: "right" });

  y += 17; // Adjusted from 18 to 17 for better spacing

  // Large PAYMENT ADVICE heading
  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.text("PAYMENT ADVICE", pageWidth / 2, y, { align: "center" });

  y += 12; // Adjusted from 10 to 12 for better spacing

  // Highlighted payment period
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, contentWidth, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`Payment for ${data.period.month} ${data.period.year}`, pageWidth / 2, y + 6.5, { align: "center" });
  doc.setTextColor(0, 0, 0);

  y += 15; // Adjusted from 14 to 15 for better spacing

  // Employee details box
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  const detailsHeight = data.employee.agreementRefId ? 20 : 16;
  doc.rect(margin, y, contentWidth, detailsHeight);
  
  // Vertical divider
  doc.line(pageWidth / 2, y, pageWidth / 2, y + detailsHeight);

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Name:", margin + 3, y + 5);
  doc.text("Designation:", margin + 3, y + 10);
  doc.text("Employee ID:", margin + 3, y + 15);

  doc.setFont("helvetica", "normal");
  doc.text(data.employee.name, margin + 35, y + 5);
  doc.text(data.employee.designation, margin + 35, y + 10);
  doc.text(data.employee.employeeId, margin + 35, y + 15);

  // Agreement Reference (if exists)
  if (data.employee.agreementRefId) {
    doc.setFont("helvetica", "bold");
    doc.text("Agreement Ref:", margin + 3, y + 19);
    doc.setFont("helvetica", "normal");
    doc.text(data.employee.agreementRefId, margin + 35, y + 19);
  }

  doc.setFont("helvetica", "bold");
  doc.text("Working Days:", pageWidth / 2 + 3, y + 5);
  doc.text("Leaves Taken:", pageWidth / 2 + 3, y + 10);
  doc.text("Excess Leaves:", pageWidth / 2 + 3, y + 15);

  doc.setFont("helvetica", "normal");
  doc.text(data.settings.workingDays.toString(), pageWidth / 2 + 35, y + 5);
  doc.text(`${data.leaves.taken} / ${data.leaves.quota}`, pageWidth / 2 + 35, y + 10);
  doc.text(data.leaves.excess > 0 ? data.leaves.excess.toString() : "-", pageWidth / 2 + 35, y + 15);

  y += detailsHeight + 4;

  // Earnings and Deductions table
  const tableY = y;
  const colWidth = contentWidth / 2;

  // Table headers
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, tableY, colWidth, 8, "F");
  doc.rect(margin + colWidth, tableY, colWidth, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("EARNINGS", margin + 3, tableY + 5.5);
  doc.text("DEDUCTIONS", margin + colWidth + 3, tableY + 5.5);

  // Table borders
  doc.rect(margin, tableY, colWidth, 8);
  doc.rect(margin + colWidth, tableY, colWidth, 8);

  y = tableY + 8;

  // Earnings rows
  const earnings = [
    { label: "Gross Payment", amount: data.salary.gross },
  ];

  const deductions = [
    { label: "TDS", amount: data.salary.tds },
    { label: "Leave Deduction", amount: data.salary.leaveDeduction },
  ];

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  const rowHeight = 6;
  const maxRows = Math.max(earnings.length, deductions.length);

  for (let i = 0; i < maxRows; i++) {
    // Earnings
    if (i < earnings.length) {
      doc.rect(margin, y, colWidth, rowHeight);
      doc.text(earnings[i].label, margin + 2, y + 4);
      doc.setFontSize(6); // Even smaller font for amounts
      // Align at the right edge of EARNINGS column
      const earningAmount = formatCurrency(earnings[i].amount);
      doc.text(earningAmount, margin + colWidth - 2, y + 4);
      doc.setFontSize(8); // Reset font size
    }

    // Deductions
    if (i < deductions.length) {
      doc.rect(margin + colWidth, y, colWidth, rowHeight);
      doc.text(deductions[i].label, margin + colWidth + 2, y + 4);
      doc.setFontSize(6); // Even smaller font for amounts
      // Align at the right edge of DEDUCTIONS column (right edge of table)
      const deductionAmount = formatCurrency(deductions[i].amount);
      doc.text(deductionAmount, pageWidth - margin - 2, y + 4);
      doc.setFontSize(8); // Reset font size
    }

    y += rowHeight;
  }

  // Totals row
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, colWidth, 7, "F");
  doc.rect(margin + colWidth, y, colWidth, 7, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7); // Smaller font to prevent overflow
  doc.text("GROSS PAYMENT", margin + 2, y + 4.5);
  doc.setFontSize(6); // Even smaller font for amounts in totals
  const grossAmount = formatCurrency(data.salary.gross);
  // Align at the right edge of EARNINGS column
  doc.text(grossAmount, margin + colWidth - 2, y + 4.5);

  const totalDeductions = data.salary.tds + data.salary.leaveDeduction;
  doc.setFontSize(7); // Reset to bold for label
  doc.text("TOTAL DEDUCTIONS", margin + colWidth + 2, y + 4.5);
  doc.setFontSize(6); // Smaller font for amounts
  const totalDeductionsAmount = formatCurrency(totalDeductions);
  // Align at the right edge of DEDUCTIONS column (right edge of table)
  doc.text(totalDeductionsAmount, pageWidth - margin - 2, y + 4.5);

  doc.rect(margin, y, colWidth, 7);
  doc.rect(margin + colWidth, y, colWidth, 7);

  y += 10;

  // Net Payment box
  doc.setFillColor(0, 0, 0);
  doc.rect(margin, y, contentWidth, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("NET PAYMENT", margin + 3, y + 6.5);
  doc.text(formatCurrency(data.salary.netSalary), pageWidth - margin - 3, y + 6.5, { align: "right" });
  doc.setTextColor(0, 0, 0);

  y += 13;

  // Amount in words
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.text("Amount in Words:", margin, y);
  doc.setFont("helvetica", "normal");
  const amountWords = numberToWords(data.salary.netSalary);
  doc.text(amountWords, margin, y + 4, { maxWidth: contentWidth });

  // Footer
  y = pageHeight - 12;
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.text("This is a computer-generated payment advice and does not require a signature.", pageWidth / 2, y, { align: "center" });
  doc.text(`Generated on ${new Date().toLocaleDateString('en-IN')}`, pageWidth / 2, y + 3, { align: "center" });

  // Download the PDF
  doc.save(`Payment-Advice-${data.employee.name}-${data.period.month}-${data.period.year}.pdf`);
}

