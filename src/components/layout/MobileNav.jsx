import { NavLink } from 'react-router-dom';
import { Home, Search, FilePlus, Briefcase, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';

const mobileNavItems = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/browse', icon: Search, label: 'Browse' },
  { to: '/report-lost', icon: FilePlus, label: 'Report' },
  { to: '/my-cases', icon: Briefcase, label: 'Cases' },
  { to: '/notifications', icon: Bell, label: 'Alerts' },
];

export default function MobileNav() {
  const { currentUser } = useAuth();
  const { getUnreadCount } = useNotifications();
  const unread = currentUser ? getUnreadCount(currentUser.id) : 0;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 lg:hidden">
      <div className="flex items-center justify-around h-16 px-2">
        {mobileNavItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive ? 'text-teal-600' : 'text-gray-500 hover:text-navy-700'
              }`
            }
          >
            <div className="relative">
              <Icon className="w-5 h-5" />
              {label === 'Alerts' && unread > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
