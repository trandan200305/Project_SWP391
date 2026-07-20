import re

with open('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/pages/AdminDashboardPage.jsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace aside from line 2598 (0-indexed 2597) to 2743 (0-indexed 2742)
new_aside = '''      <aside className="w-sidebar-width bg-surface border-r border-outline-variant flex flex-col justify-between shrink-0 hidden md:flex h-full">
        <div className="p-5 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-2xl">rocket_launch</span>
          </div>
          <div>
            <h1 className="text-headline-md font-headline-md font-black text-primary leading-tight">LancerPro</h1>
            <p className="text-body-sm text-secondary">B?ng qu?n tr?</p>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto py-2">
          <div className="mb-6">
            <p className="px-7 text-label-caps font-label-caps text-secondary mb-3 opacity-60">CHÍNH</p>
            <div className="px-4 space-y-1">
              <div 
                onClick={() => setActiveTab('dashboard')}
                className={lex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all \}
              >
                <span className="material-symbols-outlined text-[20px]">dashboard</span>
                <span className="text-body-md">B?ng di?u khi?n</span>
              </div>
              <div 
                onClick={() => setActiveTab('users')}
                className={lex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all \}
              >
                <span className="material-symbols-outlined text-[20px]">group</span>
                <span className="text-body-md">Ngu?i dùng</span>
              </div>
              <div 
                onClick={() => setActiveTab('departments')}
                className={lex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all \}
              >
                <span className="material-symbols-outlined text-[20px]">domain</span>
                <span className="text-body-md">Khoa / Phòng Ban</span>
              </div>
              <div 
                onClick={() => setActiveTab('vnpay')}
                className={lex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all \}
              >
                <span className="material-symbols-outlined text-[20px]">payments</span>
                <span className="text-body-md">Giao d?ch VNPay</span>
              </div>
              <div 
                onClick={() => setActiveTab('cms')}
                className={lex items-center gap-3 px-3 py-2 cursor-pointer rounded-lg transition-all \}
              >
                <span className="material-symbols-outlined text-[20px]">settings_applications</span>
                <span className="text-body-md">C?u hình CMS</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-outline-variant">
          <div onClick={onLogout} className="flex items-center gap-3 px-3 py-3 text-secondary hover:text-primary hover:bg-surface-container-low rounded-lg transition-all cursor-pointer">
            <span className="material-symbols-outlined">logout</span>
            <span className="text-body-md">Ðang xu?t</span>
          </div>
        </div>
      </aside>
'''

# Replace header from 2749 (0-indexed 2748) to 2916 (0-indexed 2915)
new_header = '''        <header className="flex justify-between items-center h-16 px-margin-page sticky top-0 w-full bg-surface/80 backdrop-blur-md z-40 border-b border-outline-variant">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full focus-within:ring-2 focus-within:ring-primary rounded-lg transition-all">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-secondary">search</span>
              <input 
                className="w-full bg-surface-container-high border-none rounded-lg pl-10 py-2 text-body-md placeholder:text-secondary-fixed-dim focus:ring-0" 
                placeholder="Tìm ki?m thông tin..." 
                type="text"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 ml-4">
            <button className="p-2 text-secondary hover:bg-surface-container-high rounded-full transition-all relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full"></span>
            </button>
            <div className="h-8 w-px bg-outline-variant mx-2"></div>
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <p className="text-body-md font-bold leading-tight">{user?.displayName || user?.email || 'Admin'}</p>
                <p className="text-body-sm text-secondary">{user?.role || "Qu?n tr? viên"}</p>
              </div>
              {user?.avatarUrl ? (
                <img src={user?.avatarUrl} alt="Admin" className="w-10 h-10 rounded-full border-2 border-primary object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full border-2 border-primary bg-primary/10 flex items-center justify-center font-bold text-primary">
                  {user?.displayName ? user.displayName.charAt(0).toUpperCase() : 'A'}
                </div>
              )}
            </div>
          </div>
        </header>
'''

# Let's ensure the lines are exactly as we expect. 
# We'll just build a new list of lines
out_lines = []
for i, line in enumerate(lines):
    if 2597 <= i <= 2742:
        if i == 2597:
            out_lines.append(new_aside)
    elif 2748 <= i <= 2915:
        if i == 2748:
            out_lines.append(new_header)
    else:
        out_lines.append(line)

with open('c:/Users/admin/Downloads/Project_SWP391/Project_SWP391/Project/frontend/src/features/admin/pages/AdminDashboardPage.jsx', 'w', encoding='utf-8') as f:
    f.writelines(out_lines)

print("Done replacing layout")
