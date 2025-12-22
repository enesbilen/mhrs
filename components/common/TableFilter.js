'use client';

import { useState } from 'react';

/**
 * Reusable table filter component
 *
 * @param {Object} props
 * @param {string} props.searchPlaceholder - Placeholder text for search input
 * @param {function} props.onSearchChange - Callback for search changes
 * @param {Array} props.filters - Array of filter configurations
 *   Example: [
 *     {
 *       id: 'role',
 *       label: 'Rol',
 *       options: [
 *         { value: 'all', label: 'Tümü' },
 *         { value: 'admin', label: 'Admin' },
 *         { value: 'user', label: 'Kullanıcı' }
 *       ],
 *       onChange: (value) => {}
 *     }
 *   ]
 * @param {function} props.onClearFilters - Callback to clear all filters
 * @param {number} props.totalCount - Total number of items
 * @param {number} props.filteredCount - Number of filtered items
 */
export default function TableFilter({
  searchPlaceholder = 'Ara...',
  onSearchChange,
  filters = [],
  onClearFilters,
  totalCount,
  filteredCount,
}) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    if (onClearFilters) {
      onClearFilters();
    }
  };

  const hasActiveFilters = searchTerm || filters.some(f => f.value && f.value !== 'all');

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-3">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-3 md:space-y-0">
        {/* Left: Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Right: Filters */}
        <div className="flex items-center space-x-4">
          {filters.map((filter) => (
            <div key={filter.id} className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                {filter.label}:
              </label>
              <select
                value={filter.value || 'all'}
                onChange={(e) => filter.onChange && filter.onChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {filter.options.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Clear Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Temizle
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      {totalCount !== undefined && filteredCount !== undefined && (
        <div className="mt-2 text-sm text-gray-600">
          {filteredCount === totalCount ? (
            <span>Toplam {totalCount} kayıt</span>
          ) : (
            <span>
              {totalCount} kayıttan {filteredCount} tanesi gösteriliyor
            </span>
          )}
        </div>
      )}
    </div>
  );
}
