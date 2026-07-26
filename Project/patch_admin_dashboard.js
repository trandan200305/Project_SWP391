const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'backend', '..', 'frontend', 'src', 'features', 'admin', 'pages', 'AdminDashboardPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Add states
const statesToInject = `
  const [transferRequests, setTransferRequests] = useState([]);
  const [selectedTransferRequest, setSelectedTransferRequest] = useState(null);
  const [showTransferDetailModal, setShowTransferDetailModal] = useState(false);
`;
content = content.replace(/(const \[showTransferModal, setShowTransferModal\] = useState\(false\);)/, `$1${statesToInject}`);

// 2. Add fetch function and effect
const effectToInject = `
  const fetchTransferRequests = () => {
    adminApi.getTransferRequests()
      .then(data => {
        if (Array.isArray(data)) setTransferRequests(data);
      })
      .catch(err => console.error("Error fetching transfer requests:", err));
  };

  useEffect(() => {
    fetchTransferRequests();
  }, []);

  useEffect(() => {
    const handleOpenDetail = (e) => {
      const { requestId } = e.detail;
      const found = transferRequests.find(r => r.requestId === requestId);
      if (found) {
        setSelectedTransferRequest(found);
        setShowTransferDetailModal(true);
      } else {
        adminApi.getTransferRequests()
          .then(data => {
            if (Array.isArray(data)) {
              setTransferRequests(data);
              const foundAgain = data.find(r => r.requestId === requestId);
              if (foundAgain) {
                setSelectedTransferRequest(foundAgain);
                setShowTransferDetailModal(true);
              }
            }
          });
      }
    };
    window.addEventListener('openTransferRequestDetail', handleOpenDetail);
    return () => window.removeEventListener('openTransferRequestDetail', handleOpenDetail);
  }, [transferRequests]);

  const handleApproveTransferRequest = async (requestId) => {
    try {
      await adminApi.approveTransferRequest(requestId, 'APPROVED', 'Đã duyệt yêu cầu điều chuyển');
      showToast('Đã duyệt đơn điều chuyển thành công!', 'success');
      setShowTransferDetailModal(false);
      fetchTransferRequests();
    } catch (error) {
      showToast('Lỗi khi duyệt đơn', 'error');
    }
  };

  const handleRejectTransferRequest = async (requestId) => {
    try {
      await adminApi.approveTransferRequest(requestId, 'REJECTED', 'Từ chối yêu cầu điều chuyển');
      showToast('Đã từ chối đơn điều chuyển!', 'success');
      setShowTransferDetailModal(false);
      fetchTransferRequests();
    } catch (error) {
      showToast('Lỗi khi từ chối đơn', 'error');
    }
  };

  const parseReason = (reasonStr) => {
    try {
      const parsed = JSON.parse(reasonStr);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (e) {
      return { reason: reasonStr };
    }
    return { reason: reasonStr };
  };
`;
// Insert after useEffects at the top, or right before handleLogout
content = content.replace(/(const handleLogout = \(\) => \{)/, `${effectToInject}\n  $1`);

// 3. Add the UI Modal
const uiToInject = `
      {showTransferDetailModal && selectedTransferRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#090d16]/55 backdrop-blur-md px-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl shadow-2xl border border-[#e2eafc] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 bg-gradient-to-r from-slate-50 to-white border-b border-[#e2eafc]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-sm">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-[17px] font-extrabold text-[#111827] text-left">
                    Chi tiết đơn điều chuyển
                  </h2>
                  <p className="text-[12px] text-slate-400 font-semibold mt-0.5 text-left">
                    Mã số đơn: <span className="text-[#006b2c] font-bold">#REQ-{selectedTransferRequest.requestId}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setShowTransferDetailModal(false);
                  setSelectedTransferRequest(null);
                }}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar space-y-6 text-left">
              {/* SECTION 1: THÔNG TIN NHÂN VIÊN */}
              <div>
                <h3 className="text-body-md font-extrabold text-[#006b2c] flex items-center gap-2 mb-3.5 border-b border-slate-100 pb-2">
                  <User className="w-4.5 h-4.5" />
                  Thông tin nhân viên
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Mã nhân viên</span>
                    <span className="text-body-sm font-extrabold text-slate-700">FP-{selectedTransferRequest.requestId}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Họ và tên</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{selectedTransferRequest.userDisplayName || 'Nhân viên'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Phòng ban hiện tại</span>
                    <span className="text-body-sm font-extrabold text-emerald-700">{selectedTransferRequest.fromDepartment || 'Chưa rõ'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Email liên hệ</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{selectedTransferRequest.userEmail}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 2: THÔNG TIN ĐIỀU CHUYỂN */}
              <div>
                <h3 className="text-body-md font-extrabold text-[#006b2c] flex items-center gap-2 mb-3.5 border-b border-slate-100 pb-2">
                  <ArrowRight className="w-4.5 h-4.5" />
                  Thông tin điều chuyển phòng ban
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/30 border border-blue-100/50 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)] col-span-2">
                    <span className="text-[10px] font-extrabold text-blue-600 tracking-wider block mb-0.5 uppercase">Phòng ban muốn chuyển đến</span>
                    <span className="text-body-sm font-extrabold text-blue-700">{selectedTransferRequest.toDepartment || 'Chưa rõ'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Vị trí mong muốn</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{parseReason(selectedTransferRequest.reason).desiredPosition || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)]">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Ngày mong muốn bắt đầu</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{parseReason(selectedTransferRequest.reason).startDate || 'Chưa cung cấp'}</span>
                  </div>
                  <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.01)] col-span-2">
                    <span className="text-[10px] font-extrabold text-slate-400 tracking-wider block mb-0.5 uppercase">Loại điều chuyển</span>
                    <span className="text-body-sm font-extrabold text-slate-700">{parseReason(selectedTransferRequest.reason).transferType || 'Chưa cung cấp'}</span>
                  </div>
                </div>
              </div>

              {/* SECTION 3: LÝ DO ĐIỀU CHUYỂN */}
              <div>
                <h3 className="text-body-md font-extrabold text-[#006b2c] flex items-center gap-2 mb-3.5 border-b border-slate-100 pb-2">
                  <FileText className="w-4.5 h-4.5" />
                  Lý do điều chuyển
                </h3>
                <div className="bg-[#fcfdfe] border border-[#e2e8f0]/60 rounded-xl p-4 leading-relaxed text-body-sm text-slate-700 font-medium border-l-4 border-l-[#006b2c] shadow-[0_2px_10px_rgba(0,0,0,0.01)] whitespace-pre-wrap">
                  {parseReason(selectedTransferRequest.reason).reason || 'Không có lý do chi tiết.'}
                </div>
              </div>

            </div>
            
            {/* Modal Footer */}
            <div className="p-5 border-t border-[#e2eafc] bg-slate-50 flex items-center justify-end gap-3 mt-auto shrink-0">
              <button
                onClick={() => {
                  setShowTransferDetailModal(false);
                  setSelectedTransferRequest(null);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-body-sm text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-slate-800 transition-all shadow-sm"
              >
                Đóng
              </button>
              {selectedTransferRequest.status === 'PENDING' && (
                <>
                  <button
                    onClick={() => handleRejectTransferRequest(selectedTransferRequest.requestId)}
                    className="px-5 py-2.5 rounded-xl font-bold text-body-sm text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition-all shadow-sm flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    Từ chối
                  </button>
                  <button
                    onClick={() => handleApproveTransferRequest(selectedTransferRequest.requestId)}
                    className="px-6 py-2.5 rounded-xl font-bold text-body-sm text-white bg-emerald-600 hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Duyệt đơn
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
`;

content = content.replace(/(<div className="fixed bottom-0 right-0 p-6 z-50">)/, `${uiToInject}\n      $1`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('AdminDashboardPage.jsx successfully patched.');
