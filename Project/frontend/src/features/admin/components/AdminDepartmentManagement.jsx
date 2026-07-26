import React, { useState, useEffect } from 'react';
import { adminApi } from '../api/adminApi.js';
import { Loader2, Users, AlertTriangle, Building2, UserCircle, Activity, ChevronLeft, Calendar } from 'lucide-react';

export default function AdminDepartmentManagement({ onClose }) {
  const [departmentsList, setDepartmentsList] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [departmentSessions, setDepartmentSessions] = useState([]);
  const [deptDetailTab, setDeptDetailTab] = useState('members');
  const [loadingSessions, setLoadingSessions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [deptRes, usersRes] = await Promise.all([
        adminApi.getDepartments(),
        adminApi.getUsers({})
      ]);
      setDepartmentsList(Array.isArray(deptRes) ? deptRes : []);
      
      let allUsers = [];
      if (usersRes.data?.content) allUsers = usersRes.data.content;
      else if (Array.isArray(usersRes.data)) allUsers = usersRes.data;
      else if (Array.isArray(usersRes)) allUsers = usersRes;
      
      setUsers(allUsers);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi tải thông tin phòng ban.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDepartment = async (dept) => {
    setSelectedDepartment(dept);
    setDeptDetailTab('members');
    setLoadingSessions(true);
    try {
      const sessionsData = await adminApi.getDepartmentSessions(dept.departmentId);
      setDepartmentSessions(Array.isArray(sessionsData) ? sessionsData : []);
    } catch (err) {
      console.error(err);
      setDepartmentSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between shrink-0 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Cấu trúc Phòng Ban</h2>
                      <p className="text-xs text-slate-500 font-medium">Xem phân bổ nhân sự và hoạt động</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition-colors"
        >
          Đóng
        </button>
      </div>

      {/* Content */}
      <div className="p-6 overflow-y-auto flex-1">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            <p className="text-sm font-bold text-slate-500">Đang tải dữ liệu phòng ban...</p>
          </div>
        ) : !selectedDepartment ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {departmentsList.map(dept => {
              const deptUsers = users.filter(u => u.departmentId === dept.departmentId && !u.isDeleted);
              const managersCount = deptUsers.filter(u => u.role === 'MANAGER').length;
              const staffCount = deptUsers.filter(u => u.role === 'STAFF').length;

              return (
                <div 
                  key={dept.departmentId}
                  onClick={() => handleSelectDepartment(dept)}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 p-5 flex flex-col justify-between cursor-pointer group"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="bg-indigo-50 text-indigo-700 font-extrabold text-[11px] px-2.5 py-1 rounded-lg">
                        {dept.code}
                      </span>
                      <div className="flex flex-col items-end text-slate-500 font-bold text-[11px] gap-1">
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-purple-500" />
                          <span>{managersCount} Managers</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-sky-500" />
                          <span>{staffCount} Staffs</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-bold text-base text-slate-800 group-hover:text-indigo-600 transition-colors">{dept.name}</h4>
                      <p className="text-[12px] text-slate-500 mt-1.5 line-clamp-2 min-h-[36px]">
                        {dept.description || 'Chưa có mô tả chi tiết cho khoa này.'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full animate-in slide-in-from-right-4 duration-300">
            {/* Dept Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
              <div className="flex items-start gap-4">
                <button 
                  onClick={() => setSelectedDepartment(null)}
                  className="p-2 hover:bg-slate-200 rounded-xl transition-colors text-slate-500 shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-indigo-100 text-indigo-700 font-extrabold text-[10px] px-2 py-0.5 rounded uppercase">
                      {selectedDepartment.code}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-800">{selectedDepartment.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-2xl">{selectedDepartment.description}</p>
                </div>
              </div>
            </div>

            {/* Dept Tabs */}
            <div className="flex border-b border-slate-200 shrink-0 bg-white px-2">
              <button
                onClick={() => setDeptDetailTab('members')}
                className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
                  deptDetailTab === 'members' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Nhân sự ({users.filter(u => u.departmentId === selectedDepartment.departmentId && !u.isDeleted).length})
              </button>
              <button
                onClick={() => setDeptDetailTab('sessions')}
                className={`px-6 py-3.5 text-sm font-bold border-b-2 transition-all ${
                  deptDetailTab === 'sessions' 
                    ? 'border-indigo-600 text-indigo-600' 
                    : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                Phiên Làm Việc ({departmentSessions.length})
              </button>
            </div>

            {/* Dept Content */}
            <div className="flex-1 overflow-y-auto p-5 bg-white">
              {deptDetailTab === 'members' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {users.filter(u => u.departmentId === selectedDepartment.departmentId && !u.isDeleted).length === 0 ? (
                    <p className="col-span-2 text-center text-slate-400 py-12 text-sm font-medium">Chưa có nhân sự nào trong phòng ban này.</p>
                  ) : (
                    users.filter(u => u.departmentId === selectedDepartment.departmentId && !u.isDeleted).map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/30 transition-colors">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          user.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                          {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-slate-800 text-sm truncate flex items-center gap-2">
                            {user.displayName || 'Unknown User'}
                            {user.role === 'MANAGER' && <span className="bg-purple-100 text-purple-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Manager</span>}
                            {user.role === 'STAFF' && <span className="bg-sky-100 text-sky-700 text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider">Staff</span>}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {loadingSessions ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-indigo-500" /></div>
                  ) : departmentSessions.length === 0 ? (
                    <p className="text-center text-slate-400 py-12 text-sm font-medium">Chưa có phiên làm việc nào được ghi nhận.</p>
                  ) : (
                    departmentSessions.map(session => (
                      <div key={session.sessionId} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-800 text-sm">{session.userEmail}</span>
                            <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">{session.userRole}</span>
                          </div>
                          <div className="text-right">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              session.logoutTime ? 'bg-slate-200 text-slate-600' : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {session.logoutTime ? 'Đã kết thúc' : 'Đang hoạt động'}
                            </span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-3 text-xs text-slate-600 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-500">Bắt đầu:</span> 
                            {new Date(session.loginTime).toLocaleString('vi-VN')}
                          </div>
                          {session.logoutTime && (
                            <div className="flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-500">Kết thúc:</span>
                              {new Date(session.logoutTime).toLocaleString('vi-VN')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
