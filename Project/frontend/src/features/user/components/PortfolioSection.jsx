import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ExternalLink, Image as ImageIcon, X } from 'lucide-react';

export default function PortfolioSection({ targetId, isOwner }) {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [files, setFiles] = useState([]); // [{fileUrl, fileName, fileSize, fileType}]
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchPortfolios();
  }, [targetId]);

  const fetchPortfolios = () => {
    setLoading(true);
    fetch(`http://localhost:8080/api/freelancers/${targetId}/portfolios`)
      .then(res => res.json())
      .then(data => {
        setPortfolios(data);
      })
      .catch(err => console.error("Lỗi lấy danh sách portfolio:", err))
      .finally(() => setLoading(false));
  };

  const handleOpenModal = (portfolio = null) => {
    if (portfolio) {
      setEditingPortfolio(portfolio);
      setTitle(portfolio.title);
      setDescription(portfolio.description || '');
      setProjectUrl(portfolio.projectUrl || '');
      setFiles(portfolio.files || []);
    } else {
      setEditingPortfolio(null);
      setTitle('');
      setDescription('');
      setProjectUrl('');
      setFiles([]);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingPortfolio(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8080/api/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setFiles(prev => [...prev, {
          fileUrl: data.fileUrl,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }]);
      } else {
        alert("Lỗi upload ảnh!");
      }
    } catch (err) {
      alert("Lỗi kết nối upload!");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = (indexToRemove) => {
    setFiles(prev => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSave = () => {
    if (!title.trim()) {
      alert("Vui lòng nhập tên dự án!");
      return;
    }

    const payload = {
      title,
      description,
      projectUrl,
      files
    };

    const url = editingPortfolio 
      ? `http://localhost:8080/api/freelancers/${targetId}/portfolios/${editingPortfolio.portfolioId}`
      : `http://localhost:8080/api/freelancers/${targetId}/portfolios`;
    
    const method = editingPortfolio ? 'PUT' : 'POST';

    fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(() => {
        fetchPortfolios();
        handleCloseModal();
      })
      .catch(err => {
        alert("Lỗi lưu portfolio!");
        console.error(err);
      });
  };

  const handleDelete = (portfolioId) => {
    if (!window.confirm("Bạn có chắc muốn xóa dự án này?")) return;

    fetch(`http://localhost:8080/api/freelancers/${targetId}/portfolios/${portfolioId}`, {
      method: 'DELETE'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          fetchPortfolios();
        } else {
          alert("Lỗi xóa portfolio!");
        }
      })
      .catch(err => console.error(err));
  };

  if (loading) return <div className="text-gray-500 text-sm mt-4">Đang tải hồ sơ năng lực...</div>;

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">Hồ sơ năng lực (Portfolio)</h3>
        {isOwner && (
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" /> Thêm dự án
          </button>
        )}
      </div>

      {portfolios.length === 0 ? (
        <div className="bg-gray-50 rounded-xl p-8 text-center border border-dashed border-gray-200">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm mb-4">Chưa có dự án nào trong hồ sơ năng lực.</p>
          {isOwner && (
            <button onClick={() => handleOpenModal()} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
              Thêm dự án đầu tiên
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {portfolios.map(p => (
            <div key={p.portfolioId} className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-all">
              {/* Thumbnail Area */}
              <div className="h-48 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                {p.files && p.files.length > 0 ? (
                  <img src={p.files[0].fileUrl} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-10 h-10 text-gray-300" />
                )}
                
                {isOwner && (
                  <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenModal(p)} className="p-1.5 bg-white/90 backdrop-blur rounded text-gray-700 hover:text-blue-600 shadow-sm">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(p.portfolioId)} className="p-1.5 bg-white/90 backdrop-blur rounded text-gray-700 hover:text-red-600 shadow-sm">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
              
              {/* Content Area */}
              <div className="p-4">
                <h4 className="font-bold text-gray-900 line-clamp-1 mb-1">{p.title}</h4>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{p.description || 'Không có mô tả'}</p>
                {p.projectUrl && (
                  <a href={p.projectUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800">
                    <ExternalLink className="w-3 h-3" /> Xem dự án
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL THÊM/SỬA PORTFOLIO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">{editingPortfolio ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}</h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên dự án *</label>
                <input type="text" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="VD: Ứng dụng quản lý nhân sự..." value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả dự án</label>
                <textarea rows={4} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Mô tả các tính năng chính, công nghệ sử dụng..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Đường dẫn thực tế (Link)</label>
                <input type="url" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="https://..." value={projectUrl} onChange={e => setProjectUrl(e.target.value)} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hình ảnh dự án (Tối đa 5 ảnh)</label>
                
                {/* Lưới hiển thị ảnh đã up */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-3">
                  {files.map((file, idx) => (
                    <div key={idx} className="relative rounded-lg overflow-hidden border border-gray-200 aspect-video group">
                      <img src={file.fileUrl} alt="portfolio file" className="w-full h-full object-cover" />
                      <button onClick={() => handleRemoveFile(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {files.length < 5 && (
                    <label className="border-2 border-dashed border-gray-300 rounded-lg aspect-video flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors">
                      <Plus className="w-6 h-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500 font-medium">{isUploading ? 'Đang tải...' : 'Thêm ảnh'}</span>
                      <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={handleFileUpload} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-4 py-2 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors">Hủy</button>
              <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg transition-colors">
                Lưu dự án
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
