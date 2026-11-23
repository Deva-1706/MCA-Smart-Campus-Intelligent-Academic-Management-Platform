import React, { useState } from 'react';
import { Mail, Send, CheckCircle2, AlertCircle, HelpCircle, ShieldCheck } from 'lucide-react';
import { usePortal } from '../../context/PortalContext';

export const ContactPage: React.FC = () => {
  const { setCurrentPage } = usePortal();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    subject: '',
    message: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicketId, setSubmittedTicketId] = useState<string | null>(null);

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.fullName.trim()) {
      errs.fullName = 'Full name is required.';
    } else if (formData.fullName.trim().length < 3) {
      errs.fullName = 'Name must be at least 3 characters.';
    }

    if (!formData.email.trim()) {
      errs.email = 'Academic or personal email is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errs.email = 'Please provide a valid email address.';
    }

    if (!formData.subject.trim()) {
      errs.subject = 'Please select or provide an inquiry subject.';
    }

    if (!formData.message.trim()) {
      errs.message = 'Inquiry message cannot be empty.';
    } else if (formData.message.trim().length < 15) {
      errs.message = 'Message must be at least 15 characters long.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmittedTicketId(null);
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName.trim(),
          email: formData.email.trim(),
          subject: formData.subject.trim(),
          message: formData.message.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSubmitError(data.error || 'Unable to submit your academic inquiry right now.');
        setIsSubmitting(false);
        return;
      }

      setSubmittedTicketId(data.ticketId || 'LOGGED');
      setFormData({
        fullName: '',
        email: '',
        subject: '',
        message: ''
      });
      setErrors({});
    } catch {
      setSubmitError('Network error while contacting the academic desk. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Title */}
      <div className="max-w-3xl space-y-2">
        <span className="text-xs font-bold uppercase tracking-wider text-[#B83232] dark:text-[#F2C94C]">
          Academic Inquiries & Support
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#292929] dark:text-white tracking-tight">
          Contact Academic Administration
        </h1>
        <p className="text-sm sm:text-base text-[#795548] dark:text-stone-300 leading-relaxed">
          Have an inquiry regarding Semester 1 syllabus coverage, examination timetables, Python coding lab issues, or student credentials? Submit your inquiry to the academic support team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Form Container */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
            <h2 className="text-lg font-bold text-[#292929] dark:text-white">
              Academic Support Ticket Form
            </h2>
            <div className="flex items-center gap-1.5 text-[11px] text-[#795548] dark:text-stone-400 font-mono bg-[#F7F5F2] dark:bg-stone-800 px-2 py-1 rounded">
              <ShieldCheck className="w-3.5 h-3.5 text-[#B83232] dark:text-[#F2C94C]" />
              <span>Validated Submission</span>
            </div>
          </div>

          {submitError && (
            <div role="alert" className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-[#B83232] dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {submittedTicketId && (
            <div role="status" className="p-4 rounded-xl bg-amber-50 dark:bg-stone-900 border border-[#F2C94C] text-[#292929] dark:text-[#F2C94C] text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#B83232] dark:text-[#F2C94C] shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">
                  Ticket Submitted Successfully <span className="font-mono text-xs">({submittedTicketId})</span>
                </p>
                <p className="mt-0.5 text-[#795548] dark:text-stone-300">
                  Your academic inquiry has been logged with the MCA Academic Desk. The department coordinator will respond within 1–2 working days.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Full Name */}
            <div>
              <label htmlFor="fullName" className="block text-xs font-semibold text-[#292929] dark:text-stone-300 mb-1">
                Full Name <span className="text-[#B83232]">*</span>
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="Enter your full name"
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs bg-[#F7F5F2] dark:bg-stone-800 border transition-colors ${
                  errors.fullName
                    ? 'border-[#B83232] focus:ring-1 focus:ring-[#B83232]'
                    : 'border-stone-200 dark:border-stone-700 focus:border-[#B83232]'
                } text-[#292929] dark:text-white`}
              />
              {errors.fullName && (
                <p className="text-[11px] text-[#B83232] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.fullName}</span>
                </p>
              )}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#292929] dark:text-stone-300 mb-1">
                University or Personal Email <span className="text-[#B83232]">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. student@mca.edu.in"
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs bg-[#F7F5F2] dark:bg-stone-800 border transition-colors ${
                  errors.email
                    ? 'border-[#B83232] focus:ring-1 focus:ring-[#B83232]'
                    : 'border-stone-200 dark:border-stone-700 focus:border-[#B83232]'
                } text-[#292929] dark:text-white`}
              />
              {errors.email && (
                <p className="text-[11px] text-[#B83232] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.email}</span>
                </p>
              )}
            </div>

            {/* Subject Selector */}
            <div>
              <label htmlFor="subject" className="block text-xs font-semibold text-[#292929] dark:text-stone-300 mb-1">
                Inquiry Category / Subject <span className="text-[#B83232]">*</span>
              </label>
              <select
                id="subject"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs bg-[#F7F5F2] dark:bg-stone-800 border transition-colors ${
                  errors.subject
                    ? 'border-[#B83232] focus:ring-1 focus:ring-[#B83232]'
                    : 'border-stone-200 dark:border-stone-700 focus:border-[#B83232]'
                } text-[#292929] dark:text-white`}
              >
                <option value="">Select an inquiry topic...</option>
                <option value="Curriculum Syllabus Clarification">Curriculum & Syllabus Clarification</option>
                <option value="Online Examination & Grading Query">Online Examination & Grading Query</option>
                <option value="Python Coding Lab Execution Issue">Python Coding Lab Execution Issue</option>
                <option value="Student Authentication / Password Reset">Student Authentication / Password Reset</option>
                <option value="Academic Report & Grade Sheet Request">Academic Report & Grade Sheet Request</option>
                <option value="Other Academic Support">Other Academic Support</option>
              </select>
              {errors.subject && (
                <p className="text-[11px] text-[#B83232] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.subject}</span>
                </p>
              )}
            </div>

            {/* Message Area */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="message" className="block text-xs font-semibold text-[#292929] dark:text-stone-300">
                  Message Details <span className="text-[#B83232]">*</span>
                </label>
                <span className="text-[10px] text-[#795548] dark:text-stone-400 font-mono">
                  {formData.message.length} chars
                </span>
              </div>
              <textarea
                id="message"
                rows={5}
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                placeholder="Describe your question or issue in detail..."
                className={`w-full px-3.5 py-2.5 rounded-lg text-xs bg-[#F7F5F2] dark:bg-stone-800 border transition-colors ${
                  errors.message
                    ? 'border-[#B83232] focus:ring-1 focus:ring-[#B83232]'
                    : 'border-stone-200 dark:border-stone-700 focus:border-[#B83232]'
                } text-[#292929] dark:text-white`}
              />
              {errors.message && (
                <p className="text-[11px] text-[#B83232] mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>{errors.message}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-lg text-xs font-semibold text-white bg-[#B83232] hover:bg-[#9E2A2A] transition-colors shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting Inquiry...</span>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Academic Inquiry</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Info Box */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#202020] border border-stone-200 dark:border-stone-800 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-[#292929] dark:text-white">
              Academic Support Information
            </h3>
            <p className="text-xs text-[#795548] dark:text-stone-300 leading-relaxed">
              Inquiries submitted through this form are logged directly to the academic helpdesk database and routed to the corresponding Semester 1 course coordinators.
            </p>

            <div className="space-y-3 pt-2 text-xs text-[#795548] dark:text-stone-300">
              <div className="p-3 rounded-lg bg-[#F7F5F2] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                <p className="font-semibold text-[#292929] dark:text-white mb-0.5">Academic Office Hours</p>
                <p className="text-[#795548] dark:text-stone-400">Monday – Friday: 09:00 AM – 05:00 PM IST</p>
              </div>

              <div className="p-3 rounded-lg bg-[#F7F5F2] dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700">
                <p className="font-semibold text-[#292929] dark:text-white mb-0.5">Average Response Time</p>
                <p className="text-[#795548] dark:text-stone-400">Within 24 hours during working semesters</p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  setCurrentPage('faq');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full py-2 px-3 text-xs font-semibold text-[#292929] bg-[#F2C94C] hover:bg-[#e0b73c] rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Search Frequently Asked Questions</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
