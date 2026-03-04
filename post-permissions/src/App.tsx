import React, { useState, useRef } from 'react';

//const API_URL = 'http://localhost:5001/api';
const API_URL = 'https://cam-platform.onrender.com/api';
type CriteriaType = 'FULL_DAY' | 'MORNING' | 'AFTERNOON' | 'CUSTOM' | null;

interface FormErrors {
  rollNumber?: string;
  branch?: string;
  section?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  periods?: string;
  file?: string;
  criteria?: string;
}

const BRANCHES = [
  { value: 'CSE', label: 'CSE – Computer Science and Engineering' },
  { value: 'IT', label: 'IT – Information Technology' },
  { value: 'CSBS', label: 'CSBS – Computer Science and Business Systems' },
  { value: 'AIML', label: 'AI&ML – Artificial Intelligence and Machine Learning' },
  { value: 'AIDS', label: 'AI&DS – Artificial Intelligence and Data Science' },
  { value: 'ECE', label: 'ECE – Electronics and Communication Engineering' },
  { value: 'EEE', label: 'EEE – Electrical and Electronics Engineering' },
  { value: 'MECH', label: 'MECH – Mechanical Engineering' },
  { value: 'CIVIL', label: 'CIVIL – Civil Engineering' },
];

const SECTIONS = ['C'];

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
  );
}

