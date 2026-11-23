import React, { useState } from 'react';
import {
  Megaphone,
  Calendar,
  FileText,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  CheckCircle2,
  Shield
} from 'lucide-react';
import { usePortal } from '../../context/PortalContext';
import { NoticeCategory, NoticePriority } from '../../types';

interface ImportantNoticesSectionProps {
  allowManagement?: boolean;
}

export const ImportantNoticesSection: React.FC<ImportantNoticesSectionProps> = ({
  allowManagement = false
}) => {
  const {
    currentUser,
    allNotices,
    activePublishedNotices,
    createNotice,
    toggleNoticePublish,
    deleteNotice,
    markNoticeReadByStudent
  } = usePortal();

  const [showManager, setShowManager] = useState<boolean>(false);
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [category, setCategory] = useState<NoticeCategory>('Academic Notice');
  const [priority, setPriority] = useState<NoticePriority>('Normal');
  const [publicationDate, setPublicationDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [expiryDate, setExpiryDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0]
  );
  const [attachmentName, setAttachmentName] = useState<string>('');
  const [isPublished, setIsPublished] = useState<boolean>(true);
  const [noticeError, setNoticeError] = useState<string>('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setNoticeError('');
    if (title.trim().length < 3 || description.trim().length < 5) {
      setNoticeError('Notice title (3+ chars) and description (5+ chars) are required.');
      return;
    }
    if (expiryDate && publicationDate && expiryDate < publicationDate) {
      setNoticeError('Expiry date must be on or after the publication date.');
      return;
    }
    const trimmedAttachment = attachmentName.trim();
    if (trimmedAttachment && !trimmedAttachment.toLowerCase().endsWith('.pdf')) {
      setNoticeError('Optional attachment name must reference a .pdf file.');
      return;
    }
    createNotice({
      title: title.trim(),
      description: description.trim(),
      category,
      priority,
      publicationDate,
      expiryDate,
      isPublished,
      attachmentName: trimmedAttachment || undefined,
      createdBy: `Faculty Advisor (${currentUser?.advisorName || 'HCASICAN'})`
    });
    setTitle('');
    setDescription('');
    setAttachmentName('');
  };

  const priorityBadgeClass = (p: NoticePriority) => {
    switch (p) {
      case 'Urgent':
        return 'bg-[#B83232] text-white';
      case 'Important':
        return 'bg-[#F2C94C] text-[#292929]';
      default:
        return 'bg-[#795548] text-white';
    }
  };

  return (
    <div>
      <div className="public-section-heading public-section-heading--split">
        <div>
          <span className="public-kicker">Official Announcements</span>
          <h2 className="public-title flex items-center gap-2.5">
            <Megaphone className="w-6 h-6 text-[#B83232] dark:text-[#F2C94C] shrink-0" />
            <span>Important Notices</span>
          </h2>
          <p className="public-subtitle">
            Active academic circulars, examination timetables, and departmental updates overseen by Faculty Advisor HCASICAN.
          </p>
        </div>

        {allowManagement ? (
          <button
            type="button"
            onClick={() => setShowManager(prev => !prev)}
            className="public-btn px-4 py-2 bg-[#292929] text-[#F2C94C] border border-[#795548]/50 text-xs self-start sm:self-auto whitespace-nowrap shrink-0"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{showManager ? 'Close Notice Manager' : 'Manage Notices'}</span>
          </button>
        ) : (
          <span className="text-xs font-semibold text-[#795548] dark:text-[#BDB7B2] whitespace-nowrap">
            Faculty Advisor: <strong className="text-[#292929] dark:text-[#F2C94C]">HCASICAN</strong>
          </span>
        )}
      </div>

      {/* Authorized Faculty / Admin Notice Management Panel */}
      {allowManagement && showManager && (
        <div className="p-6 rounded-2xl bg-[#292929] text-white border border-[#795548]/50 space-y-5">
          <form onSubmit={handleCreate} className="space-y-3">
            <h3 className="text-sm font-bold text-[#F2C94C] flex items-center gap-1.5">
              <Plus className="w-4 h-4" />
              Create &amp; Publish Notice
            </h3>

            {noticeError && (
              <div role="alert" className="p-2.5 rounded-lg bg-[#B83232]/20 border border-[#B83232] text-rose-200 text-xs font-semibold">
                {noticeError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Notice title"
                className="sm:col-span-2 px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15 text-white"
                required
              />
              <select
                value={category}
                onChange={e => setCategory(e.target.value as NoticeCategory)}
                className="px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15 text-white"
              >
                <option value="Academic Notice">Academic Notice</option>
                <option value="Examination Notice">Examination Notice</option>
                <option value="Assignment Notice">Assignment Notice</option>
                <option value="General Announcement">General Announcement</option>
                <option value="Important Deadline">Important Deadline</option>
              </select>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as NoticePriority)}
                className="px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15 text-white"
              >
                <option value="Normal">Priority: Normal</option>
                <option value="Important">Priority: Important</option>
                <option value="Urgent">Priority: Urgent</option>
              </select>
            </div>

            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Notice description..."
              className="w-full px-3 py-2 rounded-lg text-xs bg-[#1E1E1E] border border-white/15 text-white"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[10px] text-stone-400 mb-1">Publication Date</label>
                <input
                  type="date"
                  value={publicationDate}
                  onChange={e => setPublicationDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#1E1E1E] border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 mb-1">Expiry Date</label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#1E1E1E] border border-white/15 text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] text-stone-400 mb-1">Optional PDF Attachment Name</label>
                <input
                  type="text"
                  value={attachmentName}
                  onChange={e => setAttachmentName(e.target.value)}
                  placeholder="e.g., Sem1_Schedule.pdf"
                  className="w-full px-3 py-1.5 rounded-lg text-xs bg-[#1E1E1E] border border-white/15 text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-stone-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={e => setIsPublished(e.target.checked)}
                  className="rounded border-[#795548] text-[#B83232]"
                />
                <span>Publish immediately</span>
              </label>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-[#B83232] hover:bg-[#9E2A2A] text-white text-xs font-bold"
              >
                Save Notice
              </button>
            </div>
          </form>

          {allNotices.length > 0 && (
            <div className="pt-4 border-t border-white/10 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                All Notices ({allNotices.length})
              </h4>
              {allNotices.map(n => (
                <div
                  key={n.id}
                  className="p-3 rounded-xl bg-black/30 border border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <span className="font-bold text-white">{n.title}</span>
                    <span className="text-stone-400 ml-2 font-mono text-[10px]">
                      Expires: {n.expiryDate} · {n.isPublished ? 'Published' : 'Unpublished'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleNoticePublish(n.id)}
                      className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-[#F2C94C] text-[11px] font-semibold flex items-center gap-1"
                    >
                      {n.isPublished ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      <span>{n.isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>
                    {confirmDeleteId === n.id ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            deleteNotice(n.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 rounded bg-[#B83232] text-white text-[11px] font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 rounded bg-white/10 text-stone-300 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(n.id)}
                        className="p-1.5 rounded bg-white/10 hover:bg-[#B83232] text-white"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Published, Non-Expired Notices List */}
      {activePublishedNotices.length === 0 ? (
        <div className="public-card items-center justify-center text-center gap-2 shadow-xs">
          <div className="public-icon-box bg-[#F7F5F2] dark:bg-[#1E1E1E] border border-[#E5DFD9] dark:border-[#3D3835]">
            <Megaphone className="w-5 h-5 text-[#B83232] dark:text-[#F2C94C]" />
          </div>
          <p className="text-sm font-extrabold text-[#292929] dark:text-white mt-1">
            No important notices available at the moment.
          </p>
          <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] max-w-md leading-relaxed">
            Published institutional announcements and active deadline notices will appear here once posted by Administration or Faculty.
          </p>
        </div>
      ) : (
        <div className="public-grid grid-cols-1 md:grid-cols-2">
          {activePublishedNotices.map(notice => {
            const isRead =
              currentUser ? notice.readByStudentIds.includes(currentUser.studentId) : true;
            return (
              <div
                key={notice.id}
                className="public-card public-card--accent gap-4 shadow-xs"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${priorityBadgeClass(notice.priority)}`}>
                        {notice.priority}
                      </span>
                      <span className="text-[11px] font-mono font-semibold text-[#795548] dark:text-[#F2C94C]">
                        {notice.category}
                      </span>
                    </div>
                    {currentUser && (
                      <button
                        type="button"
                        onClick={() => markNoticeReadByStudent(notice.id)}
                        className={`text-[11px] font-bold px-2.5 py-1 rounded-md flex items-center gap-1 transition-colors ${
                          isRead
                            ? 'bg-[#F7F5F2] dark:bg-[#1E1E1E] text-[#6E6863] dark:text-[#BDB7B2]'
                            : 'bg-[#B83232]/15 text-[#B83232] dark:text-[#F2C94C]'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{isRead ? 'Read' : 'Mark as Read'}</span>
                      </button>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-[#292929] dark:text-white leading-snug">
                    {notice.title}
                  </h3>
                  <p className="text-xs text-[#6E6863] dark:text-[#BDB7B2] leading-relaxed">
                    {notice.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-[#E5DFD9] dark:border-[#3D3835] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#795548] dark:text-[#BDB7B2]">
                  <span className="inline-flex items-center gap-1.5 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
                    Published: {notice.publicationDate} · Expires: {notice.expiryDate}
                  </span>
                  {notice.attachmentName && (
                    <span className="inline-flex items-center gap-1 font-mono font-semibold text-[#B83232] dark:text-[#F2C94C]">
                      <FileText className="w-3.5 h-3.5" />
                      {notice.attachmentName}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
