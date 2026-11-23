import React, { useState } from 'react';
import { usePortal } from '../../context/PortalContext';
import { NotificationItem, PageId } from '../../types';
import {
  Bell,
  CheckCheck,
  Filter,
  FileSpreadsheet,
  FileCheck2,
  FolderArchive,
  GraduationCap,
  Info,
  ChevronRight
} from 'lucide-react';

export const NotificationsView: React.FC = () => {
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    setCurrentPage,
    currentUser
  } = usePortal();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showUnreadOnly, setShowUnreadOnly] = useState<boolean>(false);

  const filtered = notifications.filter(n => {
    if (showUnreadOnly && n.read) return false;
    if (filterCategory !== 'all' && n.category !== filterCategory) return false;
    return true;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Assignment':
        return <FileSpreadsheet className="w-4 h-4 text-[#B83232]" />;
      case 'Examination':
        return <FileCheck2 className="w-4 h-4 text-[#795548]" />;
      case 'Material':
        return <FolderArchive className="w-4 h-4 text-[#F2C94C]" />;
      case 'Academic':
        return <GraduationCap className="w-4 h-4 text-[#B83232]" />;
      default:
        return <Info className="w-4 h-4 text-[#795548]" />;
    }
  };

  const handleAction = (notif: NotificationItem) => {
    markNotificationRead(notif.id);
    if (notif.actionPage) {
      setCurrentPage(notif.actionPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C] flex items-center gap-1.5">
              <Bell className="w-4 h-4" /> Academic Communications
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#292929] dark:text-[#F7F5F2] tracking-tight">
            Notifications & Advisor Updates
          </h1>
          <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] mt-0.5">
            Student: <span className="font-bold text-[#292929] dark:text-white">{currentUser?.name || 'Devanath N'}</span> (Roll: <span className="font-mono text-[#B83232] dark:text-[#F2C94C]">{currentUser?.rollNumber || 'P26CA125'}</span>) · Faculty Advisor: <span className="font-bold text-[#795548] dark:text-[#F2C94C]">HCASICAN</span>
          </p>
        </div>

        <button
          onClick={markAllNotificationsRead}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#795548] dark:text-[#F2C94C] border border-[#E5DFD9] dark:border-[#3D3835] hover:bg-[#EFEBE9] transition-colors"
        >
          <CheckCheck className="w-4 h-4 text-[#B83232]" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#292929] p-3 rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835]">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'Assignment', 'Material', 'Examination', 'Academic', 'System'] as const).map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all whitespace-nowrap ${
                filterCategory === cat
                  ? 'bg-[#B83232] text-white shadow-xs'
                  : 'text-[#6E6863] dark:text-[#BDB7B2] hover:text-[#292929] dark:hover:text-[#F7F5F2]'
              }`}
            >
              {cat === 'all' ? 'All Alerts' : cat}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs font-semibold text-[#292929] dark:text-[#F7F5F2] cursor-pointer">
          <input
            type="checkbox"
            checked={showUnreadOnly}
            onChange={e => setShowUnreadOnly(e.target.checked)}
            className="rounded text-[#B83232] focus:ring-[#B83232]"
          />
          <span>Unread Only</span>
        </label>
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-[#292929] rounded-2xl border border-[#E5DFD9] dark:border-[#3D3835]">
            <Bell className="w-8 h-8 text-[#B83232] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-[#292929] dark:text-[#F7F5F2]">No notifications found</p>
            <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] mt-1">All academic alerts are up to date.</p>
          </div>
        ) : (
          filtered.map(item => (
            <div
              key={item.id}
              onClick={() => handleAction(item)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                !item.read
                  ? 'bg-white dark:bg-[#292929] border-[#B83232]/40 shadow-xs ring-1 ring-[#B83232]/10'
                  : 'bg-white/60 dark:bg-[#292929]/60 border-[#E5DFD9] dark:border-[#3D3835] hover:border-[#795548]/50'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  !item.read
                    ? 'bg-[#B83232]/10 border-[#B83232]/30'
                    : 'bg-[#F7F5F2] dark:bg-[#1E1E1E] border-[#E5DFD9] dark:border-[#3D3835]'
                }`}>
                  {getCategoryIcon(item.category)}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-sm font-bold ${
                      !item.read
                        ? 'text-[#292929] dark:text-[#F7F5F2]'
                        : 'text-[#6E6863] dark:text-[#BDB7B2]'
                    } group-hover:text-[#B83232] transition-colors`}>
                      {item.title}
                    </h3>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-[#B83232]" aria-label="Unread notification" />
                    )}
                  </div>
                  <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                    {item.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5 dark:border-white/5">
                <span className="text-[11px] font-mono text-[#795548] dark:text-[#F2C94C]">
                  {item.timestamp}
                </span>
                {item.actionPage && (
                  <button className="flex items-center gap-1 text-xs font-bold text-[#B83232] dark:text-[#F2C94C] group-hover:translate-x-1 transition-transform">
                    <span>Open</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
