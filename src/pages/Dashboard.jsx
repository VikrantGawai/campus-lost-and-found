import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNotifications } from '../contexts/NotificationContext';
import {
  Search,
  FilePlus,
  MapPin,
  Briefcase,
  AlertCircle,
  Package,
  GitCompare,
  ArrowUpRight,
  Clock,
  Bell,
} from 'lucide-react';
import ItemCard from '../components/common/ItemCard';
import { formatRelativeTime } from '../utils/helpers';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { lostItems, foundItems, stats, handovers } = useData();
  const { getUserNotifications } = useNotifications();

  const recentItems = [...lostItems, ...foundItems]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const userNotifs = currentUser
    ? getUserNotifications(currentUser.id).slice(0, 5)
    : [];

  const statCards = [
    {
      label: 'Active Lost Reports',
      value: stats.activeLost,
      icon: AlertCircle,
      color: 'text-red-600 bg-red-50',
    },
    {
      label: 'Available Found Items',
      value: stats.activeFound,
      icon: Package,
      color: 'text-green-600 bg-green-50',
    },
    {
      label: 'Possible Matches',
      value: stats.totalMatched,
      icon: GitCompare,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'Pending Handovers',
      value: stats.pendingHandovers,
      icon: Clock,
      color: 'text-amber-600 bg-amber-50',
    },
  ];

  const quickActions = [
    {
      label: 'Report Lost',
      desc: 'Report a lost item',
      icon: FilePlus,
      to: '/report-lost',
      color: 'bg-red-50 text-red-600 hover:bg-red-100',
    },
    {
      label: 'Report Found',
      desc: 'Report a found item',
      icon: MapPin,
      to: '/report-found',
      color: 'bg-green-50 text-green-600 hover:bg-green-100',
    },
    {
      label: 'Browse Items',
      desc: 'Search all reports',
      icon: Search,
      to: '/browse',
      color: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    },
    {
      label: 'My Cases',
      desc: 'Track your reports',
      icon: Briefcase,
      to: '/my-cases',
      color: 'bg-purple-50 text-purple-600 hover:bg-purple-100',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-navy-800">
          Welcome back, {currentUser?.name?.split(' ')[0]}
        </h1>
        <p className="text-gray-500 mt-1">
          Here's what's happening on campus today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => (
          <div key={stat.label} className="card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-navy-800">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-navy-800 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.to)}
              className={`flex items-center gap-3 p-4 rounded-xl transition-colors text-left ${action.color}`}
            >
              <action.icon className="w-6 h-6 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold">{action.label}</p>
                <p className="text-xs opacity-70">{action.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-navy-800">Recently Reported</h2>
            <button
              onClick={() => navigate('/browse')}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-3">
            {recentItems.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 text-sm">
                No items reported yet
              </div>
            ) : (
              recentItems.map((item) => <ItemCard key={item.id} item={item} />)
            )}
          </div>
        </div>

        {/* Recent Notifications */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-navy-800">Recent Notifications</h2>
            <button
              onClick={() => navigate('/notifications')}
              className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
            >
              View all <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="space-y-2">
            {userNotifs.length === 0 ? (
              <div className="card text-center py-8 text-gray-500 text-sm">
                No notifications yet
              </div>
            ) : (
              userNotifs.map((notif) => (
                <div
                  key={notif.id}
                  className={`card py-3 px-4 cursor-pointer hover:shadow-md transition-shadow ${
                    !notif.isRead ? 'border-l-4 border-l-teal-500' : ''
                  }`}
                  onClick={() => navigate('/notifications')}
                >
                  <div className="flex items-start gap-3">
                    <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${notif.isRead ? 'text-gray-400' : 'text-teal-600'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${notif.isRead ? 'text-gray-600' : 'text-navy-800 font-medium'}`}>
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 truncate">{notif.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(notif.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
