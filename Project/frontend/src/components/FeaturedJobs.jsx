import React, { useState } from 'react';
import { Code, Palette, Megaphone, Languages, PenTool, Video, Bookmark, Calendar, DollarSign, ExternalLink } from 'lucide-react';

export default function FeaturedJobs({ searchQuery }) {
  // Bookmark state
  const [savedJobs, setSavedJobs] = useState({});

  const toggleBookmark = (id) => {
    setSavedJobs(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // Mock Job Categories from CNY database schema
  const categories = [
    { id: 1, name: 'Lập trình', count: '1,245 dự án', icon: Code, color: 'text-blue-600 bg-blue-50' },
    { id: 2, name: 'Thiết kế', count: '890 dự án', icon: Palette, color: 'text-indigo-600 bg-indigo-50' },
    { id: 3, name: 'Marketing', count: '654 dự án', icon: Megaphone, color: 'text-cyan-600 bg-cyan-50' },
    { id: 4, name: 'Dịch thuật', count: '412 dự án', icon: Languages, color: 'text-purple-600 bg-purple-50' },
    { id: 5, name: 'Viết lách', count: '235 dự án', icon: PenTool, color: 'text-orange-600 bg-orange-50' },
    { id: 6, name: 'Video & Phim', count: '218 dự án', icon: Video, color: 'text-rose-600 bg-rose-50' },
  ];

  // Mock Projects modeled after the CNY SQL schema & the user's vLance screenshot
  const initialProjects = [
    {
      id: 1,
      category: 'Công nghệ',
      time: '2 giờ trước',
      title: 'Thiết kế Landing Page cho dự án SaaS',
      desc: 'Cần tìm chuyên gia thiết kế giao diện landing page chuyên nghiệp, hiện đại, chuẩn UI/UX cho nền tảng quản trị tài chính doanh nghiệp.',
      skills: ['Figma', 'UI/UX Design', 'SaaS', 'TailwindCSS'],
      budget: '5,000,000đ - 7,000,000đ',
      type: 'Fixed Price',
      isEnterprise: true,
    },
    {
      id: 2,
      category: 'Marketing',
      time: '4 giờ trước',
      title: 'Quản trị Fanpage & Sáng tạo nội dung',
      desc: 'Tìm đối tác quản lý Fanpage thương hiệu, viết content đăng ngày và thiết kế visual cơ bản theo bộ nhận diện thương hiệu.',
      skills: ['Content Writing', 'Fanpage Admin', 'Graphic Design', 'SEO'],
      budget: '8,000,000đ - 12,000,000đ / tháng',
      type: 'Theo tháng',
      isEnterprise: false,
    },
    {
      id: 3,
      category: 'Dịch thuật',
      time: '5 giờ trước',
      title: 'Biên dịch tài liệu Kỹ thuật (Anh - Việt)',
      desc: 'Biên dịch bộ tài liệu hướng dẫn lắp ráp và vận hành máy móc công nghiệp từ tiếng Anh sang tiếng Việt. Yêu cầu chính xác cao.',
      skills: ['Translation', 'English', 'Technical English', 'Editing'],
      budget: '3,000,000đ - 5,000,000đ',
      type: 'Fixed Price',
      isEnterprise: false,
    },
    {
      id: 4,
      category: 'Công nghệ',
      time: '6 giờ trước',
      title: 'Sửa lỗi giao diện website WordPress',
      desc: 'Website bán hàng đang bị lỗi hiển thị trên thiết bị di động, cần coder tối ưu responsive gấp trong ngày hôm nay.',
      skills: ['WordPress', 'CSS3', 'Responsive Design', 'PHP'],
      budget: '1,000,000đ - 2,000,000đ',
      type: 'Fixed Price',
      isEnterprise: false,
    },
    {
      id: 5,
      category: 'Thiết kế',
      time: '8 giờ trước',
      title: 'Thiết kế bộ nhận diện thương hiệu F&B',
      desc: 'Cần thiết kế bộ nhận diện thương hiệu cơ bản bao gồm logo, menu, danh thiếp, bảng hiệu cho quán cà phê specialty mới mở.',
      skills: ['Logo Design', 'Brand Identity', 'Adobe Illustrator', 'F&B'],
      budget: '4,000,000đ',
      type: 'Fixed Price',
      isEnterprise: true,
    },
    {
      id: 6,
      category: 'Hành chính',
      time: '12 giờ trước',
      title: 'Nhập liệu sản phẩm lên sàn TMĐT',
      desc: 'Cần nhập thông tin 500 sản phẩm thời trang lên các sàn Shopee, Lazada. Đã có sẵn hình ảnh và mô tả sản phẩm chi tiết.',
      skills: ['Data Entry', 'E-commerce', 'Excel', 'Product Upload'],
      budget: '2,000,000đ',
      type: 'Fixed Price',
      isEnterprise: false,
    }
  ];

  // Filter projects by search query
  const filteredProjects = initialProjects.filter(project => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      project.title.toLowerCase().includes(query) ||
      project.desc.toLowerCase().includes(query) ||
      project.category.toLowerCase().includes(query) ||
      project.skills.some(skill => skill.toLowerCase().includes(query))
    );
  });

  return (
    <section id="find-work" className="py-20 bg-[#F8FAFC]">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Popular Categories */}
        <div className="mb-20">
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-secondary font-bold text-label-md uppercase tracking-wider block mb-2">Khám phá theo nhóm ngành</span>
              <h2 className="font-display text-3xl font-extrabold text-primary">Danh mục phổ biến</h2>
            </div>
            <a href="#all-categories" className="text-secondary font-bold text-body-sm hover:underline flex items-center gap-1">
              Tất cả danh mục →
            </a>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div 
                  key={cat.id} 
                  className="bg-surface p-5 rounded-2xl border border-muted-light/60 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col items-center text-center"
                >
                  <div className={`w-12 h-12 ${cat.color} rounded-xl flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="font-display font-bold text-primary text-body-md block mb-1">{cat.name}</span>
                  <span className="text-[12px] text-muted">{cat.count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Latest Projects Grid */}
        <div>
          <div className="flex justify-between items-end mb-8">
            <div>
              <span className="text-secondary font-bold text-label-md uppercase tracking-wider block mb-2">Cơ hội việc làm mới</span>
              <h2 className="font-display text-3xl font-extrabold text-primary">Dự án mới nhất</h2>
            </div>
            <a href="#all-projects" className="bg-primary hover:bg-primary-light text-white px-6 py-2.5 rounded-large font-bold text-body-sm transition-all shadow-sm">
              Xem tất cả dự án
            </a>
          </div>

          {filteredProjects.length === 0 ? (
            <div className="bg-surface p-12 rounded-2xl text-center border border-muted-light shadow-sm">
              <p className="text-muted text-lg">Không tìm thấy dự án nào phù hợp với tìm kiếm của bạn.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="text-secondary font-bold mt-2 hover:underline"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className={`bg-surface p-6 rounded-2xl border transition-all duration-300 flex flex-col justify-between group hover:shadow-lg ${
                    project.isEnterprise 
                      ? 'border-secondary/40 shadow-sm shadow-secondary/5 bg-gradient-to-b from-white to-secondary-light/10' 
                      : 'border-muted-light/60 shadow-sm'
                  }`}
                >
                  <div>
                    {/* Header: Tag + Save */}
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-body-sm font-bold ${
                          project.category === 'Công nghệ' ? 'bg-blue-100 text-blue-800' :
                          project.category === 'Marketing' ? 'bg-cyan-100 text-cyan-800' :
                          project.category === 'Thiết kế' ? 'bg-indigo-100 text-indigo-800' :
                          project.category === 'Dịch thuật' ? 'bg-purple-100 text-purple-800' :
                          'bg-slate-100 text-slate-800'
                        }`}>
                          {project.category}
                        </span>
                        {project.isEnterprise && (
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-[11px] font-extrabold uppercase">
                            Enterprise
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={() => toggleBookmark(project.id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          savedJobs[project.id] 
                            ? 'bg-rose-50 border-rose-200 text-rose-500 hover:bg-rose-100' 
                            : 'bg-muted-light/20 border-muted-light/60 text-muted hover:bg-muted-light/50'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" fill={savedJobs[project.id] ? "currentColor" : "none"} />
                      </button>
                    </div>

                    {/* Title */}
                    <h3 className="font-display text-lg font-bold text-primary mb-2 group-hover:text-secondary transition-colors duration-200 line-clamp-1">
                      {project.title}
                    </h3>
                    
                    {/* Duration/Meta */}
                    <span className="text-[12px] text-muted block mb-3 font-medium">Đăng {project.time}</span>
                    
                    {/* Description */}
                    <p className="font-sans text-muted text-body-sm mb-4 line-clamp-2 leading-relaxed">
                      {project.desc}
                    </p>

                    {/* Skills Chips */}
                    <div className="flex flex-wrap gap-1.5 mb-6">
                      {project.skills.map((skill, i) => (
                        <span key={i} className="px-2.5 py-0.5 bg-muted-light/30 border border-muted-light/80 rounded-md text-[12px] font-medium text-primary">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Footer: Budget + Action */}
                  <div className="flex justify-between items-center pt-4 border-t border-muted-light/50 mt-auto">
                    <div>
                      <p className="text-[11px] text-muted uppercase font-bold tracking-wider">Ngân sách</p>
                      <p className="text-primary font-bold text-body-md leading-tight">{project.budget}</p>
                    </div>
                    
                    <button className="flex items-center gap-1 text-secondary font-bold text-body-sm hover:text-secondary-dark group/btn transition-colors">
                      Chào giá <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </section>
  );
}
