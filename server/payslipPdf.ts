import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import { join } from "path";

interface PayslipData {
  employeeName: string;
  employeeEmail: string;
  designation: string;
  month: number;
  year: number;
  grossSalary: number;
  tds: number;
  deductions: number;
  netSalary: number;
  generatedDate: Date;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function generatePayslipPDF(data: PayslipData): Buffer {
  const doc = new jsPDF();
  
  // Colors from brand palette
  const lavander: [number, number, number] = [128, 139, 197];
  const tea: [number, number, number] = [36, 94, 85];
  const seashell: [number, number, number] = [234, 228, 218];
  const mutedBlack: [number, number, number] = [29, 29, 27];
  const sky: [number, number, number] = [158, 214, 223];
  
  // Header with gradient effect
  doc.setFillColor(...lavander);
  doc.rect(0, 0, 210, 50, 'F');
  
  // Add decorative accent
  doc.setFillColor(...sky);
  doc.rect(0, 48, 210, 2, 'F');
  
  // Try to load and add NeuralArc logo
  try {
    const logoPath = join(process.cwd(), 'client/public/neuralarc-logo.png');
    const logoData = readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoData.toString('base64')}`;
    doc.addImage(logoBase64, 'PNG', 15, 10, 60, 15);
  } catch (error) {
    // If logo fails to load, show company name
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("NeuralArc", 15, 20);
  }
  
  // Company details on the right
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Neural Arc Inc", 195, 15, { align: "right" });
  doc.text("neuralarc.ai", 195, 20, { align: "right" });
  doc.setFontSize(7);
  doc.text("India Office: AMPVC Consulting LLP,", 195, 28, { align: "right" });
  doc.text("Trimurti HoneyGold, Range Hills Road,", 195, 32, { align: "right" });
  doc.text("Pune 411 007", 195, 36, { align: "right" });
  
  // Payslip title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("PAYSLIP", 195, 44, { align: "right" });
  
  // Reset text color
  doc.setTextColor(...mutedBlack);
  
  // Payslip period with decorative box
  doc.setFillColor(...seashell);
  doc.roundedRect(15, 58, 180, 14, 3, 3, 'F');
  
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...tea);
  doc.text(`${monthNames[data.month - 1]} ${data.year}`, 105, 67, { align: "center" });
  
  // Employee details section
  doc.setTextColor(...mutedBlack);
  doc.setFillColor(...lavander);
  doc.setDrawColor(...lavander);
  
  const detailsY = 80;
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Information", 15, detailsY);
  
  // Decorative line
  doc.setLineWidth(0.5);
  doc.line(15, detailsY + 2, 195, detailsY + 2);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const infoY = detailsY + 10;
  const col1X = 15;
  const col2X = 70;
  const lineHeight = 7;
  
  // Left column
  doc.setFont("helvetica", "bold");
  doc.text("Employee Name:", col1X, infoY);
  doc.setFont("helvetica", "normal");
  doc.text(data.employeeName, col2X, infoY);
  
  doc.setFont("helvetica", "bold");
  doc.text("Email:", col1X, infoY + lineHeight);
  doc.setFont("helvetica", "normal");
  doc.text(data.employeeEmail, col2X, infoY + lineHeight);
  
  doc.setFont("helvetica", "bold");
  doc.text("Designation:", col1X, infoY + lineHeight * 2);
  doc.setFont("helvetica", "normal");
  doc.text(data.designation, col2X, infoY + lineHeight * 2);
  
  // Salary breakdown section
  const breakdownY = 125;
  
  // Section header
  doc.setFillColor(...lavander);
  doc.roundedRect(15, breakdownY, 180, 10, 2, 2, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("Salary Breakdown", 20, breakdownY + 7);
  
  // Table
  const tableY = breakdownY + 18;
  doc.setTextColor(...mutedBlack);
  doc.setFontSize(10);
  
  // Table borders
  doc.setDrawColor(...lavander);
  doc.setLineWidth(0.3);
  
  let currentY = tableY;
  
  // Earnings section
  doc.setFillColor(...seashell);
  doc.rect(15, currentY, 180, 8, 'FD');
  doc.setFont("helvetica", "bold");
  doc.text("Earnings", 20, currentY + 5.5);
  currentY += 8;
  
  // Gross Salary
  doc.setFont("helvetica", "normal");
  doc.rect(15, currentY, 130, 8, 'D');
  doc.rect(145, currentY, 50, 8, 'D');
  doc.text("Gross Salary", 20, currentY + 5.5);
  doc.text(formatCurrency(data.grossSalary), 190, currentY + 5.5, { align: "right" });
  currentY += 8;
  
  // Deductions section
  doc.setFillColor(...seashell);
  doc.rect(15, currentY, 180, 8, 'FD');
  doc.setFont("helvetica", "bold");
  doc.text("Deductions", 20, currentY + 5.5);
  currentY += 8;
  
  // TDS
  doc.setFont("helvetica", "normal");
  doc.rect(15, currentY, 130, 8, 'D');
  doc.rect(145, currentY, 50, 8, 'D');
  doc.text("TDS (10%)", 20, currentY + 5.5);
  doc.setTextColor(237, 119, 60); // Tangerine
  doc.text(`- ${formatCurrency(data.tds)}`, 190, currentY + 5.5, { align: "right" });
  currentY += 8;
  
  // Leave deductions (if any)
  if (data.deductions > 0) {
    doc.setTextColor(...mutedBlack);
    doc.rect(15, currentY, 130, 8, 'D');
    doc.rect(145, currentY, 50, 8, 'D');
    doc.text("Leave Deductions", 20, currentY + 5.5);
    doc.setTextColor(198, 63, 62); // Red Passion
    doc.text(`- ${formatCurrency(data.deductions)}`, 190, currentY + 5.5, { align: "right" });
    currentY += 8;
  }
  
  // Total deductions
  doc.setTextColor(...mutedBlack);
  doc.setFont("helvetica", "bold");
  doc.rect(15, currentY, 130, 8, 'D');
  doc.rect(145, currentY, 50, 8, 'D');
  doc.text("Total Deductions", 20, currentY + 5.5);
  doc.setTextColor(198, 63, 62);
  doc.text(`- ${formatCurrency(data.tds + data.deductions)}`, 190, currentY + 5.5, { align: "right" });
  currentY += 8;
  
  // Net Salary - highlighted
  currentY += 3;
  doc.setFillColor(...tea);
  doc.roundedRect(15, currentY, 180, 12, 2, 2, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Net Salary", 20, currentY + 8);
  doc.text(formatCurrency(data.netSalary), 190, currentY + 8, { align: "right" });
  
  // Net salary in words
  currentY += 18;
  doc.setTextColor(...mutedBlack);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(`Amount in words: ${numberToWords(data.netSalary)} Rupees Only`, 15, currentY);
  
  // Decorative footer
  const footerY = 270;
  doc.setDrawColor(...lavander);
  doc.setLineWidth(0.5);
  doc.line(15, footerY - 5, 195, footerY - 5);
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.text("This is a computer-generated payslip and does not require a signature.", 105, footerY, { align: "center" });
  doc.text(`Generated on: ${new Date(data.generatedDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}`, 105, footerY + 5, { align: "center" });
  
  // Decorative corner accent
  doc.setFillColor(...sky);
  doc.circle(200, 285, 15, 'F');
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
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
  
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000;
  
  let result = "";
  
  if (crore > 0) result += convertLessThanThousand(crore) + " Crore ";
  if (lakh > 0) result += convertLessThanThousand(lakh) + " Lakh ";
  if (thousand > 0) result += convertLessThanThousand(thousand) + " Thousand ";
  if (remainder > 0) result += convertLessThanThousand(remainder);
  
  return result.trim();
}

