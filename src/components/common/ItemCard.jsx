import { useNavigate } from 'react-router-dom';
import { MapPin, Calendar, Tag } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatDate, truncate } from '../../utils/helpers';

export default function ItemCard({ item }) {
  const navigate = useNavigate();
  const isLost = item.type === 'lost';
  const locations = item.locations || (item.location ? [item.location] : []);
  const date = item.dateLost || item.dateFound || item.createdAt;

  return (
    <button
      onClick={() => navigate(`/item/${item.id}`)}
      className="card hover:shadow-md transition-shadow text-left w-full group"
    >
      <div className="flex items-start gap-4">
        {/* Thumbnail placeholder */}
        <div className={`w-16 h-16 rounded-lg flex-shrink-0 flex items-center justify-center text-lg font-bold ${
          isLost ? 'bg-red-50 text-red-400' : 'bg-green-50 text-green-400'
        }`}>
          {item.photoUrl ? (
            <img
              src={item.photoUrl}
              alt={item.title}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            isLost ? '?' : '!'
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`badge text-[10px] ${isLost ? 'badge-lost' : 'badge-found'}`}>
              {isLost ? 'LOST' : 'FOUND'}
            </span>
            <StatusBadge status={item.status} />
          </div>
          <h3 className="text-sm font-semibold text-navy-800 group-hover:text-teal-700 truncate">
            {item.title}
          </h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {truncate(item.description, 120)}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> {item.category}
            </span>
            {locations.length > 0 && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {locations[0]}{locations.length > 1 ? ` +${locations.length - 1}` : ''}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(date)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
