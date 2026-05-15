import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface InvoiceData {
  bookingId: string;
  guestName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomCharge: number;
  culinaryCharge: number;
  serviceCharge: number;
  tax: number;
  totalStayAmount: number;
  paidAlready: number;
  balanceAmount: number;
  currency: string;
}

export const generateInvoicePDF = async (data: InvoiceData) => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #333; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 20px; }
          .hotel-info h1 { margin: 0; font-size: 28px; }
          .hotel-info p { margin: 5px 0; color: #666; }
          .invoice-title { text-align: right; }
          .invoice-title h2 { margin: 0; color: #C26A2C; font-size: 24px; }
          .details-section { display: flex; justify-content: space-between; margin-top: 40px; }
          .details-box h3 { font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px; margin-bottom: 10px; }
          .details-row { display: flex; margin-bottom: 5px; font-size: 14px; }
          .label { font-weight: bold; width: 100px; }
          table { width: 100%; border-collapse: collapse; margin-top: 40px; }
          th { background-color: #f8f8f8; text-align: left; padding: 12px; border-bottom: 2px solid #ddd; font-size: 14px; }
          td { padding: 12px; border-bottom: 1px solid #eee; font-size: 14px; }
          .totals { margin-top: 30px; text-align: right; }
          .total-row { display: flex; justify-content: flex-end; margin-bottom: 8px; }
          .total-label { font-weight: bold; margin-right: 20px; width: 150px; }
          .grand-total { font-size: 20px; font-weight: bold; color: #000; margin-top: 10px; border-top: 2px solid #000; padding-top: 10px; }
          .paid-row { color: #2E7D32; }
          .balance-row { font-size: 20px; font-weight: bold; color: #C26A2C; }
          .footer { margin-top: 60px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="hotel-info">
            <h1>ZENBOURG GRAND</h1>
            <p>Institutional Excellence in Hospitality</p>
            <p>support@zenbourg.com | +91 6388163169</p>
          </div>
          <div class="invoice-title">
            <h2>TAX INVOICE</h2>
            <p>ID: #INV-${String(data.bookingId || '').slice(-6).toUpperCase()}</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div class="details-section">
          <div class="details-box">
            <h3>GUEST DETAILS</h3>
            <div class="details-row"><span class="label">Name:</span> ${data.guestName}</div>
            <div class="details-row"><span class="label">Suite:</span> #${data.roomNumber}</div>
          </div>
          <div class="details-box" style="text-align: right;">
            <h3>STAY INFORMATION</h3>
            <div class="details-row" style="justify-content: flex-end;"><span class="label">Arrival:</span> ${new Date(data.checkIn).toDateString()}</div>
            <div class="details-row" style="justify-content: flex-end;"><span class="label">Departure:</span> ${new Date(data.checkOut).toDateString()}</div>
            <div class="details-row" style="justify-content: flex-end;"><span class="label">Duration:</span> ${data.nights} Night(s)</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>DESCRIPTION</th>
              <th style="text-align: right;">AMOUNT</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Room Charge (Base Price x ${data.nights ?? 1})</td>
              <td style="text-align: right;">${data.currency ?? 'INR'} ${(data.roomCharge ?? 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Culinary Folio (In-room Dining & Restaurant)</td>
              <td style="text-align: right;">${data.currency ?? 'INR'} ${(data.culinaryCharge ?? 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Service Folio (Housekeeping & Maintenance)</td>
              <td style="text-align: right;">${data.currency ?? 'INR'} ${(data.serviceCharge ?? 0).toLocaleString()}</td>
            </tr>
            <tr>
              <td>Government Luxury Tax (12%)</td>
              <td style="text-align: right;">${data.currency ?? 'INR'} ${(data.tax ?? 0).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div class="totals">
          <div class="total-row">
            <span class="total-label">STAY TOTAL:</span>
            <span>${data.currency ?? 'INR'} ${(data.totalStayAmount ?? 0).toLocaleString()}</span>
          </div>
          <div class="total-row paid-row">
            <span class="total-label">PAID ALREADY:</span>
            <span>- ${data.currency ?? 'INR'} ${(data.paidAlready ?? 0).toLocaleString()}</span>
          </div>
          <div class="total-row balance-row">
            <span class="total-label">BALANCE DUE:</span>
            <span>${data.currency ?? 'INR'} ${(data.balanceAmount ?? 0).toLocaleString()}</span>
          </div>
        </div>

        <div class="footer">
          <p>Thank you for choosing Zenbourg Grand. We hope you had a pleasant stay.</p>
          <p>This is a computer-generated document and does not require a physical signature.</p>
        </div>
      </body>
    </html>
  `;

  try {
    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

export const generateInvoiceFromBooking = async (booking: any) => {
  // Map raw booking object to InvoiceData format
  const data: InvoiceData = {
    bookingId: String(booking.id || ''),
    guestName: booking.guest?.name || 'Guest User',
    roomNumber: booking.room?.roomNumber || '---',
    checkIn: booking.checkIn,
    checkOut: booking.checkOut,
    nights: Math.ceil((new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (1000 * 3600 * 24)) || 1,
    roomCharge: booking.totalAmount || 0,
    culinaryCharge: 0,
    serviceCharge: 0,
    tax: 0,
    totalStayAmount: booking.totalAmount || 0,
    paidAlready: booking.totalAmount || 0,
    balanceAmount: 0,
    currency: 'INR'
  };

  return generateInvoicePDF(data);
};
