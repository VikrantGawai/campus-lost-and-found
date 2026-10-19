import { getStatusBadgeClass, capitalize } from '../../utils/helpers';

export default function StatusBadge({ status, className = '' }) {
  return (
    <span className={`badge ${getStatusBadgeClass(status)} ${className}`}>
      {capitalize(status)}
    </span>
  );
}
