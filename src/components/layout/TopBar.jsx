import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { Menu, Bell, RotateCcw } from 'lucide-react';
import { useData } from '../../contexts/DataContext';

const PAGE_TITLES = {
  '/': 'Dashboard',
  '/browse': 'Browse Items',
  '/report-lost': 'Report Lost Item',
  '/report-found': 'Report Found Item',
  '/matching': 'Smart Matching',
  '/my-cases': 'My Cases',
  '/notifications': 'Notifications',
  '/admin': 'Admin Panel',
};

export default function TopBar({ onMenuClick }) {
  const { currentUser, isDemoMode, switchDemoUser, demoUsers } = useAuth();
  const { getUnreadCount } = useNotifications();
  const { resetDemoData } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const unread = currentUser ? getUnreadCount(currentUser.id) : 0;
  const pageTitle = PAGE_TITLES[location.pathname] || 'Campus Lost & Found';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onMenuClick}
            className="p-2 rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 text-navy-700" />
          </button>
          <h2 className="text-lg font-semibold text-navy-800">{pageTitle}</h2>
        </div>

        <div className="flex items-center gap-2">
          {isDemoMode && (
            <>
              <select
                value={currentUser?.id || ''}
                onChange={(e) => switchDemoUser(e.target.value)}
                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white text-navy-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                aria-label="Switch demo user"
              >
                {demoUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <button
                onClick={resetDemoData}
                className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-navy-700"
                title="Reset demo data"
                aria-label="Reset demo data"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg hover:bg-gray-100"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5 text-navy-700" />
            {unread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