export default function App() {
  const today = new Date().toISOString().split('T')[0];
  const fileRef = useRef<HTMLInputElement>(null);

  // Form state
  const [rollNumber, setRollNumber] = useState('');
  const [branch, setBranch] = useState('');
  const [section, setSection] = useState('');
  const [admissionYear] = useState('23');
  const [collegeCode] = useState('PA');
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [reason, setReason] = useState('');
  const [criteria, setCriteria] = useState<CriteriaType>(null);
  const [customPeriods, setCustomPeriods] = useState<number[]>([]);
  const [hasLetter] = useState(true);
  const [file, setFile] = useState<File | null>(null);

  // UI state
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const togglePeriod = (p: number) => {
    setCustomPeriods(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p].sort((a, b) => a - b)
    );
    setErrors(e => ({ ...e, periods: undefined }));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!rollNumber.trim()) errs.rollNumber = 'Roll number is required';
    else if (!/^[A-Z0-9]{8,12}$/i.test(rollNumber.trim())) errs.rollNumber = 'Enter a valid roll number (e.g. 23PA1A05F7)';
    if (!branch) errs.branch = 'Please select your branch';
    if (!section) errs.section = 'Please select your section';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    else if (endDate < startDate) errs.endDate = 'End date cannot be before start date';
    if (!reason.trim()) errs.reason = 'Please provide a reason';
    else if (reason.trim().length < 5) errs.reason = 'Reason is too short';
    if (!criteria) errs.criteria = 'Please select absence criteria';
    if (criteria === 'CUSTOM' && customPeriods.length === 0) errs.periods = 'Select at least one period';
    if (!file) errs.file = 'Please upload your permission letter';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(f.type)) {
      setErrors(prev => ({ ...prev, file: 'Only PDF, JPG, JPEG, PNG allowed' }));
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, file: 'File must be under 5MB' }));
      return;
    }
    setFile(f);
    setErrors(prev => ({ ...prev, file: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    setSubmitError('');

    try {
      // 1. Lookup class by branch + section + optional batch/college
      const lookupParams = new URLSearchParams({ dept: branch, section });
      if (admissionYear.trim()) lookupParams.set('admissionYear', admissionYear.trim());
      if (collegeCode.trim()) lookupParams.set('collegeCode', collegeCode.trim().toUpperCase());
      const lookupRes = await fetch(`${API_URL}/pending-permissions/lookup-class?${lookupParams}`);
      const lookupData = await lookupRes.json();
      if (!lookupRes.ok) throw new Error(lookupData.error || 'Class not found');

      const { classId } = lookupData;

      // 3. Submit the request using FormData for file support
      const formData = new FormData();
      formData.append('studentRoll', rollNumber.trim().toUpperCase());
      formData.append('startDate', startDate);
      formData.append('endDate', endDate);
      formData.append('type', criteria || 'FULL_DAY');
      formData.append('customPeriods', JSON.stringify(criteria === 'CUSTOM' ? customPeriods : []));
      formData.append('reason', reason.trim());
      formData.append('hasPermissionLetter', String(hasLetter));

      if (file) {
        formData.append('letter', file);
      }

      const submitRes = await fetch(
        `${API_URL}/pending-permissions/submit?classId=${classId}`,
        {
          method: 'POST',
          body: formData,
        }
      );
      const submitData = await submitRes.json();
      if (!submitRes.ok) throw new Error(submitData.error || 'Submission failed');

      setSubmitted(true);
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setRollNumber(''); setBranch(''); setSection('');
    setStartDate(today); setEndDate(today); setReason('');
    setCriteria(null); setCustomPeriods([]);
    setFile(null);
    setErrors({}); setSubmitError(''); setSubmitted(false);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Success Screen ──────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center px-4">
        <div className="fade-in-up w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
            style={{ animation: 'pulse-ring 2s infinite' }}>
            <CheckIcon className="w-10 h-10 text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Request Submitted!</h1>
          <p className="text-slate-400 text-sm mb-2">
            Your permission request has been sent to your Class Representative for approval.
          </p>
          <p className="text-slate-500 text-xs mb-8">
            You'll receive a response once the CR reviews your request.
          </p>
          <button
            onClick={resetForm}
            className="w-full py-3.5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-all duration-200 shadow-lg shadow-violet-500/20"
          >
            Submit Another Request
          </button>
        </div>
      </div>
    );
  }

  // ── Main Form ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0f0f1a] py-6 px-4">
      {/* Header */}
      <div className="max-w-md mx-auto mb-6 fade-in-up">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
            <svg className="w-5 h-5 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white leading-tight">Permission Request Form</h1>
            <p className="text-xs text-slate-500">Submit your permission request to the CR</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">

        {/* ── Card 1: Student Details ── */}
        <div className="fade-in-up bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4">
          <h2 className="text-xs font-bold text-violet-400 uppercase tracking-widest">Student Details</h2>

          {/* Roll Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Roll Number <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={rollNumber}
              onChange={e => { setRollNumber(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, rollNumber: undefined })); }}
              placeholder="23PA1A05F7"
              maxLength={12}
              className={`w-full px-4 py-3 rounded-xl bg-white/[0.06] border text-white placeholder-slate-600 font-mono text-sm focus:outline-none focus:ring-2 transition-all
                ${errors.rollNumber ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/30 focus:border-violet-500/50'}`}
            />
            {errors.rollNumber && <p className="text-red-400 text-xs mt-1">{errors.rollNumber}</p>}
          </div>

          {/* Branch & Section */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Branch <span className="text-red-400">*</span>
              </label>
              <select
                value={branch}
                onChange={e => { setBranch(e.target.value); setErrors(prev => ({ ...prev, branch: undefined })); }}
                className={`w-full px-3 py-3 rounded-xl bg-white/[0.06] border text-sm focus:outline-none focus:ring-2 transition-all appearance-none
                  ${errors.branch ? 'border-red-500/50 focus:ring-red-500/30 text-red-300' : 'border-white/10 focus:ring-violet-500/30 focus:border-violet-500/50 text-white'}
                  ${!branch ? 'text-slate-600' : ''}`}
              >
                <option value="" disabled className="bg-[#1a1a2e] text-slate-400">Select branch</option>
                <option value="CSE" className="bg-[#1a1a2e]">CSE</option>
                {/* <option value="IT" className="bg-[#1a1a2e]">IT</option>
                <option value="CSBS" className="bg-[#1a1a2e]">CSBS</option>
                <option value="AIML" className="bg-[#1a1a2e]">AI&ML</option>
                <option value="AIDS" className="bg-[#1a1a2e]">AI&DS</option>
                <option value="ECE" className="bg-[#1a1a2e]">ECE</option>
                <option value="EEE" className="bg-[#1a1a2e]">EEE</option>
                <option value="MECH" className="bg-[#1a1a2e]">MECH</option>
                <option value="CIVIL" className="bg-[#1a1a2e]">CIVIL</option> */}
              </select>
              {errors.branch && <p className="text-red-400 text-xs mt-1">{errors.branch}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Section <span className="text-red-400">*</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {SECTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSection(s); setErrors(prev => ({ ...prev, section: undefined })); }}
                    className={`h-11 rounded-xl text-sm font-bold border transition-all
                      ${section === s
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-white/[0.06] border-white/10 text-slate-400 hover:border-white/20 hover:text-white'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              {errors.section && <p className="text-red-400 text-xs mt-1">{errors.section}</p>}
            </div>
          </div>

          {/* Branch full name hint */}
          {branch && (
            <p className="text-xs text-slate-500 -mt-1">
              {BRANCHES.find(b => b.value === branch)?.label}
            </p>
          )}

        </div>

        {/* ── Card 2: Absence Period ── */}
        <div className="fade-in-up bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-xs font-bold text-violet-400 uppercase tracking-widest">Permission Details</h2>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Starts from <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setErrors(prev => ({ ...prev, startDate: undefined })); }}
                className={`w-full px-3 py-3 rounded-xl bg-white/[0.06] border text-white text-sm focus:outline-none focus:ring-2 transition-all
                  ${errors.startDate ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/30 focus:border-violet-500/50'}`}
              />
              {errors.startDate && <p className="text-red-400 text-xs mt-1">{errors.startDate}</p>}
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
                Ends on <span className="text-red-400">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                onChange={e => { setEndDate(e.target.value); setErrors(prev => ({ ...prev, endDate: undefined })); }}
                className={`w-full px-3 py-3 rounded-xl bg-white/[0.06] border text-white text-sm focus:outline-none focus:ring-2 transition-all
                  ${errors.endDate ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/30 focus:border-violet-500/50'}`}
              />
              {errors.endDate && <p className="text-red-400 text-xs mt-1">{errors.endDate}</p>}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wide">
              Reason <span className="text-red-400">*</span>
            </label>
            <textarea
              value={reason}
              onChange={e => { setReason(e.target.value); setErrors(prev => ({ ...prev, reason: undefined })); }}
              placeholder="e.g. Hackathon, Sports event, etc…"
              rows={3}
              className={`w-full px-4 py-3 rounded-xl bg-white/[0.06] border text-white placeholder-slate-600 text-sm focus:outline-none focus:ring-2 transition-all resize-none
                ${errors.reason ? 'border-red-500/50 focus:ring-red-500/30' : 'border-white/10 focus:ring-violet-500/30 focus:border-violet-500/50'}`}
            />
            {errors.reason && <p className="text-red-400 text-xs mt-1">{errors.reason}</p>}
          </div>
        </div>

        {/* ── Card 3: Criteria ── */}
        <div className="fade-in-up bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-xs font-bold text-violet-400 uppercase tracking-widest">Criteria <span className="text-red-400">*</span></h2>

          <div className="space-y-2">
            {[
              { value: 'FULL_DAY', label: 'Full Day', sub: '8 periods', icon: '☀️' },
              { value: 'MORNING', label: 'Only Morning', sub: 'Periods 1 – 4', icon: '🌅' },
              { value: 'AFTERNOON', label: 'Only Afternoon', sub: 'Periods 5 – 8', icon: '🌇' },
              { value: 'CUSTOM', label: 'Custom Periods', sub: 'Pick specific periods', icon: '🎯' },
            ].map(opt => (
              <label
                key={opt.value}
                className={`flex items-center gap-4 p-3.5 rounded-xl border cursor-pointer transition-all select-none
                  ${criteria === opt.value
                    ? 'bg-violet-600/15 border-violet-500/40 shadow-sm shadow-violet-500/10'
                    : 'bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]'}`}
              >
                <input
                  type="radio"
                  name="criteria"
                  value={opt.value}
                  checked={criteria === opt.value}
                  onChange={() => { setCriteria(opt.value as CriteriaType); setCustomPeriods([]); setErrors(prev => ({ ...prev, periods: undefined, criteria: undefined })); }}
                  className="sr-only"
                />
                <span className="text-lg">{opt.icon}</span>
                <div className="flex-1">
                  <p className={`text-sm font-semibold ${criteria === opt.value ? 'text-violet-300' : 'text-slate-300'}`}>{opt.label}</p>
                  <p className="text-xs text-slate-500">{opt.sub}</p>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                  ${criteria === opt.value ? 'border-violet-500 bg-violet-600' : 'border-white/20'}`}>
                  {criteria === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
              </label>
            ))}
          </div>
          {errors.criteria && <p className="text-red-400 text-xs mt-2">{errors.criteria}</p>}

          {/* Custom Period Selector */}
          {criteria === 'CUSTOM' && (
            <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 fade-in-up">
              <p className="text-xs font-bold text-violet-400 uppercase tracking-wide mb-3">
                Select Periods ({customPeriods.length} selected)
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePeriod(p)}
                    className={`h-12 rounded-xl text-sm font-bold border transition-all flex flex-col items-center justify-center gap-0.5
                      ${customPeriods.includes(p)
                        ? 'bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-500/20 scale-95'
                        : 'bg-white/[0.05] border-white/10 text-slate-400 hover:border-violet-400/40 hover:text-violet-300'}`}
                  >
                    <span>{p}</span>
                    <span className="text-[9px] opacity-60">{p <= 4 ? 'AM' : 'PM'}</span>
                  </button>
                ))}
              </div>
              {errors.periods && <p className="text-red-400 text-xs mt-2">{errors.periods}</p>}
              {customPeriods.length > 0 && (
                <p className="text-xs text-violet-400 mt-2">
                  Selected: Period {customPeriods.join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Card 4: Permission Letter ── */}
        <div className="fade-in-up bg-white/[0.04] border border-white/[0.08] rounded-2xl p-5 space-y-4" style={{ animationDelay: '0.15s' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-200">Permission Letter <span className="text-red-400">*</span></h2>
              <p className="text-xs text-slate-500 mt-0.5">Please upload your permission letter (Required)</p>
            </div>
          </div>

          {/* File Upload */}
          <div className="fade-in-up">
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="hidden"
              id="letter-upload"
            />
            <label
              htmlFor="letter-upload"
              className={`flex flex-col items-center justify-center gap-3 p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all
                  ${errors.file ? 'border-red-500/50 bg-red-500/5' : file ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 bg-white/[0.02] hover:border-violet-500/30 hover:bg-violet-500/5'}`}
            >
              {file ? (
                <>
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                    <CheckIcon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-emerald-400">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{(file.size / 1024).toFixed(0)} KB · Tap to change</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                    <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-300">Tap to upload letter</p>
                    <p className="text-xs text-slate-500 mt-0.5">PDF, JPG, JPEG, PNG · Max 15MB</p>
                  </div>
                </>
              )}
            </label>
            {errors.file && <p className="text-red-400 text-xs mt-1.5">{errors.file}</p>}
          </div>
        </div>

        {/* Submit Error */}
        {submitError && (
          <div className="fade-in-up bg-red-500/10 border border-red-500/30 rounded-xl p-4 space-y-2">
            <p className="text-red-400 text-sm font-semibold">⚠ Submission Failed</p>
            <p className="text-red-300/80 text-xs leading-relaxed">{submitError}</p>
            {submitError.toLowerCase().includes('class not found') || submitError.toLowerCase().includes('no class found') ? (
              <div className="mt-2 pt-2 border-t border-red-500/20">
                <p className="text-amber-400/90 text-xs font-semibold mb-1">💡 Try this:</p>
                <ul className="text-amber-300/70 text-xs space-y-1 list-disc list-inside">
                  <li>Enter Admission Batch: <span className="font-mono font-bold text-amber-300">23</span></li>
                  <li>Enter College Code: <span className="font-mono font-bold text-amber-300">PA</span></li>
                  <li>Make sure Branch and Section match exactly what your CR configured</li>
                  <li>Ask your CR to confirm their class setup details</li>
                </ul>
              </div>
            ) : null}
          </div>
        )}

        {/* ── Submit Button ── */}
        <button
          type="submit"
          disabled={submitting}
          className={`fade-in-up w-full py-4 rounded-2xl text-white font-bold text-sm tracking-wide transition-all duration-300 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed
            ${submitting ? 'bg-violet-700' : 'shimmer-btn hover:shadow-violet-500/40 active:scale-[0.98]'}`}
          style={{ animationDelay: '0.2s' }}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Submitting your Request…
            </span>
          ) : (
            'Submit Request'
          )}
        </button>

        <p className="text-center text-xs text-slate-600 pb-4">
          Your request will be reviewed by your Class Representative
        </p>
      </form>
    </div>
  );
}
