import React, { useState, useEffect } from 'react';
import { adminApi } from '../../../api/adminApi.js';
import { Loader2, CheckCircle2, XCircle, Search, FileText, Calendar, ShieldCheck, Briefcase, UserCheck, Sparkles } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function AdminModerationQueue({ adminId }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      adminApi.getPendingProjects().catch(() => []),
      adminApi.getProfileRequests().catch(() => []),
      adminApi.getPendingGigs().catch(() => [])
    ])
    .then(([projects, profiles, gigs]) => {
      let mapped = [];
      
      if (Array.isArray(projects)) {
        mapped = [...mapped, ...projects.map(p => ({
          id: `PROJ_${p.id}`,
          rawId: p.id,
          type: 'PROJECT',
          title: p.title,
          author: p.clientName || 'Client',
          description: p.description,
          createdAt: p.createdAt
        }))];
      }

      if (Array.isArray(profiles)) {
        mapped = [...mapped, ...profiles.map(p => ({
          id: `PROF_${p.id}`,
          rawId: p.id,
          type: 'PROFILE',
          title: `Hồ sơ: ${p.freelancerName || 'Freelancer'}`,
          author: p.freelancerName || 'Freelancer',
          description: p.bio || p.description,
          createdAt: p.createdAt
        }))];
      }

      if (Array.isArray(gigs)) {
        mapped = [...mapped, ...gigs.map(g => ({
          id: `GIG_${g.id}`,
          rawId: g.id,
          type: 'GIG',
          title: g.title,
          author: g.freelancerName || 'Freelancer',
          description: g.description,
          createdAt: g.createdAt
        }))];
      }

      // Sort by newest
      mapped.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setData(mapped);
    })
    .catch(err => {
      console.error(err);
      toast.error('Lỗi khi tải dữ liệu kiểm duyệt');
    })
    .finally(() => setLoading(false));
  };

  const handleProcess = async (item, approve) => {
    let reason = '';
    if (!approve) {
      reason = window.prompt('Nhập lý do từ chối (bắt buộc):');
      if (reason === null) return;
      if (!reason.trim()) {
        toast.error('Vui lòng nhập lý do từ chối');
        return;
      }
    } else {
      if (!window.confirm(`Bạn chắc chắn muốn duyệt ${item.type} này?`)) return;
    }

    setProcessingId(item.id);
    try {
      if (item.type === 'PROJECT') {
        await adminApi.moderateProject(item.rawId, approve, reason, adminId);
      } else if (item.type === 'PROFILE') {
        await adminApi.moderateProfileRequest(item.rawId, approve, reason, adminId);
      } else if (item.type === 'GIG') {
        await adminApi.moderateGig(item.rawId, approve, reason, adminId);
      }
      toast.success(approve ? 'Đã duyệt thành công' : 'Đã từ chối thành công');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Có lỗi xảy ra khi xử lý');
    } finally {
      setProcessingId(null);
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'PROJECT': return <Briefcase className="w-4 h-4 text-blue-600" />;
      case 'PROFILE': return <UserCheck className="w-4 h-4 text-fuchsia-600" />;
      case 'GIG': return <Sparkles className="w-4 h-4 text-amber-600" />;
      default: return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const getTypeStyle = (type) => {
    switch(type) {
      case 'PROJECT': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'PROFILE': return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100';
      case 'GIG': return 'bg-amber-50 text-amber-700 border-amber-100';
      default: return 'bg-slate-50 text-slate-700 border-slate-100';
    }
  };

  const filteredData = data.filter(item => 
    item.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm theo tiêu đề, tác giả..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
            Tổng: {data.length} nội dung
          </span>
          <span className="text-sm font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-lg border border-purple-100">
            Cần duyệt: {data.length}
          </span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Loại</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Nội dung / Tiêu đề</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px]">Tác giả</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[11px] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto" />
                    <p className="mt-3 text-slate-500 font-medium">Đang tải dữ liệu kiểm duyệt...</p>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <ShieldCheck className="w-8 h-8 text-slate-400" />
                    </div>
                    <p className="text-slate-500 font-medium">Chưa có nội dung mới nào cần kiểm duyệt.</p>
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-1.5 font-bold px-2.5 py-1 rounded-lg w-max border ${getTypeStyle(item.type)}`}>
                        {getTypeIcon(item.type)}
                        <span className="text-[10px] uppercase tracking-wider">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-2 font-mono">
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-slate-800 line-clamp-1">{item.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-700">{item.author}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          disabled={processingId === item.id}
                          onClick={() => handleProcess(item, true)}
                          className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                          title="Duyệt"
                        >
                          {processingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                        </button>
                        <button
                          disabled={processingId === item.id}
                          onClick={() => handleProcess(item, false)}
                          className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                          title="Từ chối"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
