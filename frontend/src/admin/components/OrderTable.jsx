import StatusBadge from './StatusBadge';

const SUBSEQUENT_STATUSES = ['PROCESSING', 'SHIPPED', 'DELIVERED'];

export default function OrderTable({
  orders,
  editable = false,
  onStatusChange,
  onPrint,
  onRefund,
}) {
  return (
    <div className="order-table">
      <div className="table-head order-table-head">
        <span>Order</span>
        <span>Customer</span>
        <span>Amount</span>
        <span>Status</span>
        <span>Receipt</span>
        <span>Actions</span>
      </div>
      {orders.map((order) => {
        const currentStatus = String(order.orderStatus || order.status || '').toUpperCase();
        return (
          <div className="table-row order-table-row" key={order.id}>
            <span>
              <b>#{order.id}</b>
              <small>{order.date || order.createdAt}</small>
            </span>
            <span>
              <b>{order.name || order.fullName || 'Customer'}</b>
              <small>{order.product || (Array.isArray(order.items) ? order.items.map((i) => i.productName).join(', ') : '')}</small>
            </span>
            <strong>₹{Number(order.totalAmount || order.amount || 0).toLocaleString('en-IN')}</strong>
            <span>
              <StatusBadge status={order.orderStatus || order.status} />
            </span>
            <span className="receipt-col">
              {onPrint && (
                <button
                  type="button"
                  className="admin-print-btn"
                  onClick={() => onPrint(order)}
                >
                  Print
                </button>
              )}
            </span>
            <span className="row-actions">
              {onStatusChange || editable ? (
                <select
                  className="admin-status-select"
                  value={SUBSEQUENT_STATUSES.includes(currentStatus) ? currentStatus : ''}
                  onChange={(event) => (onStatusChange ? onStatusChange(order.id, event.target.value) : null)}
                  aria-label={`Update status for order ${order.id}`}
                >
                  <option value="" disabled>
                    {currentStatus === 'CONFIRMED' ? 'Update Status' : 'Change Status'}
                  </option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                </select>
              ) : onRefund && !['CANCELLED', 'DELIVERED'].includes(currentStatus) ? (
                <button onClick={() => onRefund(order.id)}>Cancel</button>
              ) : null}
            </span>
          </div>
        );
      })}
    </div>
  );
}
