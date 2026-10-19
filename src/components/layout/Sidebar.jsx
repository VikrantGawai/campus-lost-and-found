import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Home,
  Search,
  FilePlus,
  FolderSearch,
  GitCompare,
  Briefcase,
  Bell,
  Shield,
  X,
  MapPin,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: Home, label: 'Dashboard' },
  { to: '/browse', icon: Search, label: 'Browse Items' },
  { to: '/report-lost', icon: FilePlus, label: 'Report Lost' },
  { to: '/report-found', icon: MapPin, label: 'Report Found' },
  { to: '/matching', icon: GitCompare, label: 'Smart Matching' },
  { to: '/my-cases', icon: Briefcase, label: 'My Cases' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
];

export default function Sidebar({ onClose }) {
  const { isAdmin, currentUser } = useAuth();
  const { getUnreadCount } = useNotifications();
  const unread = currentUser ? getUnreadCount(currentUser.id) : 0;

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
      isActive
        ? 'bg-teal-50 text-teal-700 border-r-2 border-teal-600'
        : 'text-navy-600 hover:bg-gray-100 hover:text-navy-800'
    }`;

  return (
    <div className="flex flex-col h-full bg-white border-r border-gray-200">
      <div className="flex items-center justify-between p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center">
            <FolderSearch className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base font-bold text-navy-800">Campus L&F</h1>
            <p className="text-xs text-gray-500">Lost & Found</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        )}
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} className={linkClass} onClick={onClose}>
            <Icon className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1">{label}</span>
            {label === 'Notifications' && unread > 0 && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {unread}
              </span>
            )}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <div className="border-t border-gray-100 my-3" />
            <NavLink to="/admin" className={linkClass} onClick={onClose}>
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span>Admin Panel</span>
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-navy-100 rounded-full flex items-center justify-center">
            <span className="text-sm font-semibold text-navy-600">
              {currentUser?.name?.charAt(0) || '?'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-800 truncate">{currentUser?.name}</p>
            <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
