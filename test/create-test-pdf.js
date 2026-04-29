const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');

async function createTestInvoice() {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([612, 792]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const { width, height } = page.getSize();
  
  // Header
  page.drawText('Tech Solutions Inc.', {
    x: 50,
    y: height - 50,
    font: boldFont,
    size: 24,
  });

  page.drawText('123 Business Street', {
    x: 50,
    y: height - 80,
    font: font,
    size: 12,
  });

  page.drawText('San Francisco, CA 94102', {
    x: 50,
    y: height - 95,
    font: font,
    size: 12,
  });

  // Invoice Title
  page.drawText('INVOICE', {
    x: width - 150,
    y: height - 50,
    font: boldFont,
    size: 28,
  });

  // Invoice Details
  page.drawText('Invoice #:', {
    x: width - 200,
    y: height - 90,
    font: boldFont,
    size: 10,
  });
  page.drawText('INV-2026-0429', {
    x: width - 130,
    y: height - 90,
    font: font,
    size: 10,
  });

  page.drawText('Date:', {
    x: width - 200,
    y: height - 105,
    font: boldFont,
    size: 10,
  });
  page.drawText('2026-04-29', {
    x: width - 130,
    y: height - 105,
    font: font,
    size: 10,
  });

  page.drawText('Due Date:', {
    x: width - 200,
    y: height - 120,
    font: boldFont,
    size: 10,
  });
  page.drawText('2026-05-29', {
    x: width - 130,
    y: height - 120,
    font: font,
    size: 10,
  });

  // Bill To
  page.drawText('Bill To:', {
    x: 50,
    y: height - 180,
    font: boldFont,
    size: 12,
  });
  page.drawText('Client Corp Inc.', {
    x: 50,
    y: height - 200,
    font: font,
    size: 12,
  });

  // Line Items Header
  page.drawText('Description', {
    x: 50,
    y: height - 280,
    font: boldFont,
    size: 10,
  });
  page.drawText('Qty', {
    x: 300,
    y: height - 280,
    font: boldFont,
    size: 10,
  });
  page.drawText('Price', {
    x: 380,
    y: height - 280,
    font: boldFont,
    size: 10,
  });
  page.drawText('Amount', {
    x: 460,
    y: height - 280,
    font: boldFont,
    size: 10,
  });

  // Line
  page.drawLine({
    start: { x: 50, y: height - 290 },
    end: { x: 550, y: height - 290 },
    thickness: 1,
  });

  // Items
  const items = [
    { desc: 'Consulting Services', qty: '10', price: '$150.00', amount: '$1,500.00' },
    { desc: 'Software License', qty: '2', price: '$299.00', amount: '$598.00' },
    { desc: 'Support Package', qty: '1', price: '$499.00', amount: '$499.00' },
  ];

  let y = height - 310;
  items.forEach((item) => {
    page.drawText(item.desc, {
      x: 50,
      y: y,
      font: font,
      size: 10,
    });
    page.drawText(item.qty, {
      x: 300,
      y: y,
      font: font,
      size: 10,
    });
    page.drawText(item.price, {
      x: 380,
      y: y,
      font: font,
      size: 10,
    });
    page.drawText(item.amount, {
      x: 460,
      y: y,
      font: font,
      size: 10,
    });
    y -= 25;
  });

  // Totals
  page.drawLine({
    start: { x: 350, y: y - 10 },
    end: { x: 550, y: y - 10 },
    thickness: 1,
  });

  y -= 30;
  page.drawText('Subtotal:', {
    x: 380,
    y: y,
    font: boldFont,
    size: 10,
  });
  page.drawText('$2,597.00', {
    x: 460,
    y: y,
    font: font,
    size: 10,
  });

  y -= 20;
  page.drawText('Tax (10%):', {
    x: 380,
    y: y,
    font: boldFont,
    size: 10,
  });
  page.drawText('$259.70', {
    x: 460,
    y: y,
    font: font,
    size: 10,
  });

  y -= 25;
  page.drawText('TOTAL:', {
    x: 380,
    y: y,
    font: boldFont,
    size: 14,
  });
  page.drawText('$2,856.70', {
    x: 460,
    y: y,
    font: boldFont,
    size: 14,
  });

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('./test/sample-invoice.pdf', pdfBytes);
  console.log('Test PDF created: test/sample-invoice.pdf');
}

createTestInvoice().catch(console.error);
