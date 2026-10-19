import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, SlidersHorizontal, AlertCircle, X } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import ItemCard from '../components/common/ItemCard';
import EmptyState from '../components/common/EmptyState';
import { ITEM_CATEGORIES, CAMPUS_LOCATIONS, ITEM_STATUSES } from '../config/constants';

export default function BrowseItems() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { lostItems, foundItems } = useData();

  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all');
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get('category') || 'all');
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || 'all');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [dateFilter, setDateFilter] = useState('all');

  const allItems = useMemo(() => {
    return [...lostItems, ...foundItems].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );
  }, [lostItems, foundItems]);

  const filteredItems = useMemo(() => {
    return allItems.filter((item) => {
      // Type filter
      if (typeFilter !== 'all' && item.type !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;

      // Location filter
      if (locationFilter !== 'all') {
        const locs = item.locations || (item.location ? [item.location] : []);
        if (!locs.includes(locationFilter)) return false;
      }

      // Status filter
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;

      // Date filter
      if (dateFilter !== 'all') {
        const itemDate = new Date(item.dateLost || item.dateFound || item.createdAt);
        const now = new Date();
        const diffDays = (now - itemDate) / (1000 * 60 * 60 * 24);

        if (dateFilter === 'today' && diffDays > 1) return false;
        if (dateFilter === 'week' && diffDays > 7) return false;
        if (dateFilter === 'month' && diffDays > 30) return false;
      }

      // Keyword search (public fields only: title, description, category, locations)
      if (keyword.trim()) {
        const query = keyword.toLowerCase().trim();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const descMatch = item.description?.toLowerCase().includes(query);
        const catMatch = item.category?.toLowerCase().includes(query);
        const locs = item.locations || (item.location ? [item.location] : []);
        const locMatch = locs.some((l) => l.toLowerCase().includes(query));

        if (!titleMatch && !descMatch && !catMatch && !locMatch) {
          return false;
        }
      }

      return true;
    });
  }, [allItems, keyword, typeFilter, categoryFilter, locationFilter, statusFilter, dateFilter]);

  const clearFilters = () => {
    setKeyword('');
    setTypeFilter('all');
    setCategoryFilter('all');
    setLocationFilter('all');
    setStatusFilter('all');
    setDateFilter('all');
    setSearchParams({});
  };

  const hasActiveFilters =
    keyword ||
    typeFilter !== 'all' ||
    categoryFilter !== 'all' ||
    locationFilter !== 'all' ||
    statusFilter !== 'all' ||
    dateFilter !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-800">Browse Campus Items</h1>
        <p className="text-gray-500 mt-1">
          Explore lost reports and found items posted by campus students and staff.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="card space-y-4">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Search by keywords, title, location, or description..."
            className="input-field pl-11"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-navy-700"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter controls */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* Item Type */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input-field text-sm py-2"
            >
              <option value="all">All Types</option>
              <option value="lost">Lost Only</option>
              <option value="found">Found Only</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="input-field text-sm py-2"
            >
              <option value="all">All Categories</option>
              {ITEM_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Campus Location */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">Location</label>
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="input-field text-sm py-2"
            >
              <option value="all">All Locations</option>
              {CAMPUS_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="input-field text-sm py-2"
            >
              <option value="all">All Statuses</option>
              <option value={ITEM_STATUSES.ACTIVE}>Active</option>
              <option value={ITEM_STATUSES.MATCHED}>Matched</option>
              <option value={ITEM_STATUSES.CLAIMED}>Claimed</option>
              <option value={ITEM_STATUSES.RETURNED}>Returned</option>
              <option value={ITEM_STATUSES.CLOSED}>Closed</option>
            </select>
          </div>

          {/* Date proximity */}
          <div>
            <label className="block text-xs font-medium text-navy-700 mb-1">Date Reported</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="input-field text-sm py-2"
            >
              <option value="all">Anytime</option>
              <option value="today">Past 24 Hours</option>
              <option value="week">Past 7 Days</option>
              <option value="month">Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* Active filters bar and reset */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500">
            <span>Showing {filteredItems.length} of {allItems.length} total items</span>
            <button
              onClick={clearFilters}
              className="text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Listing Grid */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={AlertCircle}
          title="No items found"
          message="Try adjusting your keyword or loosening the filters to find what you are looking for."
          action={
            hasActiveFilters && (
              <button onClick={clearFilters} className="btn-secondary btn-sm mt-3">
                Reset Filters
              </button>
            )
          }
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
          {filteredItems.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
