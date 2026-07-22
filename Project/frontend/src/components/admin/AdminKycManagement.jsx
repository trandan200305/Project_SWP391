import React, { useState, useMemo, useEffect } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement,
  LineElement, Title, Tooltip, Legend, Filler, BarElement
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import VnPteKycModal from '../common/VnPteKycModal';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler, BarElement);

// ============================================================
// TOÀN BỘ DỮ LIỆU API TỪ FILE EXCEL api.xlsx (161 dòng)
// ============================================================
const ERROR_CODES = [
  { code: '101', label: 'Giay to mo nhoe' },
  { code: '102', label: 'Giay to mat goc' },
  { code: '103', label: 'ID mo nhoe' },
  { code: '104', label: 'Chat luong dau vao khong dat chuan' },
  { code: '105', label: 'Ho ten mo nhoe' },
  { code: '106', label: 'Ngay cap mo nhoe' },
  { code: '107', label: 'Ngay het han mo nhoe' },
  { code: '108', label: 'Ngay sinh mo nhoe' },
  { code: '109', label: 'Mat truoc mat sau khong khop' },
  { code: '110', label: 'ID duc loi' },
  { code: '111', label: 'Anh mat truoc bi che' },
  { code: '112', label: 'ID xac suat thap' },
  { code: '113', label: 'ID sua xoa' },
  { code: '114', label: 'ID khong hop le' },
  { code: '115', label: 'ID khong khop nam sinh' },
  { code: '116', label: 'ID khong khop gioi tinh' },
  { code: '117', label: 'ID khong khop ma tinh' },
  { code: '118', label: 'ID sai do dai' },
  { code: '119', label: 'Ngay sinh khong hop le' },
  { code: '120', label: 'Anh giay to photo' },
  { code: '121', label: 'ID sai dinh dang in an' },
  { code: '122', label: 'Cong dan 14 tuoi' },
  { code: '201', label: 'Khong phai nguoi that' },
  { code: '301', label: 'Giay to khong phai anh chup truc tiep' },
  { code: '302', label: 'Anh bi dan de' },
  { code: '303', label: 'Giay to in mau' },
  { code: '401', label: 'Anh bi che mat' },
  { code: '501', label: 'Khuon mat khong khop' },
];

