import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText,
    Search,
    Printer,
    Download,
    Eye,
    Receipt,
    Coins,
    Calendar,
    CheckCircle2,
    Loader2,
    AlertCircle,
    X,
    Building2,
    ShieldCheck,
    CreditCard,
    ArrowUpDown,
    RefreshCw,
    ChevronLeft,
    ChevronRight
} from 'lucide-react';

const sanitizeDescription = (text) => {
    if (!text) return 'Thanh toán gói dịch vụ LancerPro';
    return text
        .replace(/d\?ch v\?/gi, 'dịch vụ')
        .replace(/Doanh nghi\?p/gi, 'Doanh nghiệp')
        .replace(/N\?p ti\?n/gi, 'Nạp tiền')
        .replace(/t\?i khoản/gi, 'tài khoản')
        .replace(/d\? án/gi, 'dự án')
        .replace(/N\?i b\?t/gi, 'Nổi bật')
        .replace(/N\?i bật/gi, 'Nổi bật');
};

export default function EmployerInvoices({ user }) {
    const employerId = user?.id || user?.employerId || user?.userId;

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState(null);

    // Backend Pagination States
    const [page, setPage] = useState(0);
    const [pageSize] = useState(5);
    const [totalPages, setTotalPages] = useState(1);
    const [totalElements, setTotalElements] = useState(0);



    const fetchInvoices = async (targetPage = page) => {
        setLoading(true);
        setError(null);
        try {
            if (employerId) {
                const response = await fetch(`http://localhost:8080/api/payment/invoices/employer/${employerId}?page=${targetPage}&size=${pageSize}&search=${encodeURIComponent(searchTerm)}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data && Array.isArray(data.content)) {
                        setInvoices(data.content);
                        setTotalPages(data.totalPages || 1);
                        setTotalElements(data.totalElements || data.content.length);
                        setPage(data.number || 0);
                        setLoading(false);
                        return;
                    } else if (Array.isArray(data) && data.length > 0) {
                        const sortedData = [...data].sort((a, b) => new Date(b.issuedAt) - new Date(a.issuedAt));
                        setInvoices(sortedData);
                        setTotalPages(1);
                        setTotalElements(data.length);
                        setPage(0);
                        setLoading(false);
                        return;
                    }
                }
            }
            // API trả về rỗng hoặc không có employer — hiển thị empty state
            setInvoices([]);
            setTotalPages(1);
            setTotalElements(0);
            setPage(0);
        } catch (err) {
            console.error("Fetch invoices error:", err);
            setError('Không thể tải danh sách hóa đơn. Vui lòng thử lại sau.');
            setInvoices([]);
            setTotalPages(1);
            setTotalElements(0);
            setPage(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices(0);
    }, [employerId]);

    // Invoices are already filtered by the backend search
    const filteredInvoices = invoices;

    // Optional: add a debounce effect to auto-search when searchTerm changes
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchInvoices(0);
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Statistics
    const totalAmountSpent = useMemo(() => {
        return invoices.reduce((sum, inv) => sum + Number(inv.totalAmount || inv.amount || 0), 0);
    }, [invoices]);

    const latestInvoice = useMemo(() => {
        if (!invoices.length) return null;
        return invoices[0];
    }, [invoices]);

    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '0 ₫';
        return Number(val).toLocaleString('vi-VN') + ' ₫';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const [employerProfile, setEmployerProfile] = useState(null);

    useEffect(() => {
        if (employerId) {
            fetch(`http://localhost:8080/api/employers/${employerId}/profile`)
                .then(res => res.json())
                .then(data => setEmployerProfile(data))
                .catch(err => console.error(err));
        }
    }, [employerId]);

    const handlePrint = (invoice) => {
        setSelectedInvoice(invoice);
        setTimeout(() => {
            window.print();
        }, 300);
    };

    const issueInvoice = async (invoiceId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xuất hóa đơn điện tử cho giao dịch này không?")) return;
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/payment/invoices/${invoiceId}/issue`, {
                method: 'POST'
            });
            const data = await response.json();
            if (response.ok) {
                alert(`Xuất hóa đơn thành công! Số HĐ: ${data.invoiceNo}`);
                fetchInvoices(page);
            } else {
                alert(`Lỗi xuất hóa đơn: ${data.message || 'Lỗi không xác định'}`);
            }
        } catch (err) {
            alert(`Lỗi kết nối: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadPdf = async (invoiceId, viettelInvoiceNo) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/payment/invoices/${invoiceId}/pdf`);
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `HoaDon_${viettelInvoiceNo}.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            } else {
                const text = await response.text();
                alert(`Lỗi tải PDF: ${text}`);
            }
        } catch (err) {
            alert(`Lỗi kết nối: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const sendEmail = async (invoiceId) => {
        if (!window.confirm("Gửi hóa đơn điện tử PDF về email đăng ký của bạn?")) return;
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/payment/invoices/${invoiceId}/email`, {
                method: 'POST'
            });
            const data = await response.json();
            if (response.ok) {
                alert('Đã gửi yêu cầu gửi email thành công!');
            } else {
                alert(`Lỗi gửi email: ${data.message || 'Lỗi không xác định'}`);
            }
        } catch (err) {
            alert(`Lỗi kết nối: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-3">
            {/* Header & Metrics Master Bar */}
            <div className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-level-1 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-slate-900">Quản lý Hóa đơn & Chứng từ</h2>
                            <p className="text-[11px] text-slate-500 font-medium">
                                Chứng từ thanh toán gói dịch vụ, nạp tiền và đăng tin tuyển dụng.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Search Bar */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Tìm mã hóa đơn, nội dung..."
                                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                            />
                        </div>

                        <button
                            onClick={() => fetchInvoices(page)}
                            disabled={loading}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all disabled:opacity-50 flex-none"
                            title="Làm mới dữ liệu"
                        >
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                            <span className="hidden sm:inline">Làm mới</span>
                        </button>
                    </div>
                </div>

                {/* Compact Statistics Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between px-3 py-2 bg-blue-50/70 border border-blue-200/80 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-blue-800">Gói hiện tại:</span>
                        </div>
                        <span className="text-xs font-black text-blue-900 uppercase">
                            {employerProfile?.currentPackageType || 'CHƯA MUA GÓI'} (Còn {employerProfile?.packagePostQuota || 0} bài)
                        </span>
                    </div>

                    <div className="flex items-center justify-between px-3 py-2 bg-emerald-50/60 border border-emerald-200/80 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Coins className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-emerald-800">Tổng đã chi:</span>
                        </div>
                        <span className="text-xs font-black text-emerald-700">{formatCurrency(employerProfile?.totalSpent || totalAmountSpent)}</span>
                    </div>

                    <div className="flex items-center justify-between px-3 py-2 bg-purple-50/60 border border-purple-200/80 rounded-xl">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-purple-600" />
                            <span className="text-xs font-bold text-purple-800">Tổng chứng từ:</span>
                        </div>
                        <span className="text-xs font-black text-purple-900">{totalElements || invoices.length} hóa đơn</span>
                    </div>
                </div>
            </div>

            {/* Table Container - Fits 100% horizontally without scrollbar */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-level-1 overflow-hidden">
                {/* Table Content */}
                {loading ? (
                    <div className="p-8 text-center text-slate-500 space-y-2">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                        <p className="text-xs font-semibold">Đang tải danh sách hóa đơn...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 text-center text-rose-600 space-y-1">
                        <AlertCircle className="w-6 h-6 mx-auto" />
                        <p className="text-xs font-bold">{error}</p>
                        <button
                            onClick={() => fetchInvoices(page)}
                            className="text-xs font-bold text-emerald-600 underline hover:text-emerald-700"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : filteredInvoices.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 space-y-2">
                        <Receipt className="w-10 h-10 mx-auto stroke-1 text-slate-300" />
                        <p className="text-xs font-bold text-slate-600">Không tìm thấy hóa đơn nào</p>
                        <p className="text-[11px] text-slate-400">
                            {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm.' : 'Hóa đơn sẽ xuất hiện sau khi bạn nạp tiền hoặc mua gói dịch vụ.'}
                        </p>
                    </div>
                ) : (
                    <>
                        <table className="w-full text-left border-collapse table-fixed">
                            <thead className="bg-slate-50">
                                <tr className="text-slate-500 text-[10px] uppercase font-extrabold tracking-wider border-b border-slate-200">
                                    <th className="py-2.5 px-3 w-[16%]">Mã Hóa đơn</th>
                                    <th className="py-2.5 px-3 w-[26%]">Nội dung dịch vụ</th>
                                    <th className="py-2.5 px-3 w-[11%] text-right">Số tiền gốc</th>
                                    <th className="py-2.5 px-3 w-[10%] text-right">Thuế VAT</th>
                                    <th className="py-2.5 px-3 w-[13%] text-right">Tổng thanh toán</th>
                                    <th className="py-2.5 px-3 w-[11%]">Ngày lập</th>
                                    <th className="py-2.5 px-3 w-[13%] text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
                                {filteredInvoices.map((invoice) => (
                                    <tr key={invoice.invoiceId} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="py-2.5 px-3 font-bold text-slate-900 truncate">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md text-[11px] font-mono border border-slate-200 inline-block truncate max-w-full">
                                                {invoice.invoiceNumber}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-700 truncate" title={sanitizeDescription(invoice.description)}>
                                            {sanitizeDescription(invoice.description)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-slate-600 truncate">
                                            {formatCurrency(invoice.amount)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right text-slate-500 truncate">
                                            {formatCurrency(invoice.taxAmount)}
                                        </td>
                                        <td className="py-2.5 px-3 text-right font-bold text-emerald-600 truncate">
                                            {formatCurrency(invoice.totalAmount)}
                                        </td>
                                        <td className="py-2.5 px-3 text-slate-500 truncate text-[11px]">
                                            {formatDate(invoice.issuedAt)}
                                        </td>
                                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-1">
                                                {!invoice.viettelInvoiceNo ? (
                                                    <button
                                                        onClick={() => issueInvoice(invoice.invoiceId)}
                                                        className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
                                                        title="Phát hành Hóa đơn điện tử Viettel"
                                                    >
                                                        <FileText className="w-3 h-3" />
                                                        <span>Xuất HĐĐT</span>
                                                    </button>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => downloadPdf(invoice.invoiceId, invoice.viettelInvoiceNo)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
                                                            title="Tải PDF bản gốc (Viettel)"
                                                        >
                                                            <Download className="w-3 h-3" />
                                                            <span>PDF gốc</span>
                                                        </button>
                                                        <button
                                                            onClick={() => sendEmail(invoice.invoiceId)}
                                                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-bold transition-all shadow-sm"
                                                            title="Gửi PDF qua Email"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                                                            <span>Email</span>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setSelectedInvoice(invoice)}
                                                    className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-bold transition-all"
                                                    title="Xem bản thể hiện web"
                                                >
                                                    <Eye className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Backend Pagination Footer */}
                        <div className="px-4 py-2 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-medium">
                            <span>
                                Hiển thị <b>{invoices.length}</b> / <b>{totalElements || invoices.length}</b> hóa đơn (Trang {page + 1} / {totalPages || 1})
                            </span>
                            <div className="flex items-center gap-1.5">
                                <button
                                    onClick={() => fetchInvoices(page - 1)}
                                    disabled={page === 0 || loading}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all text-xs"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>Trước</span>
                                </button>
                                <span className="px-2.5 py-1 bg-slate-200/80 rounded-md font-mono font-bold text-slate-800 text-[11px]">
                                    {page + 1} / {totalPages || 1}
                                </span>
                                <button
                                    onClick={() => fetchInvoices(page + 1)}
                                    disabled={page >= totalPages - 1 || loading}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition-all text-xs"
                                >
                                    <span>Sau</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Invoice Printable Detail Modal */}
            {selectedInvoice && (
                <PrintableInvoiceModal
                    invoice={selectedInvoice}
                    user={user}
                    onClose={() => setSelectedInvoice(null)}
                />
            )}
        </div>
    );
}

// Subcomponent: Formatted Printable E-Invoice Modal
function PrintableInvoiceModal({ invoice, user, onClose }) {
    const formatCurrency = (val) => {
        if (val === undefined || val === null) return '0 ₫';
        return Number(val).toLocaleString('vi-VN') + ' ₫';
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'N/A';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('vi-VN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch (e) {
            return dateStr;
        }
    };

    const handleWindowPrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
            {/* Print CSS rules to target only invoice container when window.print is called */}
            <style media="print">{`
                @page { size: auto; margin: 15mm; }
                body * { visibility: hidden; }
                #printable-invoice-container, #printable-invoice-container * { visibility: visible; }
                #printable-invoice-container {
                    position: absolute;
                    left: 0;
                    top: 0;
                    width: 100%;
                    padding: 0;
                    margin: 0;
                    box-shadow: none !important;
                    border: none !important;
                }
                .no-print { display: none !important; }
            `}</style>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden my-8">
                {/* Modal Header Actions (No print) */}
                <div className="no-print bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        <span className="font-bold text-sm">Hóa đơn điện tử LancerPro</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleWindowPrint}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all"
                        >
                            <Printer className="w-3.5 h-3.5" />
                            <span>In / Tải về (PDF)</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Printable Invoice Card */}
                <div id="printable-invoice-container" className="p-8 space-y-6 bg-white text-slate-900 font-sans">
                    {/* Header: Company & E-Invoice Logo */}
                    <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-black text-lg">
                                    L
                                </div>
                                <span className="text-xl font-black tracking-tight text-slate-900">LancerPro</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2 font-medium">Sàn Giao dịch Việc làm Freelance Chuyên nghiệp</p>
                            <p className="text-[11px] text-slate-500">MST: 0109988776 - CTY TNHH LANCERPRO VIỆT NAM</p>
                            <p className="text-[11px] text-slate-500">Địa chỉ: Tầng 8, Tòa nhà Công nghệ, Q. Cầu Giấy, Hà Nội</p>
                        </div>
                        <div className="text-right">
                            <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-extrabold rounded-lg border border-emerald-200 uppercase tracking-wider mb-2">
                                HÓA ĐƠN ĐIỆN TỬ
                            </span>
                            <p className="text-xs font-bold text-slate-900 font-mono">Mã HĐ: {invoice.invoiceNumber}</p>
                            <p className="text-[11px] text-slate-500">Mã GD: #{invoice.transactionId}</p>
                            <p className="text-[11px] text-slate-500">Ngày lập: {formatDate(invoice.issuedAt)}</p>
                        </div>
                    </div>

                    {/* Invoice Title */}
                    <div className="text-center py-2">
                        <h1 className="text-xl font-black text-slate-900 uppercase tracking-wide">HÓA ĐƠN BÁN HÀNG & DỊCH VỤ</h1>
                        <p className="text-xs text-slate-500 mt-0.5 font-medium">(Bản thể hiện của hóa đơn điện tử)</p>
                    </div>

                    {/* Customer & Company Details */}
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl text-xs border border-slate-200">
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">ĐƠN VỊ THU HƯỞNG</span>
                            <p className="font-bold text-slate-900">Công ty TNHH LancerPro Việt Nam</p>
                            <p className="text-slate-600 text-[11px] mt-0.5">Email: support@lancerpro.vn</p>
                            <p className="text-slate-600 text-[11px]">Hotline: 1900 6868</p>
                        </div>
                        <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider mb-1">KHÁCH HÀNG (NHÀ TUYỂN DỤNG)</span>
                            <p className="font-bold text-slate-900">{user?.companyName || user?.name || user?.fullName || 'Khách hàng Employer'}</p>
                            <p className="text-slate-600 text-[11px] mt-0.5">Email: {user?.email || 'N/A'}</p>
                            <p className="text-slate-600 text-[11px]">Mã Employer: #{invoice.employerId}</p>
                        </div>
                    </div>

                    {/* Itemized Table */}
                    <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                                    <th className="py-2.5 px-3 w-12 text-center">STT</th>
                                    <th className="py-2.5 px-3">Tên hàng hóa, dịch vụ</th>
                                    <th className="py-2.5 px-3 text-center">ĐVT</th>
                                    <th className="py-2.5 px-3 text-center">SL</th>
                                    <th className="py-2.5 px-3 text-right">Đơn giá</th>
                                    <th className="py-2.5 px-3 text-right">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                <tr>
                                    <td className="py-3 px-3 text-center font-bold text-slate-500">1</td>
                                    <td className="py-3 px-3 font-semibold text-slate-800">
                                        {sanitizeDescription(invoice.description)}
                                    </td>
                                    <td className="py-3 px-3 text-center text-slate-500">Gói</td>
                                    <td className="py-3 px-3 text-center text-slate-500">1</td>
                                    <td className="py-3 px-3 text-right text-slate-600">{formatCurrency(invoice.amount)}</td>
                                    <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(invoice.amount)}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    {/* Tax & Total Summary */}
                    <div className="flex justify-end">
                        <div className="w-full sm:w-72 space-y-2 text-xs">
                            <div className="flex justify-between text-slate-600">
                                <span>Cộng tiền hàng:</span>
                                <span className="font-semibold">{formatCurrency(invoice.amount)}</span>
                            </div>
                            <div className="flex justify-between text-slate-600">
                                <span>Thuế GTGT (VAT):</span>
                                <span className="font-semibold">{formatCurrency(invoice.taxAmount)}</span>
                            </div>
                            <div className="flex justify-between border-t border-slate-200 pt-2 text-slate-900 font-black text-sm">
                                <span>Tổng tiền thanh toán:</span>
                                <span className="text-emerald-600">{formatCurrency(invoice.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Verification Seal & Signatures */}
                    <div className="border-t border-slate-200 pt-6 grid grid-cols-2 gap-6 text-center text-xs">
                        <div>
                            <p className="font-bold text-slate-700 uppercase">Khách hàng thanh toán</p>
                            <p className="text-[10px] text-slate-400 italic mt-0.5">(Ký, ghi rõ họ tên)</p>
                            <div className="h-16 flex items-center justify-center mt-2">
                                <span className="text-slate-400 text-xs font-semibold">{user?.companyName || user?.name || 'Đã xác nhận'}</span>
                            </div>
                        </div>

                        <div>
                            <p className="font-bold text-slate-700 uppercase">Đơn vị cung cấp dịch vụ</p>
                            <p className="text-[10px] text-slate-400 italic mt-0.5">(Ký điện tử bằng CA)</p>
                            <div className="mt-2 inline-flex flex-col items-center p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-emerald-800 text-[10px] font-bold">
                                <div className="flex items-center gap-1 text-emerald-700">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>LANCERPRO E-INVOICE SEAL</span>
                                </div>
                                <span className="text-[9px] font-normal text-emerald-600 mt-0.5">Xác thực điện tử thành công</span>
                                <span className="text-[9px] font-mono text-emerald-700">{formatDate(invoice.issuedAt)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Footer Note */}
                    <div className="border-t border-slate-100 pt-4 text-center text-[10px] text-slate-400">
                        Cảm ơn quý khách đã sử dụng dịch vụ của LancerPro. Hóa đơn điện tử này có giá trị pháp lý theo quy định hiện hành.
                    </div>
                </div>

                {/* Modal Bottom Actions (No print) */}
                <div className="no-print bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-medium">Bấm "In / Tải về" để lưu dưới dạng PDF hoặc in giấy.</span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleWindowPrint}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
                        >
                            <Printer className="w-4 h-4" />
                            <span>In Hóa đơn</span>
                        </button>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
