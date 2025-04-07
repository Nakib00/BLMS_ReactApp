import PropTypes from 'prop-types';
import { STATUS_COLORS } from '../../constants';

export const StatusBadge = ({ status, className = '' }) => {
  const colorClasses = STATUS_COLORS[status] || 'bg-gray-100 text-gray-800';
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClasses} ${className}`}>
      {status}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  className: PropTypes.string
}; 