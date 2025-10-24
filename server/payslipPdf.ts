import { jsPDF } from "jspdf";

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
  
  // Header
  doc.setFillColor(...lavander);
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("Neuron", 105, 20, { align: "center" });
  
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.text("Payslip", 105, 30, { align: "center" });
  
  // Reset text color
  doc.setTextColor(29, 29, 27);
  
  // Payslip period
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(`${monthNames[data.month - 1]} ${data.year}`, 105, 55, { align: "center" });
  
  // Employee details section
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Details", 20, 70);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  
  const employeeDetailsY = 80;
  doc.text("Name:", 20, employeeDetailsY);
  doc.text(data.employeeName, 60, employeeDetailsY);
  
  doc.text("Email:", 20, employeeDetailsY + 7);
  doc.text(data.employeeEmail, 60, employeeDetailsY + 7);
  
  doc.text("Designation:", 20, employeeDetailsY + 14);
  doc.text(data.designation, 60, employeeDetailsY + 14);
  
  // Salary breakdown section
  const breakdownY = 115;
  doc.setFillColor(...seashell);
  doc.rect(15, breakdownY, 180, 10, 'F');
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Salary Breakdown", 20, breakdownY + 7);
  
  // Table headers
  const tableY = breakdownY + 20;
  doc.setFillColor(...lavander);
  doc.rect(15, tableY - 7, 180, 10, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Description", 20, tableY);
  doc.text("Amount (₹)", 150, tableY);
  
  // Table rows
  doc.setTextColor(29, 29, 27);
  doc.setFont("helvetica", "normal");
  
  let currentY = tableY + 10;
  
  // Gross Salary
  doc.text("Gross Salary", 20, currentY);
  doc.text(formatCurrency(data.grossSalary), 150, currentY);
  currentY += 10;
  
  // Deductions header
  doc.setFont("helvetica", "bold");
  doc.text("Deductions:", 20, currentY);
  currentY += 8;
  
  doc.setFont("helvetica", "normal");
  
  // TDS
  doc.text("  TDS (10%)", 20, currentY);
  doc.text(`- ${formatCurrency(data.tds)}`, 150, currentY);
  currentY += 7;
  
  // Leave deductions (if any)
  if (data.deductions > 0) {
    doc.text("  Leave Deductions", 20, currentY);
    doc.text(`- ${formatCurrency(data.deductions)}`, 150, currentY);
    currentY += 7;
  }
  
  // Total deductions
  currentY += 3;
  doc.setFont("helvetica", "bold");
  doc.text("Total Deductions", 20, currentY);
  doc.text(`- ${formatCurrency(data.tds + data.deductions)}`, 150, currentY);
  
  // Net Salary
  currentY += 15;
  doc.setFillColor(...tea);
  doc.rect(15, currentY - 7, 180, 12, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text("Net Salary", 20, currentY);
  doc.text(formatCurrency(data.netSalary), 150, currentY);
  
  // Footer
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const footerY = 270;
  doc.text("This is a computer-generated payslip and does not require a signature.", 105, footerY, { align: "center" });
  doc.text(`Generated on: ${new Date(data.generatedDate).toLocaleDateString('en-IN')}`, 105, footerY + 5, { align: "center" });
  
  // Convert to buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}

