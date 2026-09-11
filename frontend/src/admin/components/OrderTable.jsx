import StatusBadge from './StatusBadge';
import { orderStatuses } from '../constants/navigation';

export default function OrderTable({
  orders,
  editable = false,
  onStatusChange,
  onPrint,
  onRefund,
}) {
  return (
    <div className="order-table">
      <div className="table-head">
        <span>Order</span>
        <span>Customer</span>
        <span>Amount</span>
        <span>Status</span>
        <span>Actions</span>
      </div>
      {orders.map((order) => (
        <div className="table-row" key={order.id}>
          <span>
            <b>{order.id}</b>
            <small>{order.date}</small>
          </span>
          <span>
            {order.name}
            <small>{order.product}</small>
          </span>
          <strong>₹{order.amount.toLocaleString('en-IN')}</strong>
          <span>
            {editable ? (
              <select
                value={order.status}
                onChange={(event) => onStatusChange(order.id, event.target.value)}
              >
                {orderStatuses.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            ) : (
              <StatusBadge status={order.status} />
            )}
          </span>
          <span className="row-actions">
            {onPrint && <button onClick={() => onPrint(order)}>Print</button>}
            {onRefund && !['Cancelled', 'Delivered'].includes(order.status) && (
              <button onClick={() => onRefund(order.id)}>Cancel</button>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}
