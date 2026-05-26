import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BadgeCheck,
  Banknote,
  Building2,
  CheckCircle2,
  Globe2,
  Loader2,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  UserRound,
  XCircle
} from 'lucide-react';

const emptyForm = {
  displayName: '',
  fullName: '',
  phone: '',
  companyName: '',
  companyLogoUrl: '',
  companyDescription: '',
  website: '',
  address: '',
  city: '',
  country: '',
  companySize: '',
  industry: '',
  billing: {
    bankName: '',
    accountNumber: '',
    accountHolder: '',
    branch: ''
  }
};

export default function EmployerProfileSettings({ user, onNavigateHome, onUserUpdate }) {
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState(null);

  const completion = useMemo(() => {
    const keys = [
      'displayName',
      'fullName',
      'phone',
      'companyName',
      'companyDescription',
      'website',
      'address',
      'city',
      'country',
      'companySize',
      'industry'
    ];
    const filled = keys.filter((key) => String(form[key] || '').trim()).length;
    return Math.round((filled / keys.length) * 100);
  }, [form]);

  useEffect(() => {
    if (!user?.id || user?.role !== 'EMPLOYER') {
      setLoading(false);
      return;
    }

    fetch(`http://localhost:8080/api/employers/${user.id}/profile`)
      .then((res) => {
        if (!res.ok) throw new Error('Không tìm thấy hồ sơ employer.');
        return res.json();
      })
      .then((data) => {
        setForm({
          displayName: data.displayName || user.name || '',
          fullName: data.fullName || '',
          phone: data.phone || '',
          companyName: data.companyName || '',
          companyLogoUrl: data.companyLogoUrl || '',
          companyDescription: data.companyDescription || '',
          website: data.website || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || '',
          companySize: data.companySize || '',
          industry: data.industry || '',
          billing: {
            bankName: data.billing?.bank_name || data.billing?.bankName || '',
            accountNumber: data.billing?.account_number || data.billing?.accountNumber || '',
            accountHolder: data.billing?.account_holder || data.billing?.accountHolder || '',
            branch: data.billing?.branch || ''
          }
        });
      })
      .catch((error) => {
        setNotice({ type: 'error', message: error.message || 'Không thể tải hồ sơ công ty.' });
      })
      .finally(() => setLoading(false));
  }, [user]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updateBilling = (field, value) => {
    setForm((prev) => ({
      ...prev,
      billing: {
        ...prev.billing,
        [field]: value
      }
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch(`http://localhost:8080/api/employers/${user.id}/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok || data.success === false) {
        throw new Error(data.message || 'Cập nhật thất bại.');
      }

      if (onUserUpdate) {
        onUserUpdate({
          ...user,
          name: data.displayName || form.displayName || user.name,
          avatar: data.companyLogoUrl || user.avatar
        });
      }
      setNotice({ type: 'success', message: data.message || 'Đã lưu thay đổi.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message || 'Không thể lưu thay đổi.' });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'EMPLOYER') {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center px-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md text-center shadow-level-1">
          <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
          <h1 className="text-xl font-extrabold text-slate-900">Chỉ dành cho Employer</h1>
          <p className="text-sm text-slate-500 mt-2">Tài khoản hiện tại không có quyền cập nhật hồ sơ công ty.</p>
          <button
            type="button"
            onClick={onNavigateHome}
            className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-sm hover:bg-slate-800"
          >
            <ArrowLeft className="w-4 h-4" />
            Về trang chủ
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onNavigateHome}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-950"
          >
            <ArrowLeft className="w-4 h-4" />
            Trang chủ
          </button>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-3 py-1.5">
            <ShieldCheck className="w-4 h-4" />
            Trust profile
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          <aside className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-level-1">
              <div className="w-14 h-14 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-700 mb-4">
                <Building2 className="w-7 h-7" />
              </div>
              <h1 className="text-xl font-extrabold tracking-tight">Hồ sơ công ty</h1>
              <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                Cập nhật thông tin doanh nghiệp và tài khoản thanh toán để freelancer tin tưởng hơn khi nhận dự án.
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-level-1">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-slate-700">Độ hoàn thiện</span>
                <span className="text-sm font-extrabold text-cyan-700">{completion}%</span>
              </div>
              <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500 rounded-full transition-all" style={{ width: `${completion}%` }} />
              </div>
              <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <BadgeCheck className="w-4 h-4 text-emerald-500" />
                  Thông tin rõ ràng tăng độ tin cậy
                </div>
                <div className="flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-amber-500" />
                  Billing dùng để đối soát thanh toán
                </div>
              </div>
            </div>
          </aside>

          <section className="bg-white border border-slate-200 rounded-2xl shadow-level-1 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-lg font-extrabold">Company & Billing Details</h2>
                <p className="text-sm text-slate-500">Những thông tin này sẽ được dùng trong hồ sơ employer và thanh toán.</p>
              </div>
              {notice && (
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${
                  notice.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  {notice.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  {notice.message}
                </div>
              )}
            </div>

            {loading ? (
              <div className="h-[520px] flex items-center justify-center text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Đang tải hồ sơ...
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-8">
                <FormSection icon={<Building2 className="w-5 h-5" />} title="Thông tin công ty">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput label="Tên công ty" value={form.companyName} onChange={(value) => updateField('companyName', value)} required />
                    <TextInput label="Ngành nghề" value={form.industry} onChange={(value) => updateField('industry', value)} placeholder="VD: Software, Marketing, Design" />
                    <TextInput label="Quy mô công ty" value={form.companySize} onChange={(value) => updateField('companySize', value)} placeholder="VD: 11-50" />
                    <TextInput label="Logo URL" value={form.companyLogoUrl} onChange={(value) => updateField('companyLogoUrl', value)} placeholder="https://..." />
                    <TextInput label="Website" value={form.website} onChange={(value) => updateField('website', value)} icon={<Globe2 className="w-4 h-4" />} placeholder="https://company.com" />
                    <TextInput label="Quốc gia" value={form.country} onChange={(value) => updateField('country', value)} icon={<MapPin className="w-4 h-4" />} />
                    <TextInput label="Thành phố" value={form.city} onChange={(value) => updateField('city', value)} />
                    <TextInput label="Địa chỉ" value={form.address} onChange={(value) => updateField('address', value)} />
                  </div>
                  <TextArea label="Mô tả công ty" value={form.companyDescription} onChange={(value) => updateField('companyDescription', value)} />
                </FormSection>

                <FormSection icon={<UserRound className="w-5 h-5" />} title="Người đại diện">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextInput label="Tên hiển thị" value={form.displayName} onChange={(value) => updateField('displayName', value)} required />
                    <TextInput label="Họ tên" value={form.fullName} onChange={(value) => updateField('fullName', value)} />
                    <TextInput label="Số điện thoại" value={form.phone} onChange={(value) => updateField('phone', value)} icon={<Phone className="w-4 h-4" />} />
                  </div>
                </FormSection>

                <FormSection icon={<Banknote className="w-5 h-5" />} title="Chi tiết thanh toán">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput label="Ngân hàng" value={form.billing.bankName} onChange={(value) => updateBilling('bankName', value)} placeholder="VD: Vietcombank" />
                    <TextInput label="Số tài khoản" value={form.billing.accountNumber} onChange={(value) => updateBilling('accountNumber', value)} />
                    <TextInput label="Chủ tài khoản" value={form.billing.accountHolder} onChange={(value) => updateBilling('accountHolder', value)} />
                    <TextInput label="Chi nhánh" value={form.billing.branch} onChange={(value) => updateBilling('branch', value)} />
                  </div>
                </FormSection>

                <div className="flex justify-end border-t border-slate-200 pt-5">
                  <button
                    type="submit"
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 text-white font-extrabold text-sm hover:bg-slate-800 disabled:opacity-70 shadow-level-1"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}

function FormSection({ icon, title, children }) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2 text-slate-900">
        <span className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600">
          {icon}
        </span>
        <h3 className="font-extrabold">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function TextInput({ label, value, onChange, placeholder, icon, required }) {
  return (
    <label className="block">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">
        {label}{required ? ' *' : ''}
      </span>
      <div className="relative">
        {icon && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>}
        <input
          type="text"
          required={required}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 ${icon ? 'pl-10' : ''}`}
        />
      </div>
    </label>
  );
}

function TextArea({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-1.5">{label}</span>
      <textarea
        rows="4"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/10 resize-none"
        placeholder="Mô tả ngắn về lĩnh vực hoạt động, đội ngũ, văn hóa và nhu cầu tuyển freelancer..."
      />
    </label>
  );
}
