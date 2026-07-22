import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

const formatAmountInput = (val) => {
    if (val === null || val === undefined || val === '') return '';
    const raw = String(val).replace(/\D/g, '');
    if (!raw) return '';
    return new Intl.NumberFormat('vi-VN').format(Number(raw));
};

const parseAmountInput = (val) => {
    if (!val) return '';
    return String(val).replace(/\D/g, '');
};

export default function MilestoneSetupModal({ proposal, employerId, onClose, onSuccess }) {
    const [payOption, setPayOption] = useState('single'); // 'single' or 'split'
    const [milestones, setMilestones] = useState([
        { title: '', amount: '', dueDate: '', description: '' },
        { title: '', amount: '', dueDate: '', description: '' },
    ]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const bidAmount = proposal ? Number(proposal.bidAmount) : 0;

    const getDeadlineDate = () => {
        const today = new Date();
        const days = proposal ? Number(proposal.estimatedDays) : 0;
        today.setDate(today.getDate() + days);
        return today;
    };
    const maxDeadlineDate = getDeadlineDate();
    const maxDeadlineStr = maxDeadlineDate.toLocaleDateString('vi-VN');
    const maxDeadlineIso = maxDeadlineDate.toISOString().split('T')[0];
    const todayIso = new Date().toISOString().split('T')[0];

    const handleAddMilestone = () => {
        if (milestones.length >= 5) return;
        setMilestones([...milestones, { title: '', amount: '', dueDate: '', description: '' }]);
    };

    const handleRemoveMilestone = (index) => {
        if (milestones.length <= 2) return;
        setMilestones(milestones.filter((_, idx) => idx !== index));
    };

    const handleMilestoneChange = (index, field, value) => {
        const updated = milestones.map((m, idx) => {
            if (idx === index) {
                return { ...m, [field]: value };
            }
            return m;
        });
        setMilestones(updated);
    };

    // Calculate sum of milestones
    const sumAmounts = milestones.reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const isSumMatch = sumAmounts === bidAmount;
    const diffAmount = bidAmount - sumAmounts;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        let customMilestones = null;
        if (payOption === 'split') {
            if (milestones.length < 2 || milestones.length > 5) {
                setError('Số lượng mốc thanh toán phải từ 2 đến 5.');
                return;
            }
            if (!isSumMatch) {
                setError(`Tổng số tiền các mốc chưa khớp với ngân sách thầu. Lệch: ${diffAmount.toLocaleString('vi-VN')} VNĐ`);
                return;
            }
            for (let i = 0; i < milestones.length; i++) {
                const m = milestones[i];
                if (!m.title.trim()) {
                    setError(`Tiêu đề mốc thứ ${i + 1} không được bỏ trống.`);
                    return;
                }
                if (!m.amount || Number(m.amount) <= 0) {
                    setError(`Số tiền mốc thứ ${i + 1} phải lớn hơn 0.`);
                    return;
                }
                if (!m.dueDate) {
                    setError(`Hạn hoàn thành mốc thứ ${i + 1} không được bỏ trống.`);
                    return;
                }
                if (m.dueDate < todayIso) {
                    setError(`Hạn hoàn thành mốc thứ ${i + 1} không được trước ngày hôm nay.`);
                    return;
                }
                if (m.dueDate > maxDeadlineIso) {
                    setError(`Hạn hoàn thành mốc thứ ${i + 1} (${m.dueDate}) không được vượt quá ngày hoàn thành dự án dự kiến (${maxDeadlineStr}).`);
                    return;
                }
                if (i > 0 && milestones[i - 1].dueDate > m.dueDate) {
                    setError(`Hạn hoàn thành mốc thứ ${i} không được sau mốc thứ ${i + 1}.`);
                    return;
                }
            }
            customMilestones = milestones.map(m => ({
                title: m.title.trim(),
                amount: Number(m.amount),
                dueDate: m.dueDate,
                description: m.description.trim()
            }));
        }

        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/proposals/${proposal.proposalId}/accept?employerId=${employerId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: customMilestones ? JSON.stringify(customMilestones) : null
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || 'Chấp nhận báo giá thất bại.');
            }

            onSuccess();
        } catch (err) {
            setError(err.message || 'Lỗi khi chấp nhận báo giá.');
        } finally {
            setLoading(false);
        }
    };

    if (!proposal) return null;

    return (
        <div className="fixed inset-0 z-[1000] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col my-8 animate-in zoom-in-95 duration-200 text-left">
                
                {/* Header */}
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                    <div>
                        <h3 className="text-lg font-extrabold text-slate-800">Thiết lập Tiến độ & Mốc thanh toán</h3>
                        <p className="text-xs text-slate-500 mt-1">
                            Tuyển dụng freelancer <strong className="text-slate-700">{proposal.freelancerName}</strong> cho dự án.
                        </p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 rounded-xl flex items-start gap-2.5">
                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                            <span className="font-semibold text-xs leading-normal">{error}</span>
                        </div>
                    )}

                    {/* Total Budget Alert */}
                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex justify-between items-center mb-0">
                        <span className="text-slate-655 font-bold text-xs">Tổng ngân sách gói thầu:</span>
                        <span className="text-lg font-black text-blue-700">
                            {Number(proposal.bidAmount).toLocaleString('vi-VN')} VNĐ
                        </span>
                    </div>

                    {/* Project duration & deadline info */}
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <span className="text-slate-400 font-bold block mb-1">Thời gian thực hiện gói thầu:</span>
                            <span className="font-extrabold text-slate-850">{proposal.estimatedDays} ngày</span>
                        </div>
                        <div>
                            <span className="text-slate-400 font-bold block mb-1">Hạn hoàn thành tối đa:</span>
                            <span className="font-extrabold text-blue-600">{maxDeadlineStr}</span>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Pay Option */}
                        <div className="space-y-3">
                            <label className="text-xs font-bold text-slate-450 uppercase tracking-wider block">Hình thức thanh toán</label>
                            <div className="grid grid-cols-2 gap-4">
                                <label className={`border rounded-xl p-4 flex flex-col gap-1 cursor-pointer transition-all ${
                                    payOption === 'single' 
                                        ? 'border-blue-500 bg-blue-50/20' 
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="payOption" 
                                        value="single" 
                                        checked={payOption === 'single'}
                                        onChange={() => setPayOption('single')}
                                        className="sr-only"
                                    />
                                    <span className="font-extrabold text-slate-800 text-xs">Thanh toán 1 lần</span>
                                    <span className="text-[10px] text-slate-500 leading-snug">Giải ngân toàn bộ khi hoàn thành xong dự án</span>
                                </label>

                                <label className={`border rounded-xl p-4 flex flex-col gap-1 cursor-pointer transition-all ${
                                    payOption === 'split' 
                                        ? 'border-blue-500 bg-blue-50/20' 
                                        : 'border-slate-200 hover:bg-slate-50'
                                }`}>
                                    <input 
                                        type="radio" 
                                        name="payOption" 
                                        value="split" 
                                        checked={payOption === 'split'}
                                        onChange={() => setPayOption('split')}
                                        className="sr-only"
                                    />
                                    <span className="font-extrabold text-slate-800 text-xs">Chia theo tiến độ (2 - 5 mốc)</span>
                                    <span className="text-[10px] text-slate-500 leading-snug">Thanh toán và giải ngân từng phần việc hoàn thành</span>
                                </label>
                            </div>
                        </div>

                        {payOption === 'split' && (
                            <div className="space-y-4 pt-4 border-t border-slate-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-455 uppercase tracking-wider">Danh sách các mốc tiến độ</span>
                                    <button 
                                        type="button" 
                                        onClick={handleAddMilestone}
                                        disabled={milestones.length >= 5}
                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:text-slate-400"
                                    >
                                        + Thêm mốc
                                    </button>
                                </div>

                                <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-1">
                                    {milestones.map((m, index) => (
                                        <div key={index} className="p-4 border border-slate-150 rounded-xl bg-slate-50/50 space-y-3 relative">
                                            {milestones.length > 2 && (
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleRemoveMilestone(index)}
                                                    className="absolute top-4 right-4 text-xs font-bold text-rose-600 hover:text-rose-700"
                                                >
                                                    Xóa mốc
                                                </button>
                                            )}
                                            <h4 className="font-bold text-xs text-slate-700">Mốc số {index + 1}</h4>
                                            
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tiêu đề mốc công việc</label>
                                                    <input 
                                                        type="text"
                                                        value={m.title}
                                                        onChange={(e) => handleMilestoneChange(index, 'title', e.target.value)}
                                                        placeholder="VD: Thiết kế giao diện Mockup"
                                                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 focus:outline-none"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Số tiền thanh toán (VNĐ)</label>
                                                    <input 
                                                        type="text"
                                                        inputMode="numeric"
                                                        value={formatAmountInput(m.amount)}
                                                        onChange={(e) => handleMilestoneChange(index, 'amount', parseAmountInput(e.target.value))}
                                                        placeholder="VD: 5.000.000"
                                                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 focus:outline-none"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hạn hoàn thành</label>
                                                    <input 
                                                        type="date"
                                                        value={m.dueDate}
                                                        max={maxDeadlineIso}
                                                        min={todayIso}
                                                        onChange={(e) => handleMilestoneChange(index, 'dueDate', e.target.value)}
                                                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 focus:outline-none"
                                                        required
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Mô tả chi tiết yêu cầu (Không bắt buộc)</label>
                                                    <input 
                                                        type="text"
                                                        value={m.description}
                                                        onChange={(e) => handleMilestoneChange(index, 'description', e.target.value)}
                                                        placeholder="VD: Hoàn thành thiết kế trang chủ..."
                                                        className="w-full border border-slate-200 rounded-lg p-2 text-xs focus:border-blue-500 focus:outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-3 bg-slate-50 rounded-lg flex justify-between items-center text-xs">
                                    <span className="text-slate-500">Đã chia: <strong className="text-slate-800">{sumAmounts.toLocaleString('vi-VN')} VNĐ</strong> / {bidAmount.toLocaleString('vi-VN')} VNĐ</span>
                                    {isSumMatch ? (
                                        <span className="text-emerald-600 font-bold">✓ Khớp ngân sách</span>
                                    ) : (
                                        <span className="text-amber-600 font-bold">
                                            {diffAmount > 0 ? `Thiếu: ${diffAmount.toLocaleString('vi-VN')} VNĐ` : `Thừa: ${Math.abs(diffAmount).toLocaleString('vi-VN')} VNĐ`}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-xl transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={loading || (payOption === 'split' && !isSumMatch)}
                                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 disabled:cursor-not-allowed rounded-xl transition-colors shadow-md shadow-blue-600/10"
                            >
                                {loading ? 'Đang thực hiện...' : 'Xác nhận & Bắt đầu hợp đồng'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
