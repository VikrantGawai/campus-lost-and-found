import { Check, Bell, BellOff, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationContext';
import EmptyState from '../components/common/EmptyState';
import { formatRelativeTime } from '../utils/helpers';

export default function Notifications() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { getUserNotifications, markAsRead, markAllAsRead } = useNotifications();

  const userNotifications = currentUser ? getUserNotifications(currentUser.id) : [];
  const unreadCount = userNotifications.filter((n) => !n.isRead).length;

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    if (notif.relatedItemId) {
      navigate(`/item/${notif.relatedItemId}`);
    } else {
      navigate('/my-cases');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-800">Notifications</h1>
          <p className="text-gray-500 text-sm mt-1">
            Real-time campus alerts for matching suggestions, claim decisions, and handovers.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={() => markAllAsRead(currentUser.id)}
            className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1.5 p-2 rounded-lg hover:bg-teal-50"
          >
            <Check className="w-4 h-4" /> Mark all as read
          </button>
        )}
      </div>

      {/* Notifications list */}
      {userNotifications.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title="No Notifications"
          message="You're all caught up! When there are match updates, claims, or handovers on your items, you will see them here."
        />
      ) : (
        <div className="space-y-2.5">
          {userNotifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`card p-4 flex items-start gap-4 cursor-pointer hover:shadow-md transition-all ${
                !n.isRead ? 'border-l-4 border-l-teal-600 bg-white' : 'bg-gray-50/70 border border-gray-100'
              }`}
            >
              <div className={`p-2 rounded-full flex-shrink-0 ${
                !n.isRead ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-400'
              }`}>
                <Bell className="w-4 h-4" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className={`text-sm ${!n.isRead ? 'font-bold text-navy-900' : 'font-medium text-gray-700'}`}>
                    {n.title}
                  </h4>
                  <span className="text-[11px] text-gray-400 whitespace-nowrap">
                    {formatRelativeTime(n.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
              </div>

              <ArrowRight className="w-4 h-4 text-gray-300 self-center flex-shrink-0" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
