import somneraLogo from '../assets/images/somnera-logo.jpeg';

const getAbsoluteLogoUrl = () => {
  if (typeof window === 'undefined') return somneraLogo || '';
  if (!somneraLogo) return '';
  if (
    somneraLogo.startsWith('http://') ||
    somneraLogo.startsWith('https://') ||
    somneraLogo.startsWith('data:')
  ) {
    return somneraLogo;
  }
  const origin = window.location.origin.replace(/\/+$/, '');
  const path = somneraLogo.startsWith('/') ? somneraLogo : `/${somneraLogo}`;
  return `${origin}${path}`;
};

export const formatMoney = (amount) => {
  return Number(amount || 0).toLocaleString('en-IN', {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
};

export const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const labelStatus = (status = '') => {
  return String(status)
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const generateReceiptHtml = (order) => {
  let shipping = order.shippingAddress;
  if (typeof shipping === 'string') {
    try {
      shipping = JSON.parse(shipping);
    } catch (_) {
      shipping = {};
    }
  } else if (!shipping || typeof shipping !== 'object') {
    shipping = {};
  }

  let billing = order.billingAddress;
  if (typeof billing === 'string') {
    try {
      billing = JSON.parse(billing);
    } catch (_) {
      billing = {};
    }
  } else if (!billing || typeof billing !== 'object') {
    billing = {};
  }

  // NOTE: Strictly reference the static address snapshot captured on the Order record.
  // Do NOT dynamically bind to the user's mutable profile or client localStorage auth entity.
  const shippingFullName =
    shipping.fullName ||
    [shipping.firstName, shipping.lastName].filter(Boolean).join(' ').trim();

  const customerName =
    shippingFullName ||
    (order.fullName && order.fullName !== 'Customer' ? order.fullName : '') ||
    order.name ||
    'Customer';

  const customerEmail =
    shipping.email ||
    order.email ||
    '';

  const customerMobile =
    shipping.mobile ||
    shipping.phone ||
    order.mobile ||
    order.phone ||
    '';

  const customerState =
    shipping.state ||
    order.state ||
    billing.state ||
    '';

  const customerCity =
    shipping.city ||
    order.city ||
    billing.city ||
    '';

  const customerPin =
    shipping.pincode ||
    shipping.postalCode ||
    shipping.pin ||
    order.pincode ||
    '';

  const streetPart =
    shipping.fullAddress ||
    shipping.address ||
    shipping.street ||
    order.fullAddress ||
    order.address ||
    '';

  let fullAddress = streetPart;
  if (fullAddress) {
    if (customerCity && !fullAddress.toLowerCase().includes(customerCity.toLowerCase())) {
      fullAddress += `, ${customerCity}`;
    }
    if (customerState && !fullAddress.toLowerCase().includes(customerState.toLowerCase())) {
      fullAddress += `, ${customerState}`;
    }
    if (customerPin && !fullAddress.includes(customerPin)) {
      fullAddress += ` - ${customerPin}`;
    }
  } else if (customerCity || customerState || customerPin) {
    fullAddress = [customerCity, customerState, customerPin].filter(Boolean).join(', ');
  }

  // Extract GST Number safely (only present if entered)
  const rawGst =
    order.gstNumber ||
    shipping.gstNumber ||
    billing.gstNumber ||
    '';
  const gstNumber = typeof rawGst === 'string' ? rawGst.trim().toUpperCase() : '';

  const items = Array.isArray(order.items) ? order.items : [];
  const itemsRows = items
    .map((item, idx) => {
      const details = [];
      if (item.size) details.push(`Size: ${item.size}`);
      if (item.thickness) details.push(`${item.thickness}" Thickness`);
      if (item.productType === 'PILLOW') {
        details.push(Number(item.packSize) === 2 ? 'Pack of 2' : 'Pack of 1');
      }
      const detailsStr =
        details.length > 0
          ? `<div style="color:#6b7280;font-size:11px;margin-top:3px;">${details.join(' · ')}</div>`
          : '';

      return `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;width:35px;color:#6b7280;text-align:center;">${idx + 1}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;">
            <strong style="color:#111827;font-size:13px;">${item.productName || 'Product'}</strong>
            ${detailsStr}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:center;width:60px;">${item.quantity || 1}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;width:110px;">₹${formatMoney(item.unitPrice || 0)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;text-align:right;width:110px;font-weight:700;">₹${formatMoney(item.itemTotal || 0)}</td>
        </tr>
      `;
    })
    .join('');

  const orderDisplayId = String(order.id || order.orderId || '').replace(/^#/, '');
  const watermarkUrl = getAbsoluteLogoUrl();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="${typeof window !== 'undefined' ? window.location.origin : ''}/" />
  <title>Receipt - Order #${orderDisplayId}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1f2937;
      background: #f8fafc;
      padding: 32px 16px;
      font-size: 13px;
      line-height: 1.5;
    }
    .receipt-container {
      position: relative;
      max-width: 820px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 36px 40px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      overflow: hidden;
    }
    .receipt-watermark-wrap {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 580px;
      max-width: 85%;
      pointer-events: none;
      user-select: none;
      z-index: 0;
      opacity: 0.09;
      display: flex;
      justify-content: center;
      align-items: center;
      mix-blend-mode: multiply;
    }
    .receipt-watermark-img {
      width: 100%;
      height: auto;
      display: block;
      filter: invert(1);
    }
    .top-actions, .header, .details-grid, table, .totals-area, .footer {
      position: relative;
      z-index: 1;
    }
    .top-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-bottom: 20px;
    }
    .btn-action {
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #334155;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-action.btn-primary {
      background: #241132;
      color: #fff;
      border-color: #241132;
    }
    .btn-action:hover {
      opacity: 0.9;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #8b6636;
      padding-bottom: 20px;
      margin-bottom: 24px;
      gap: 20px;
    }
    .brand-wrap {
      display: flex;
      align-items: center;
    }
    .brand-text h1 {
      font-size: 24px;
      font-weight: 800;
      color: #241132;
      letter-spacing: -0.5px;
      margin: 0;
    }
    .brand-text h1 span { color: #8b6636; }
    .brand-sub {
      color: #64748b;
      font-size: 12px;
      margin-top: 2px;
    }
    .receipt-title {
      text-align: right;
    }
    .receipt-title h2 {
      font-size: 18px;
      font-weight: 800;
      color: #8b6636;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }
    .receipt-meta {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .details-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 24px;
    }
    .section-box {
      background: transparent;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #8b6636;
      margin-bottom: 8px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 4px;
    }
    .section-box p {
      margin: 3px 0;
      font-size: 12.5px;
      color: #334155;
    }
    .gst-tag {
      display: inline-block;
      background: #f1f5f9;
      color: #0f172a;
      font-weight: 700;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #cbd5e1;
      letter-spacing: 0.03em;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      background: #e0e7ff;
      color: #3730a3;
    }
    .status-badge.status-paid {
      background: #dcfce7;
      color: #166534;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    thead th {
      background: transparent;
      border-bottom: 1px solid #e2e8f0;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.06em;
      padding: 10px 12px;
      text-align: left;
    }
    .totals-area {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 24px;
    }
    .totals-box {
      width: 300px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 13px;
      color: #475569;
    }
    .totals-row.grand-total {
      border-top: 2px solid #241132;
      color: #241132;
      font-size: 16px;
      font-weight: 800;
      padding-top: 8px;
      margin-top: 6px;
    }
    .footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 11.5px;
    }
    @media print {
      body {
        background: #fff;
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
      .receipt-container {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .section-box {
        background: transparent !important;
      }
      thead th {
        background: transparent !important;
        border-bottom: 1px solid #e2e8f0 !important;
        color: #64748b !important;
      }
      .receipt-watermark-wrap {
        opacity: 0.09;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .receipt-watermark-img {
        filter: invert(1);
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      @page {
        margin: 1.2cm;
      }
    }
  </style>
</head>
<body>
  <div class="receipt-container">
    <div class="receipt-watermark-wrap" aria-hidden="true">
      <img src="${watermarkUrl}" alt="Somnera Watermark" class="receipt-watermark-img" />
    </div>

    <div class="top-actions no-print">
      <button type="button" class="btn-action btn-primary" onclick="window.print()">
        🖨 Print / Save PDF
      </button>
      <button type="button" class="btn-action" onclick="window.close()">
        ✕ Close
      </button>
    </div>

    <div class="header">
      <div class="brand-wrap">
        <div class="brand-text">
          <h1>SOMNERA <span>MATTRESS</span></h1>
          <div class="brand-sub">Premium Ergonomic Sleep Solutions</div>
        </div>
      </div>
      <div class="receipt-title">
        <h2>Order Receipt</h2>
        <div class="receipt-meta"><strong>Order ID:</strong> #${orderDisplayId}</div>
        <div class="receipt-meta"><strong>Date:</strong> ${formatDate(order.createdAt)}</div>
        <div class="receipt-meta"><strong>GST NO - </strong>27AWHPA7518A1ZY</div>
      </div>
    </div>

    <div class="details-grid">
      <div class="section-box">
        <div class="section-title">Customer & Shipping Information</div>
        <p><strong>Name:</strong> ${customerName}</p>
        ${customerEmail ? `<p><strong>Email:</strong> ${customerEmail}</p>` : ''}
        ${customerMobile ? `<p><strong>Phone:</strong> ${customerMobile}</p>` : ''}
        ${fullAddress ? `<p><strong>Full Address:</strong><br>${fullAddress}</p>` : ''}
        ${customerState ? `<p><strong>State:</strong> ${customerState}</p>` : ''}
        ${gstNumber ? `<p style="margin-top:6px;"><strong>GST Number:</strong> <span class="gst-tag">${gstNumber}</span></p>` : ''}
      </div>

      <div class="section-box">
        <div class="section-title">Order & Payment Overview</div>
        <p><strong>Order Status:</strong> <span class="status-badge">${labelStatus(order.orderStatus)}</span></p>
        <p><strong>Payment Status:</strong> <span class="status-badge ${order.paymentStatus === 'PAID' ? 'status-paid' : ''}">${labelStatus(order.paymentStatus)}</span></p>
        <p><strong>Payment Method:</strong> ${order.paymentMethod || 'Online (Razorpay)'}</p>
        ${order.razorpayPaymentId ? `<p><strong>Payment ID:</strong> ${order.razorpayPaymentId}</p>` : ''}
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th style="width:35px;text-align:center;">#</th>
          <th>Product Description</th>
          <th style="text-align:center;width:60px;">Qty</th>
          <th style="text-align:right;width:110px;">Unit Price</th>
          <th style="text-align:right;width:110px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows || '<tr><td colspan="5" style="text-align:center;padding:16px;">No items in order</td></tr>'}
      </tbody>
    </table>

    <div class="totals-area">
      <div class="totals-box">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>₹${formatMoney(order.subtotal || order.totalAmount)}</span>
        </div>
        ${order.discountAmount ? `
          <div class="totals-row" style="color:#16a34a;">
            <span>Discount (${order.couponCode || 'Coupon'}):</span>
            <span>-₹${formatMoney(order.discountAmount)}</span>
          </div>
        ` : ''}
        <div class="totals-row grand-total">
          <span>Total Amount:</span>
          <span>₹${formatMoney(order.totalAmount)}</span>
        </div>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing Somnera Mattress. For questions or support, please contact support@somnera.in.</p>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 300);
    };
  </script>
</body>
</html>`;
};

export const printOrderReceipt = (order) => {
  const invoice = window.open('', '_blank');
  if (!invoice) {
    alert('Popup was blocked by your browser. Please allow popups for this site to view and print order receipts.');
    return;
  }
  const content = generateReceiptHtml(order);
  invoice.document.open();
  invoice.document.write(content);
  invoice.document.close();
  invoice.focus();
};