const today = new Date();
const fmt = (d) => `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
const fmtInput = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
const tenDaysAgo = new Date(today); tenDaysAgo.setDate(today.getDate() - 10);

const AdminKycManagement = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('volume'); // 'volume' | 'error'
  const [apiPage, setApiPage] = useState(1);
  const API_PAGE_SIZE = 10;
  const [isEkycModalOpen, setIsEkycModalOpen] = useState(false);
  const [showErrorCodeModal, setShowErrorCodeModal] = useState(false);
  const [selectedErrorCodes, setSelectedErrorCodes] = useState([]);
  const [dateMode, setDateMode] = useState('Ngay');
  const [fromDate, setFromDate] = useState(fmtInput(tenDaysAgo));
  const [toDate, setToDate] = useState(fmtInput(today));

  
  const [pageData, setPageData] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [stats, setStats] = useState({ total: 0, success: 0, errCustomer: 0, errSystem: 0 });
  const [quotaLimit, setQuotaLimit] = useState(50000);
  useEffect(() => {
    fetch(`http://localhost:8080/api/dashboard/api-stats/paginated?page=${apiPage}&size=${API_PAGE_SIZE}`)
      .then(res => res.json())
      .then(data => {
        setPageData(data.content || []);
        setTotalPages(data.totalPages || 1);
        setTotalElements(data.totalItems || 0);
      })
      .catch(console.error);
  }, [apiPage]);

  const fetchDashboardStats = () => {
    fetch(`http://localhost:8080/api/dashboard/api-stats/all`)
      .then(res => res.json())
      .then(data => {
        if (!Array.isArray(data)) return;
        const tAll = data.reduce((s, a) => s + (a.total || 0), 0);
        const tSucc = data.reduce((s, a) => s + (a.success || 0), 0);
        const tCust = data.reduce((s, a) => s + (a.errorCustomer || 0), 0);
        const tSys = data.reduce((s, a) => s + (a.errorSystem || 0), 0);
        setStats({ total: tAll, success: tSucc, errCustomer: tCust, errSystem: tSys });
      })
      .catch(console.error);
  };

  const fetchQuotaLimit = () => {
    fetch('http://localhost:8080/api/admin/kyc/quota')
      .then(res => res.json())
      .then(data => {
        if (data && data.quota) {
          setQuotaLimit(data.quota);
        }
      })
      .catch(console.error);
  };

  const handleUpdateQuota = () => {
    const newVal = window.prompt('Nhập giới hạn Request VNPT eKYC mới:', quotaLimit);
    if (newVal !== null && !isNaN(newVal) && Number(newVal) >= 0) {
      fetch('http://localhost:8080/api/admin/kyc/quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quota: Number(newVal) })
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.quota) setQuotaLimit(data.quota);
        })
        .catch(console.error);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchQuotaLimit();
  }, []);

  const exportCsv = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/dashboard/api-stats/all`);
      const allData = await res.json();
      const header = 'Ten Api,Duong dan,Tong so,Thanh cong,Loi dau vao (400),Loi khach hang,Loi he thong\n';
      const rows = allData.map(a =>
        `"${a.name}","${a.path}",${a.total},${a.success},${a.error400},${a.errorCustomer},${a.errorSystem}`
      ).join('\n');
      const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'bang_thong_ke_tan_suat_api.csv'; a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
    }
  };
const getLoggedInEmail = () => {
    if (currentUser?.email) return currentUser.email;
    try { const p = JSON.parse(localStorage.getItem('user') || '{}'); if (p.email) return p.email; } catch {}
    return 'admin@system.com';
  };

  const nowStr = `${String(today.getHours()).padStart(2,'0')}:${String(today.getMinutes()).padStart(2,'0')}, ${fmt(today)}`;
  const nowHour = today.getHours();

  // Chart data for volume
  const volumeLabels = Array.from({ length: 4 }, (_, i) => String(Math.max(0, nowHour - 3 + i)).padStart(2, '0'));
  const volumeValues = stats.total === 0 
    ? [0, 0, 0, 0] 
    : [Math.floor(stats.total * 0.1), Math.floor(stats.total * 0.4), Math.floor(stats.total * 0.7), stats.total];

  const volumeChartData = {
    labels: volumeLabels,
    datasets: [{
      label: 'Luot yeu cau API',
      data: volumeValues,
      borderColor: '#2563eb',
      backgroundColor: 'rgba(59,130,246,0.12)',
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#2563eb',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 5,
    }]
  };

  const volumeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: {
        title: { display: true, text: 'Hour', font: { size: 12, family: 'Inter, sans-serif' }, color: '#374151' },
        grid: { color: '#e5e7eb' },
        ticks: { color: '#374151', font: { size: 11 } },
      },
      y: {
        title: { display: true, text: 'Luot yeu cau API', font: { size: 12, family: 'Inter, sans-serif' }, color: '#374151' },
        beginAtZero: true,
        grid: { color: '#e5e7eb' },
        ticks: { color: '#374151', font: { size: 11 } },
      }
    }
  };

  // Error chart data
  const errorChartLabels = selectedErrorCodes.length > 0
    ? selectedErrorCodes.map(c => c)
    : ERROR_CODES.slice(0, 7).map(e => e.code);

  const errChartData = {
    labels: errorChartLabels,
    datasets: [{
      label: 'So luong loi',
      data: errorChartLabels.map(() => 0),
      borderColor: '#059669',
      backgroundColor: 'rgba(5,150,105,0.15)',
      fill: true,
      tension: 0.35,
      pointBackgroundColor: '#059669',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4,
    }]
  };

  const errChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
    scales: {
      x: { grid: { color: '#e5e7eb' }, ticks: { color: '#374151', font: { size: 11 } } },
      y: { beginAtZero: true, max: 1, grid: { color: '#e5e7eb' }, ticks: { color: '#374151', font: { size: 11 }, stepSize: 0.1 } }
    }
  };

  // Pagination
  

  const toggleErrorCode = (code) => {
    setSelectedErrorCodes(prev =>
      prev.includes(code) ? prev.filter(c => c !== code) : prev.length < 7 ? [...prev, code] : prev
    );
  };

  const renderPager = (page, total, onChange) => {
    let pages = [];
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (page <= 4) {
        pages = [1, 2, 3, 4, 5, '...', total];
      } else if (page >= total - 3) {
        pages = [1, '...', total - 4, total - 3, total - 2, total - 1, total];
      } else {
        pages = [1, '...', page - 1, page, page + 1, '...', total];
      }
    }
    return (
      <div className="flex items-center gap-1">
        <button onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40">«</button>
        {pages.map((p, i) => p === '...'
          ? <span key={i} className="px-1 text-gray-400 text-xs">...</span>
          : <button key={i} onClick={() => onChange(p)}
              className={`w-7 h-7 flex items-center justify-center rounded text-xs font-semibold transition-colors ${page === p ? 'bg-[#059669] text-white' : 'border border-gray-300 text-gray-600 hover:bg-gray-100'}`}>{p}</button>
        )}
        <button onClick={() => onChange(Math.min(total, page + 1))} disabled={page === total}
          className="w-7 h-7 flex items-center justify-center rounded border border-gray-300 text-xs text-gray-500 hover:bg-gray-100 disabled:opacity-40">»</button>
      </div>
    );
  };

  return (
    <div className="p-5 space-y-5 max-w-7xl mx-auto font-sans bg-white min-h-screen" style={{ fontFamily: 'Inter, Segoe UI, sans-serif' }}>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#1b3b22] via-[#2d5a32] to-[#386641] p-6 rounded-xl text-white shadow-md">
        <div>
          <div className="text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-1">
            Admin Control Panel &bull; VNPT eKYC Engine v3.2.1
          </div>
          <h1 className="text-xl font-bold text-white">Dashboard Thong ke Loi API</h1>
          <p className="text-sm text-emerald-100 mt-0.5">Theo doi loi API, tan suat goi tu VNPT eKYC AI Engine</p>
        </div>
        <button
          onClick={() => setIsEkycModalOpen(true)}
          className="px-5 py-2.5 bg-white hover:bg-emerald-50 text-[#1b3b22] font-bold text-sm rounded-lg shadow transition-all flex items-center gap-2 self-start md:self-auto"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
          Thuc hien VNPT eKYC Live Scan
        </button>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Tong so', value: stats.total, subLabel: (
              <span className="cursor-pointer hover:text-blue-500" onClick={handleUpdateQuota} title="Nhấn để thay đổi giới hạn">
                So Request kha dung {Math.max(0, quotaLimit - stats.success).toLocaleString('vi-VN')} ✎
              </span>
            ), icon: (
            <svg className="w-10 h-10 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          ), labelColor: 'text-gray-700' },
          { label: 'Thanh cong', value: stats.success, icon: (
            <svg className="w-10 h-10 text-[#059669]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" /></svg>
          ), labelColor: 'text-[#059669] font-bold' },
          { label: 'Loi khach hang', value: stats.errCustomer, hasInfo: true, icon: (
            <svg className="w-10 h-10 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          ), labelColor: 'text-rose-600 font-bold' },
          { label: 'Loi he thong', value: stats.errSystem, hasInfo: true, icon: (
            <svg className="w-10 h-10 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
          ), labelColor: 'text-amber-500 font-bold' },
        ].map((card, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center justify-between shadow-sm">
            <div>
              <p className={`text-xs ${card.labelColor || 'text-gray-500'} flex items-center gap-1`}>
                {card.label}
                {card.hasInfo && <span className="w-3.5 h-3.5 rounded-full border border-current text-[9px] flex items-center justify-center font-black cursor-help leading-none">?</span>}
              </p>
              <h3 className="text-3xl font-bold text-gray-900 mt-1">{card.value}</h3>
              {card.subLabel && <p className="text-[10px] text-gray-400 mt-2 italic">{card.subLabel}</p>}
            </div>
            <div>{card.icon}</div>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200">
        <div className="flex gap-0">
          {[
            { key: 'volume', label: 'Bieu do so luong' },
            { key: 'error', label: 'Bieu do thong ke loi' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#059669] text-[#059669]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{tab.label}</button>
          ))}
        </div>
      </div>

      {/* TAB: BIEU DO SO LUONG */}
      {activeTab === 'volume' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-gray-700">Bieu do so luong</h3>
            <span className="text-xs text-gray-400">Ngay cap nhat: {nowStr}</span>
          </div>
          <div style={{ height: '240px' }}>
            <Line data={volumeChartData} options={volumeChartOptions} />
          </div>
        </div>
      )}

      {/* TAB: BIEU DO THONG KE LOI */}
      {activeTab === 'error' && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm space-y-4">
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-sm font-bold text-gray-700 mr-2">Bieu do thong ke loi</h3>
            <select
              value={dateMode}
              onChange={e => setDateMode(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-[#059669]"
            >
              <option>Ngay</option>
              <option>Tuan</option>
              <option>Thang</option>
            </select>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span>Tu ngay</span>
              <div className="relative">
                <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
                  className="border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-[#059669] pr-7" />
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600">
              <span>Den ngay</span>
              <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1.5 text-xs text-gray-700 outline-none focus:ring-1 focus:ring-[#059669]" />
            </div>
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#059669] hover:bg-[#047857] text-white text-xs font-semibold rounded transition-colors">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              Tim kiem
            </button>
            <button
              onClick={() => setShowErrorCodeModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-[#059669] text-[#059669] hover:bg-emerald-50 text-xs font-semibold rounded transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"/></svg>
              Ma loi
            </button>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Bieu do</h4>
            <div style={{ height: '260px' }}>
              <Line data={errChartData} options={errChartOptions} />
            </div>
          </div>
        </div>
      )}

      {/* BANG THONG KE TAN SUAT API */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-200">
          <h3 className="text-sm font-bold text-gray-700">Bang thong ke tan suat API</h3>
          <button
            onClick={exportCsv}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#059669] hover:bg-[#047857] text-white font-bold text-xs rounded-lg transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            XUAT EXCEL
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="py-3 px-4 font-semibold text-gray-600">Ten Api</th>
                <th className="py-3 px-4 font-semibold text-[#2563eb]">Duong dan</th>
                <th className="py-3 px-4 text-center font-semibold text-gray-600">Tong so</th>
                <th className="py-3 px-4 text-center font-semibold text-gray-600">Thanh cong</th>
                <th className="py-3 px-4 text-center font-semibold text-gray-600">Loi dau vao (400)</th>
                <th className="py-3 px-4 text-center font-semibold text-rose-600">Loi khach hang</th>
                <th className="py-3 px-4 text-center font-semibold text-amber-600">Loi he thong</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pageData.map((api, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="py-2.5 px-4 text-gray-800">{api.name}</td>
                  <td className="py-2.5 px-4 text-[#2563eb] font-mono">{api.path}</td>
                  <td className="py-2.5 px-4 text-center font-medium">{api.total > 0 ? <span className="text-[#2563eb]">{api.total}</span> : api.total}</td>
                  <td className="py-2.5 px-4 text-center font-medium">{api.success > 0 ? <span className="text-[#2563eb]">{api.success}</span> : api.success}</td>
                  <td className="py-2.5 px-4 text-center">{api.error400}</td>
                  <td className="py-2.5 px-4 text-center font-medium">{api.errorCustomer > 0 ? <span className="text-rose-600">{api.errorCustomer}</span> : api.errorCustomer}</td>
                  <td className="py-2.5 px-4 text-center font-medium">{api.errorSystem > 0 ? <span className="text-amber-600">{api.errorSystem}</span> : api.errorSystem}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-gray-200">
          <span className="text-xs text-gray-400 mr-2">Tong {totalElements} API</span>
          {renderPager(apiPage, totalPages, setApiPage)}
        </div>
      </div>

      {/* MODAL MA LOI */}
      {showErrorCodeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b border-gray-200">
              <h3 className="font-bold text-gray-800 text-base">Vui long lua chon ma loi can thong ke</h3>
              <button onClick={() => setShowErrorCodeModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold leading-none">x</button>
            </div>
            <div className="p-5">
              <p className="text-xs text-rose-600 mb-4">* Luu y: Duoc phep chon toi da 7 ma loi</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-3">
                {ERROR_CODES.map(ec => (
                  <label key={ec.code} className="flex items-center gap-2 cursor-pointer text-xs text-gray-700 hover:text-gray-900">
                    <input
                      type="checkbox"
                      checked={selectedErrorCodes.includes(ec.code)}
                      onChange={() => toggleErrorCode(ec.code)}
                      className="accent-[#059669] w-3.5 h-3.5"
                    />
                    <span>{ec.code} ({ec.label})</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex justify-center p-4 border-t border-gray-200">
              <button
                onClick={() => setShowErrorCodeModal(false)}
                className="px-8 py-2 bg-[#059669] hover:bg-[#047857] text-white font-bold text-sm rounded-lg transition-colors"
              >
                Ap dung
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VNPT eKYC Modal */}
      <VnPteKycModal
        isOpen={isEkycModalOpen}
        onClose={() => setIsEkycModalOpen(false)}
        onComplete={(res) => {
          console.log("KYC completed", res);
          fetchDashboardStats();
        }}
        userEmail={getLoggedInEmail()}
      />
    </div>
  );
};

export default AdminKycManagement;
