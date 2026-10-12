import React, { useState, useEffect, createContext, useContext } from 'react';
import {
  LayoutDashboard, Map as MapIcon, CalendarCheck, BedDouble, Users,
  Search, Bell, X, Menu, LogOut, CheckCircle2, AlertCircle, XCircle,
  UserCircle, CheckSquare, Square, Eye
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';
// ==========================================
// 1. MOCK DATA & CONSTANTS
// ==========================================
const MOCK_USERS = [
  { id: 1, username: 'admin', password: '1', role: 'ADMIN', name: 'Admin Manager' },
  { id: 2, username: 'nhanvien', password: '1', role: 'NHANVIEN', name: 'Lê Lễ Tân' },
  { id: 3, username: 'khachhang', password: '1', role: 'KHACHHANG', name: 'Nguyễn Khách Hàng', customerId: 1 },
];

const INITIAL_CUSTOMERS = [
  { id: 1, code: 'KH001', name: 'Nguyễn Khách Hàng', gender: 'Nam', cccd: '012345678912', phone: '0901234567', address: 'Hà Nội', nationality: 'Việt Nam' },
  { id: 2, code: 'KH002', name: 'Trần Văn B', gender: 'Nam', cccd: '987654321098', phone: '0987654321', address: 'TP.HCM', nationality: 'Việt Nam' },
];

const INITIAL_BOOKINGS = [
  { id: 1, code: 'BK-1001', customerId: 2, roomId: 102, checkIn: '2026-09-25', checkOut: '2026-09-28', guests: 2, totalAmount: 2400000, status: 'CHECKED_IN' },
  { id: 2, code: 'BK-1002', customerId: 1, roomId: 201, checkIn: '2026-09-30', checkOut: '2026-10-02', guests: 2, totalAmount: 3000000, status: 'CONFIRMED' },
];

const STATUS_COLORS = {
  AVAILABLE: { bg: 'bg-[#2ECC71]', text: 'text-white', border: 'border-[#2ECC71]', label: 'Sẵn sàng' },
  OCCUPIED: { bg: 'bg-[#3498DB]', text: 'text-white', border: 'border-[#3498DB]', label: 'Đang ở' },
  CLEANING: { bg: 'bg-[#F39C12]', text: 'text-white', border: 'border-[#F39C12]', label: 'Đang dọn' },
  MAINTENANCE: { bg: 'bg-[#E74C3C]', text: 'text-white', border: 'border-[#E74C3C]', label: 'Bảo trì' }
};

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [year, month, day] = parts;
  return `${day}/${month}/${year}`;
};

// ==========================================
// 2. APP CONTEXT & FETCH API
// ==========================================
const AppContext = createContext();

const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [rooms, setRooms] = useState([]);
  
  // SỬ LÝ TRIỆT ĐỂ LỖI FONT "SẴN SÀNG" / "TRỐNG"
  useEffect(() => {
    fetch("https://royal-hotel-6xe9.onrender.com/api/phong")
      .then((res) => res.json())
      .then((data) => {
        const formattedRooms = data.map(item => {
          const chuoiTrangThai = String(item.TrangThai || "").toLowerCase();
          const laPhongTrong = chuoiTrangThai.includes('sẵn') || 
                               chuoiTrangThai.includes('trống') || 
                               chuoiTrangThai.includes('s?n') || 
                               chuoiTrangThai.includes('tr?ng') ||
                               chuoiTrangThai.includes('san sang');

          return {
            id: item.MaPhong,
            roomNumber: item.SoPhong,
            type: item.LoaiPhong,
            floor: 1,
            capacity: 2,
            price: item.Gia,
            status: laPhongTrong ? 'AVAILABLE' : 'OCCUPIED'
          };
        });
        setRooms(formattedRooms);
      })
      .catch((err) => console.error("Lỗi kết nối API:", err));
  }, []);

  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS);
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS);
  const [toast, setToast] = useState(null);
  const [adminView, setAdminView] = useState('dashboard');
  const [customerView, setCustomerView] = useState('rooms');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const logout = () => {
    setCurrentUser(null);
    setAdminView('dashboard');
    setCustomerView('rooms');
  };

  return (
    <AppContext.Provider value={{
      currentUser, setCurrentUser, logout,
      rooms, setRooms, customers, setCustomers,
      bookings, setBookings, toast, showToast,
      adminView, setAdminView, customerView, setCustomerView
    }}>
      {children}
    </AppContext.Provider>
  );
};
const useAppContext = () => useContext(AppContext);

// ==========================================
// 3. UI COMPONENTS CHUNG
// ==========================================
const Toast = () => {
  const { toast } = useAppContext();
  if (!toast) return null;
  const bg = toast.type === 'success' ? 'bg-[#2ECC71]' : toast.type === 'error' ? 'bg-[#E74C3C]' : 'bg-[#F39C12]';
  return (
    <div className={`fixed top-4 right-4 text-white px-6 py-3 rounded-md shadow-lg flex items-center gap-3 z-50 transition-all duration-300 transform opacity-100 translate-y-0 ${bg}`}>
      {toast.type === 'success' ? <CheckCircle2 size={20} /> : toast.type === 'error' ? <XCircle size={20} /> : <AlertCircle size={20} />}
      <span className="font-medium">{toast.message}</span>
    </div>
  );
};

const Modal = ({ isOpen, onClose, title, children, width = 'max-w-md' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className={`bg-white rounded-2xl shadow-2xl w-full ${width} overflow-hidden flex flex-col max-h-[90vh] animate-modal-pop`}>
        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-gray-50/50 shrink-0">
          <h3 className="font-bold text-xl text-[#0B315F]">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-[#E74C3C] transition-colors"><X size={24} /></button>
        </div>
        <div className="p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

const Input = ({ label, ...props }) => (
  <div className="mb-4 w-full">
    {label && <label className="block text-[#2C3E50] text-sm font-medium mb-1.5">{label}</label>}
    <input
      className="w-full border border-gray-300 rounded-md px-3 py-2 text-[#2C3E50] focus:border-[#3498DB] focus:ring-1 focus:ring-[#3498DB] outline-none transition-all placeholder:text-gray-400"
      {...props}
    />
  </div>
);

const Button = ({ children, variant = 'primary', className = '', ...props }) => {
  const base = "rounded-md px-4 py-2 font-medium transition-colors duration-200 flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-[#3498DB] text-white hover:bg-[#2980B9]",
    gold: "bg-[#D9AC2B] text-white hover:bg-[#C39A20]",
    outline: "border border-gray-300 text-[#7F8C8D] hover:bg-gray-50",
    danger: "bg-[#E74C3C] text-white hover:bg-[#C0392B]",
    success: "bg-[#2ECC71] text-white hover:bg-[#27AE60]",
  };
  return (
    <button className={`${base} ${variants[variant] || variants.primary} ${className}`} {...props}>
      {children}
    </button>
  );
};

// ==========================================
// ==========================================
// ==========================================
// 4. LOGIN VIEW (BRIGHT & SUNNY RESORT 3D)
// ==========================================
const LoginView = () => {
  const { setCurrentUser, showToast } = useAppContext();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();
    const user = MOCK_USERS.find(u => u.username === username && u.password === password);
    if (user) {
      setCurrentUser(user);
      showToast(`Đăng nhập thành công. Xin chào ${user.name}!`);
    } else {
      showToast('Tên đăng nhập hoặc mật khẩu không đúng', 'error');
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 overflow-hidden font-['Inter',Arial,sans-serif]">
      {/* 1. Ảnh nền Resort siêu sáng, có hiệu ứng Zoom chậm */}
      <div 
        className="absolute inset-0 z-0 animate-slow-zoom"
        style={{
          // Đổi sang ảnh hồ bơi resort ngập nắng cực đẹp
          backgroundImage: "url('https://images.unsplash.com/photo-1571896349842-33c89424de2d?q=80&w=2000&auto=format&fit=crop')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      ></div>
      
      {/* 2. Lớp phủ siêu mỏng giúp ảnh nền nổi bật nhưng vẫn đọc được chữ */}
      <div className="absolute inset-0 z-0 bg-white/20 backdrop-blur-[2px]"></div>

      {/* 3. Hiệu ứng tia nắng và luồng gió lơ lửng động (Floating Sunbeams) */}
      <div className="absolute top-0 left-10 w-96 h-96 bg-yellow-200/40 rounded-full mix-blend-overlay filter blur-[80px] animate-float"></div>
      <div className="absolute bottom-10 right-20 w-[30rem] h-[30rem] bg-cyan-300/30 rounded-full mix-blend-overlay filter blur-[100px] animate-float" style={{ animationDelay: '2s' }}></div>

      {/* 4. Box Đăng nhập Kính Trắng (Light Glassmorphism) */}
      <div className="relative z-10 w-full max-w-[420px] bg-white/60 backdrop-blur-2xl border border-white/60 rounded-3xl p-10 shadow-[0_20px_60px_rgba(11,49,95,0.15)] animate-3d-flip">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-[#3498DB] to-[#85C1E9] rounded-full mb-6 shadow-[0_10px_20px_rgba(52,152,219,0.4)] animate-3d-float">
            <span className="text-4xl text-white">🏨</span>
          </div>
          <h1 className="text-4xl font-extrabold text-[#0B315F] tracking-widest drop-shadow-sm mb-2">
            ROYAL<span className="text-[#3498DB]">HOTEL</span>
          </h1>
          <p className="text-gray-600 text-sm font-bold tracking-widest uppercase">
            Cánh Cửa Sự Xa Hoa
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {/* Ô nhập Tài khoản */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 group-focus-within:text-[#3498DB] transition-colors text-lg">👤</span>
            </div>
            <input
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full bg-white/70 border border-white/50 rounded-xl pl-12 pr-4 py-4 text-[#0B315F] font-medium placeholder-gray-500 focus:bg-white focus:border-[#3498DB] focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 shadow-inner"
            />
          </div>
          
          {/* Ô nhập Mật khẩu */}
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <span className="text-gray-400 group-focus-within:text-[#3498DB] transition-colors text-lg">🔒</span>
            </div>
            <input
              type="password"
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-white/70 border border-white/50 rounded-xl pl-12 pr-4 py-4 text-[#0B315F] font-medium placeholder-gray-500 focus:bg-white focus:border-[#3498DB] focus:ring-2 focus:ring-blue-200 outline-none transition-all duration-300 shadow-inner"
            />
          </div>

          {/* Nút bấm Xanh dương rực rỡ */}
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-[#3498DB] to-[#2980B9] text-white font-bold text-lg py-4 rounded-xl shadow-[0_10px_20px_rgba(52,152,219,0.4)] hover:shadow-[0_15px_30px_rgba(52,152,219,0.6)] transform hover:-translate-y-1 transition-all duration-300 active:scale-95 mt-2"
          >
            ĐĂNG NHẬP TÀI KHOẢN
          </button>
        </form>

        <div className="mt-8 text-center text-gray-500 text-xs font-semibold tracking-wider">
          <p>Demo: admin/1 | nhanvien/1 | khachhang/1</p>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 5. ADMIN VIEWS (GIỮ NGUYÊN BẢN GỐC CỦA BẠN)
// ==========================================
const AdminRoomMap = () => {
  const { rooms } = useAppContext();
  const [filter, setFilter] = useState('ALL');
  const floors = [...new Set(rooms.map(r => r.floor))].sort((a,b)=>a-b);
  const filteredRooms = rooms.filter(r => filter === 'ALL' || r.status === filter);
  return (
    <div className="animate-fade-in-up">
      <h2 className="text-2xl font-bold text-[#0B315F] mb-6">Sơ đồ phòng</h2>
      <div className="flex flex-wrap gap-2 mb-8 bg-white p-2 rounded-lg shadow-sm border border-gray-100 w-fit">
        <button onClick={() => setFilter('ALL')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'ALL' ? 'bg-[#36546D] text-white' : 'text-[#7F8C8D] hover:bg-gray-50'}`}>Tất cả</button>
        {Object.keys(STATUS_COLORS).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${filter === f ? STATUS_COLORS[f].bg + ' text-white' : 'text-[#7F8C8D] hover:bg-gray-50'}`}>
            <span className={`w-2 h-2 rounded-full ${filter !== f ? STATUS_COLORS[f].bg : 'bg-white'}`}></span>
            {STATUS_COLORS[f].label}
          </button>
        ))}
      </div>
      {floors.map(floor => {
        const floorRooms = filteredRooms.filter(r => r.floor === floor);
        if (floorRooms.length === 0) return null;
        return (
          <div key={floor} className="mb-8">
            <h3 className="font-semibold text-lg text-[#0B315F] mb-4 flex items-center gap-2">
              <div className="w-1 h-5 bg-[#D9AC2B] rounded"></div>
              TẦNG {floor}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
              {floorRooms.map(room => (
                <div key={room.id} className={`bg-white rounded-lg p-4 border-[2px] shadow-sm hover:shadow-md transition-all cursor-pointer group ${STATUS_COLORS[room.status].border}`}>
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-2xl font-bold text-[#2C3E50]">{room.roomNumber}</span>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-sm ${STATUS_COLORS[room.status].bg} ${STATUS_COLORS[room.status].text}`}>
                      {STATUS_COLORS[room.status].label}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-[#7F8C8D]">{room.type}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const AdminDashboard = () => {
  const { setAdminView } = useAppContext();
  const [stats, setStats] = useState({ tongPhong: 0, phongTrong: 0, tongDon: 0, doanhThu: 0 });
  const [recentBookings, setRecentBookings] = useState([]);

  // Dữ liệu biểu đồ giả lập (Trong thực tế sẽ lấy từ API Backend thống kê 7 ngày)
  const chartData = [
    { name: 'T2', doanhThu: 4500000 },
    { name: 'T3', doanhThu: 3200000 },
    { name: 'T4', doanhThu: 5800000 },
    { name: 'T5', doanhThu: 2100000 },
    { name: 'T6', doanhThu: 6500000 },
    { name: 'T7', doanhThu: 8900000 },
    { name: 'CN', doanhThu: 11200000 },
  ];

  useEffect(() => {
    // 1. Lấy thống kê tổng
    fetch("https://royal-hotel-6xe9.onrender.com/api/thongke")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Lỗi tải thống kê:", err));

    // 2. Lấy 5 đơn đặt phòng mới nhất
    fetch("https://royal-hotel-6xe9.onrender.com/api/datphong")
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a, b) => b.MaDatPhong - a.MaDatPhong);
        setRecentBookings(sorted.slice(0, 5)); // Cắt lấy 5 đơn trên cùng
      })
      .catch(err => console.error("Lỗi tải đơn:", err));
  }, []);

  return (
    <div className="p-4 lg:p-8 animate-fade-in-up">
      {/* Tiêu đề & Ngày tháng */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0B315F]">Tổng quan hệ thống</h2>
          <p className="text-gray-500 mt-1 font-medium">Theo dõi hoạt động kinh doanh của khách sạn</p>
        </div>
        <button className="bg-white border border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md hover:bg-gray-50 font-bold flex items-center gap-2 transition-all">
          <span className="text-xl">📅</span> {new Date().toLocaleDateString('vi-VN')}
        </button>
      </div>

      {/* 4 Thẻ chỉ số nâng cấp 3D */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:-translate-y-1 hover:shadow-lg transition-all border-l-4 border-l-blue-500 group">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 text-3xl group-hover:bg-blue-500 group-hover:text-white transition-colors">🏨</div>
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Tổng số phòng</p>
            <h3 className="text-3xl font-black text-gray-800">{stats.tongPhong}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:-translate-y-1 hover:shadow-lg transition-all border-l-4 border-l-green-500 group">
          <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center text-green-500 text-3xl group-hover:bg-green-500 group-hover:text-white transition-colors">✨</div>
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Phòng trống</p>
            <h3 className="text-3xl font-black text-gray-800">{stats.phongTrong}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:-translate-y-1 hover:shadow-lg transition-all border-l-4 border-l-yellow-500 group">
          <div className="w-16 h-16 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-500 text-3xl group-hover:bg-yellow-500 group-hover:text-white transition-colors">📝</div>
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Đơn đặt phòng</p>
            <h3 className="text-3xl font-black text-gray-800">{stats.tongDon}</h3>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-5 hover:-translate-y-1 hover:shadow-lg transition-all border-l-4 border-l-red-500 group">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center text-red-500 text-3xl group-hover:bg-red-500 group-hover:text-white transition-colors">💰</div>
          <div>
            <p className="text-xs font-bold text-gray-400 mb-1 tracking-wider uppercase">Doanh thu</p>
            <h3 className="text-2xl font-black text-red-600">{stats.doanhThu ? stats.doanhThu.toLocaleString('vi-VN') : 0}đ</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* KHU VỰC 1: Biểu đồ doanh thu */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h3 className="text-xl font-bold text-[#0B315F]">Biểu đồ doanh thu</h3>
              <p className="text-sm text-gray-500 mt-1">Dữ liệu 7 ngày gần nhất</p>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 600}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontWeight: 600}} tickFormatter={(value) => `${value / 1000000}M`} />
                <RechartsTooltip 
                  formatter={(value) => [new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value), 'Doanh thu']}
                  cursor={{fill: '#f3f4f6'}}
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontWeight: 'bold'}}
                />
                <Bar dataKey="doanhThu" fill="#3498DB" radius={[8, 8, 0, 0]} barSize={45} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* KHU VỰC 2: Danh sách đơn mới nhất */}
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-[#0B315F]">Khách sắp nhận phòng</h3>
            <button onClick={() => setAdminView('bookings')} className="text-[#3498DB] bg-blue-50 px-3 py-1 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors">
              Xem tất cả
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {recentBookings.length > 0 ? recentBookings.map((b, i) => (
              <div key={i} className="flex justify-between items-center p-4 hover:bg-gray-50 rounded-2xl border border-gray-50 hover:border-blue-100 transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center font-black text-blue-600 text-lg group-hover:scale-110 transition-transform">
                    {b.SoPhong}
                  </div>
                  <div>
                    <p className="font-bold text-gray-800">{b.TenKhachHang}</p>
                    <p className="text-xs text-gray-500 mt-0.5">Mã đơn: #{b.MaDatPhong}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[11px] font-black px-3 py-1.5 rounded-lg inline-block
                    ${b.TrangThai === 'Chờ duyệt' ? 'bg-yellow-100 text-yellow-700' : 
                      b.TrangThai === 'Đã duyệt' ? 'bg-green-100 text-green-700' : 
                      b.TrangThai === 'Đã trả phòng' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                    {b.TrangThai}
                  </span>
                </div>
              </div>
            )) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <span className="text-5xl mb-3">🛌</span>
                <p className="font-medium text-sm">Chưa có đơn hàng nào</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminRooms = () => {
  const { rooms, setRooms, showToast } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const openAddForm = () => {
    setEditingRoom(null);
    setIsModalOpen(true);
  };

  const openEditForm = (room) => {
    setEditingRoom(room);
    setIsModalOpen(true);
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const roomData = {
      MaPhong: editingRoom ? editingRoom.id : Math.floor(Math.random() * 10000) + 100,
      SoPhong: formData.get('roomNumber'),
      LoaiPhong: formData.get('type'),
      Gia: parseFloat(formData.get('price')),
      TrangThai: formData.get('status')
    };
    try {
      if (editingRoom) {
        const response = await fetch(`https://royal-hotel-6xe9.onrender.com/api/phong/${editingRoom.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomData),
        });
        if (response.ok) {
          setRooms(rooms.map(r => r.id === editingRoom.id ? {
            ...r,
            roomNumber: roomData.SoPhong,
            type: roomData.LoaiPhong,
            price: roomData.Gia,
            status: roomData.TrangThai === 'Sẵn sàng' || roomData.TrangThai === 'Trống' ? 'AVAILABLE' : 'OCCUPIED'
          } : r));
          showToast("Cập nhật phòng thành công!", "success");
        }
      } else {
        const response = await fetch("https://royal-hotel-6xe9.onrender.com/api/phong", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(roomData),
        });
        if (response.ok) {
          setRooms([...rooms, {
            id: roomData.MaPhong,
            roomNumber: roomData.SoPhong,
            type: roomData.LoaiPhong,
            price: roomData.Gia,
            status: roomData.TrangThai === 'Sẵn sàng' || roomData.TrangThai === 'Trống' ? 'AVAILABLE' : 'OCCUPIED'
          }]);
          showToast("Thêm phòng thành công!", "success");
        }
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Lỗi lưu phòng:", error);
      showToast("Không thể kết nối đến server", "error");
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa phòng này?")) return;
    try {
      const response = await fetch(`https://royal-hotel-6xe9.onrender.com/api/phong/${roomId}`, { method: "DELETE" });
      if (response.ok) {
        setRooms(rooms.filter(room => room.id !== roomId));
        showToast("Xóa phòng thành công!", "success");
      }
    } catch (error) {
      console.error("Lỗi xóa phòng:", error);
      showToast("Không thể kết nối server", "error");
    }
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Quản lý danh sách phòng</h2>
        <Button onClick={openAddForm} className="bg-[#3498DB] text-white px-4 py-2 rounded shadow hover:bg-[#2980B9]">
          + Thêm phòng mới
        </Button>
      </div>
      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số phòng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại phòng</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá phòng (VNĐ)</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rooms && rooms.length > 0 ? (
              rooms.map((room, index) => (
                <tr key={room.id || index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{room.roomNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{room.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">{formatCurrency(room.price)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${STATUS_COLORS[room.status]?.bg || 'bg-gray-100'} text-white`}>
                      {STATUS_COLORS[room.status]?.label || room.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end gap-2">
                    <button onClick={() => openEditForm(room)} className="text-blue-500 hover:text-blue-700 font-bold px-3 py-1 bg-blue-50 rounded transition-colors">
                      Sửa
                    </button>
                    <button onClick={() => handleDeleteRoom(room.id)} className="text-red-500 hover:text-red-700 font-bold px-3 py-1 bg-red-50 rounded transition-colors">
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500 text-sm">
                  Đang tải dữ liệu phòng...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRoom ? "SỬA THÔNG TIN PHÒNG" : "THÊM PHÒNG MỚI"}>
        <form onSubmit={handleSaveRoom}>
          <Input label="Số phòng" name="roomNumber" defaultValue={editingRoom?.roomNumber || ""} required />
          <div className="mb-4">
            <label className="block text-[#2C3E50] text-sm font-medium mb-1.5">Loại phòng</label>
            <select name="type" defaultValue={editingRoom?.type || "Standard"} className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#3498DB]">
              <option value="Standard">Standard (Tiêu chuẩn)</option>
              <option value="Deluxe">Deluxe (Cao cấp)</option>
              <option value="VIP">VIP (Thương gia)</option>
            </select>
          </div>
          <Input label="Giá phòng (VNĐ)" name="price" type="number" defaultValue={editingRoom?.price || ""} required />
          <div className="mb-4">
            <label className="block text-[#2C3E50] text-sm font-medium mb-1.5">Trạng thái</label>
            <select name="status" defaultValue={editingRoom?.status === 'OCCUPIED' ? 'Đang ở' : 'Sẵn sàng'} className="w-full border border-gray-300 rounded-md px-3 py-2 outline-none focus:border-[#3498DB]">
              <option value="Sẵn sàng">Sẵn sàng</option>
              <option value="Đang ở">Đang ở</option>
              <option value="Đang dọn">Đang dọn</option>
              <option value="Bảo trì">Bảo trì</option>
            </select>
          </div>
          <div className="flex gap-3 mt-6">
            <Button type="button" variant="outline" className="w-full" onClick={() => setIsModalOpen(false)}>Hủy bỏ</Button>
            <Button type="submit" className="w-full bg-[#3498DB] text-white">Lưu thông tin</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

const AdminBookings = () => {
  const { showToast } = useAppContext();
  const [bookingsList, setBookingsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [invoiceData, setInvoiceData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // --- 🛒 TÍNH NĂNG MỚI: QUẢN LÝ DỊCH VỤ PHÁT SINH ---
  const AVAILABLE_SERVICES = [
    { id: 's1', name: 'Coca Cola / Nước ngọt', price: 20000, icon: '🥤' },
    { id: 's2', name: 'Nước Suối Lavie', price: 10000, icon: '💧' },
    { id: 's3', name: 'Mì Tôm Trứng', price: 35000, icon: '🍜' },
    { id: 's4', name: 'Giặt ủi (kg)', price: 50000, icon: '🧺' },
    { id: 's5', name: 'Spa Massage thư giãn', price: 500000, icon: '💆‍♀️' },
  ];
  
  // [CẬP NHẬT MỚI]: SỬ DỤNG LOCAL STORAGE ĐỂ LƯU CHẶT DỊCH VỤ VÀO TRÌNH DUYỆT (KHÔNG BỊ MẤT KHI F5)
  const [bookingServices, setBookingServices] = useState(() => {
    const savedServices = localStorage.getItem('royalHotelServices');
    return savedServices ? JSON.parse(savedServices) : {};
  });

  // Tự động lưu lại mỗi khi Lễ tân thêm hoặc bớt đồ
  useEffect(() => {
    localStorage.setItem('royalHotelServices', JSON.stringify(bookingServices));
  }, [bookingServices]);

  const [serviceModal, setServiceModal] = useState({ isOpen: false, booking: null });

  const getServiceTotal = (bookingId) => {
    const svcs = bookingServices[bookingId] || [];
    return svcs.reduce((sum, item) => sum + (item.price * item.qty), 0);
  };

  const handleAddService = (service) => {
    const bId = serviceModal.booking.MaDatPhong;
    setBookingServices(prev => {
      const currentSvcs = prev[bId] || [];
      const existing = currentSvcs.find(s => s.id === service.id);
      if (existing) {
        return { ...prev, [bId]: currentSvcs.map(s => s.id === service.id ? { ...s, qty: s.qty + 1 } : s) };
      }
      return { ...prev, [bId]: [...currentSvcs, { ...service, qty: 1 }] };
    });
  };

  const handleRemoveService = (serviceId) => {
    const bId = serviceModal.booking.MaDatPhong;
    setBookingServices(prev => {
      const currentSvcs = prev[bId] || [];
      const existing = currentSvcs.find(s => s.id === serviceId);
      if (existing && existing.qty > 1) {
        return { ...prev, [bId]: currentSvcs.map(s => s.id === serviceId ? { ...s, qty: s.qty - 1 } : s) };
      }
      return { ...prev, [bId]: currentSvcs.filter(s => s.id !== serviceId) };
    });
  };
  // ----------------------------------------------------

  const fetchBookings = async () => {
    try {
      const response = await fetch("https://royal-hotel-6xe9.onrender.com/api/datphong");
      if (response.ok) {
        const data = await response.json();
        setBookingsList(data);
      }
    } catch (error) {
      console.error("Lỗi tải đơn:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleUpdateStatus = async (bookingId, roomId, newStatus, fullBookingData = null) => {
    if (!window.confirm(`Xác nhận chuyển trạng thái đơn thành: ${newStatus}?`)) return;
    try {
      const response = await fetch(`https://royal-hotel-6xe9.onrender.com/api/datphong/${bookingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ TrangThai: newStatus, MaPhong: roomId }),
      });
      if (response.ok) {
        showToast(`Đã chuyển sang: ${newStatus}`, "success");
        fetchBookings();
        if (newStatus === 'Đã trả phòng' && fullBookingData) {
          setInvoiceData(fullBookingData);
        }
      } else {
        showToast("Lỗi khi cập nhật đơn", "error");
      }
    } catch (error) {
      showToast("Không thể kết nối server", "error");
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBookings = bookingsList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(bookingsList.length / itemsPerPage);
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="p-4 lg:p-8 animate-fade-in-up">
      <style>
        {`
          @media print {
            body * { visibility: hidden; }
            #printable-invoice, #printable-invoice * { visibility: visible; }
            #printable-invoice { position: absolute; left: 0; top: 0; width: 100%; }
            body, html, div { overflow: visible !important; height: auto !important; }
            .no-print { display: none !important; }
          }
        `}
      </style>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0B315F]">Quản lý Đơn đặt phòng</h2>
          <p className="text-gray-500 text-sm mt-1">Duyệt đơn, thêm dịch vụ và thanh toán hóa đơn</p>
        </div>
      </div>
      
      <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Mã Đơn</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Khách hàng</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Số Phòng</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Nhận - Trả</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Trạng thái</th>
              <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {isLoading ? (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Đang tải dữ liệu...</td></tr>
            ) : currentBookings.length > 0 ? (
              currentBookings.map((b, index) => (
                <tr key={b.MaDatPhong || index} className="hover:bg-blue-50/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap font-black text-[#3498DB]">#{b.MaDatPhong}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    <p className="font-bold text-gray-800">{b.TenKhachHang}</p>
                    <p className="text-xs text-gray-500">{b.SoDienThoai}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-black text-[#D9AC2B] text-lg">{b.SoPhong}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    <p className="text-sm font-medium">Từ: {formatDate(b.NgayNhan)}</p>
                    <p className="text-sm font-medium">Đến: {formatDate(b.NgayTra)}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1.5 text-xs font-bold rounded-lg 
                      ${b.TrangThai === 'Chờ duyệt' ? 'bg-yellow-100 text-yellow-700' : 
                        b.TrangThai === 'Đã duyệt' ? 'bg-green-100 text-green-700' : 
                        b.TrangThai === 'Đã trả phòng' ? 'bg-gray-200 text-gray-700' : 'bg-red-100 text-red-700'}`}>
                      {b.TrangThai}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                    {b.TrangThai === 'Chờ duyệt' && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleUpdateStatus(b.MaDatPhong, b.MaPhong, 'Đã duyệt')} className="bg-[#2ECC71] hover:bg-[#27AE60] text-white px-4 py-1.5 rounded-lg shadow-sm font-bold transition-all">Duyệt đơn</button>
                        <button onClick={() => handleUpdateStatus(b.MaDatPhong, b.MaPhong, 'Đã hủy')} className="bg-[#E74C3C] hover:bg-[#C0392B] text-white px-4 py-1.5 rounded-lg shadow-sm font-bold transition-all">Hủy</button>
                      </div>
                    )}
                    {b.TrangThai === 'Đã duyệt' && (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => setServiceModal({ isOpen: true, booking: b })} className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-1.5 rounded-lg shadow-sm font-bold transition-all flex items-center gap-1">
                          <span>🍹</span> Dịch vụ
                        </button>
                        <button onClick={() => handleUpdateStatus(b.MaDatPhong, b.MaPhong, 'Đã trả phòng', b)} className="bg-[#3498DB] hover:bg-[#2980B9] text-white px-4 py-1.5 rounded-lg shadow-sm font-bold transition-all">
                          Trả phòng
                        </button>
                      </div>
                    )}
                    {b.TrangThai === 'Đã trả phòng' && (
                      <button onClick={() => setInvoiceData(b)} className="bg-[#0B315F] hover:bg-[#072140] text-white px-4 py-1.5 rounded-lg shadow-sm font-bold transition-all">Xem Hóa Đơn</button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Chưa có đơn đặt phòng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6 no-print">
          <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="px-4 py-2 rounded-lg font-bold text-sm bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 border border-gray-200">Trước</button>
          {[...Array(totalPages)].map((_, index) => (
            <button key={index} onClick={() => paginate(index + 1)} className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentPage === index + 1 ? 'bg-[#3498DB] text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'}`}>
              {index + 1}
            </button>
          ))}
          <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="px-4 py-2 rounded-lg font-bold text-sm bg-white text-gray-700 disabled:opacity-50 hover:bg-gray-50 border border-gray-200">Sau</button>
        </div>
      )}

      {/* MODAL THÊM DỊCH VỤ PHÁT SINH */}
      <Modal isOpen={serviceModal.isOpen} onClose={() => setServiceModal({ isOpen: false, booking: null })} title="THÊM DỊCH VỤ PHÁT SINH" width="max-w-2xl">
        {serviceModal.booking && (
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h4 className="font-bold text-[#0B315F] mb-4">Danh mục dịch vụ</h4>
              <div className="space-y-3">
                {AVAILABLE_SERVICES.map(svc => (
                  <div key={svc.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100 hover:border-blue-300 transition-all cursor-pointer group" onClick={() => handleAddService(svc)}>
                    <div className="flex items-center gap-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{svc.icon}</span>
                      <div>
                        <p className="font-bold text-gray-800 text-sm">{svc.name}</p>
                        <p className="text-blue-600 font-semibold text-xs">{svc.price.toLocaleString('vi-VN')} đ</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-white border border-gray-200 text-gray-400 group-hover:text-blue-500 group-hover:border-blue-500 flex items-center justify-center font-bold">+</button>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex-1 bg-[#F8FAFC] p-4 rounded-xl border border-gray-100">
              <h4 className="font-bold text-[#0B315F] mb-4">Đã chọn (Phòng {serviceModal.booking.SoPhong})</h4>
              <div className="space-y-3 min-h-[200px]">
                {bookingServices[serviceModal.booking.MaDatPhong]?.length > 0 ? (
                  bookingServices[serviceModal.booking.MaDatPhong].map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800 text-sm">{item.name}</p>
                        <p className="text-gray-500 text-xs">{item.price.toLocaleString('vi-VN')} đ</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button onClick={() => handleRemoveService(item.id)} className="w-6 h-6 rounded bg-red-50 text-red-500 flex items-center justify-center font-bold hover:bg-red-100">-</button>
                        <span className="font-bold">{item.qty}</span>
                        <button onClick={() => handleAddService(item)} className="w-6 h-6 rounded bg-blue-50 text-blue-500 flex items-center justify-center font-bold hover:bg-blue-100">+</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 py-10 text-sm font-medium">Chưa chọn dịch vụ nào</div>
                )}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                <span className="font-bold text-gray-600">Tổng tạm tính:</span>
                <span className="text-lg font-black text-red-500">{getServiceTotal(serviceModal.booking.MaDatPhong).toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* MODAL HÓA ĐƠN ĐÃ CẬP NHẬT */}
      <Modal isOpen={!!invoiceData} onClose={() => setInvoiceData(null)} title="CHI TIẾT HÓA ĐƠN" width="max-w-xl">
        {invoiceData && (
          <div>
            <div id="printable-invoice" className="p-8 bg-white border border-gray-100 rounded-2xl shadow-sm">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-tr from-[#3498DB] to-[#2980B9] rounded-xl mb-3 shadow-md">
                  <span className="text-2xl text-white">🏨</span>
                </div>
                <h2 className="text-3xl font-black text-[#0B315F] tracking-widest">ROYAL<span className="text-[#D9AC2B]">HOTEL</span></h2>
                <p className="text-gray-500 font-medium">Hóa đơn thanh toán dịch vụ lưu trú</p>
                <p className="text-xs text-gray-400 mt-2 font-medium bg-gray-50 inline-block px-3 py-1 rounded-full border border-gray-100">Mã: INV-{invoiceData.MaDatPhong}-2026</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6 pb-6 border-b border-gray-100">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Khách hàng</p>
                  <p className="font-bold text-lg text-gray-800">{invoiceData.TenKhachHang}</p>
                  <p className="text-sm font-medium text-gray-500">{invoiceData.SoDienThoai}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Số phòng</p>
                  <p className="font-black text-3xl text-[#3498DB]">{invoiceData.SoPhong}</p>
                </div>
              </div>

              <div className="mb-6 space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Ngày nhận:</span>
                  <span className="font-bold text-gray-800">{formatDate(invoiceData.NgayNhan)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 font-medium">Ngày trả:</span>
                  <span className="font-bold text-gray-800">{formatDate(invoiceData.NgayTra)}</span>
                </div>
                
                {/* HIỂN THỊ TIỀN PHÒNG & DỊCH VỤ TRONG HÓA ĐƠN */}
                <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                  <div className="flex justify-between mb-2">
                    <span className="font-bold text-gray-700">1. Tiền phòng:</span>
                    <span className="font-bold text-gray-800">{invoiceData.TongTien ? invoiceData.TongTien.toLocaleString('vi-VN') : 0} đ</span>
                  </div>
                  
                  {bookingServices[invoiceData.MaDatPhong] && bookingServices[invoiceData.MaDatPhong].length > 0 && (
                    <div className="mb-2">
                      <span className="font-bold text-gray-700 mb-1 block">2. Dịch vụ phát sinh:</span>
                      {bookingServices[invoiceData.MaDatPhong].map(svc => (
                        <div key={svc.id} className="flex justify-between text-sm pl-4 mb-1">
                          <span className="text-gray-500">- {svc.name} (x{svc.qty})</span>
                          <span className="font-medium text-gray-700">{(svc.price * svc.qty).toLocaleString('vi-VN')} đ</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t-2 border-[#0B315F]">
                  <span className="text-lg font-black text-[#0B315F] uppercase">Tổng Thanh Toán:</span>
                  <span className="text-2xl font-black text-red-600">
                    {((invoiceData.TongTien || 0) + getServiceTotal(invoiceData.MaDatPhong)).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>

              <div className="text-center mt-10 text-gray-500 text-sm font-medium">
                <p>Cảm ơn quý khách đã trải nghiệm dịch vụ tại Royal Hotel!</p>
              </div>
            </div>
            <div className="flex gap-4 mt-6 no-print">
              <button className="w-full bg-gray-100 text-gray-700 font-bold py-3 rounded-xl hover:bg-gray-200 transition-all" onClick={() => setInvoiceData(null)}>Đóng</button>
              <button className="w-full bg-[#2ECC71] hover:bg-[#27AE60] text-white font-bold py-3 rounded-xl shadow-[0_10px_20px_rgba(46,204,113,0.3)] transition-all flex justify-center items-center gap-2" onClick={() => window.print()}>
                🖨️ In Hóa Đơn
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

const AdminCustomers = () => {
  const { customers } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  // --- 📊 TÍNH NĂNG MỚI: XUẤT FILE EXCEL ---
  const handleExportExcel = () => {
    if (filteredCustomers.length === 0) {
      alert("Không có dữ liệu để xuất!");
      return;
    }

    // 1. Chuẩn bị dữ liệu và đổi tên cột tiếng Việt cho chuyên nghiệp
    const exportData = filteredCustomers.map((c, index) => ({
      'STT': index + 1,
      'Mã Khách Hàng': c.code,
      'Họ và Tên': c.name,
      'Số Điện Thoại': c.phone,
      'CCCD / Hộ Chiếu': c.cccd,
      'Địa Chỉ': c.address
    }));

    // 2. Khởi tạo file Excel
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    
    // Tự động căn chỉnh độ rộng các cột cho đẹp
    const wscols = [
      {wch: 5}, {wch: 15}, {wch: 25}, {wch: 15}, {wch: 15}, {wch: 30}
    ];
    worksheet['!cols'] = wscols;

    XLSX.utils.book_append_sheet(workbook, worksheet, "KhachHang");

    // 3. Tự động tải xuống máy tính
    XLSX.writeFile(workbook, "DanhSachKhachHang_RoyalHotel.xlsx");
  };
  // -----------------------------------------

  return (
    <div className="p-4 lg:p-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#0B315F]">Quản lý Hồ sơ Khách hàng</h2>
          <p className="text-gray-500 text-sm mt-1">Lưu trữ và tra cứu thông tin khách lưu trú</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="🔍 Tìm tên hoặc SĐT..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-[#3498DB] w-72 shadow-sm transition-all"
            />
          </div>
          <button 
            onClick={handleExportExcel}
            className="bg-[#27AE60] hover:bg-[#219653] text-white px-5 py-2.5 rounded-xl shadow-sm hover:shadow-md font-bold flex items-center gap-2 transition-all active:scale-95"
          >
            <span>📊</span> Xuất Excel
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-2xl overflow-hidden border border-gray-100">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã KH</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Họ và Tên</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Số Điện Thoại</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">CCCD / Hộ chiếu</th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Địa chỉ</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {filteredCustomers.length > 0 ? filteredCustomers.map((c, i) => (
              <tr key={i} className="hover:bg-blue-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-black text-[#3498DB]">{c.code}</td>
                <td className="px-6 py-4 whitespace-nowrap font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-bold text-xs">
                    {c.name.charAt(0)}
                  </div>
                  {c.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-600">{c.phone}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{c.cccd}</td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-500">{c.address}</td>
              </tr>
            )) : (
              <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-400 font-medium">Không tìm thấy hồ sơ khách hàng nào.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const AdminLayout = () => {
  const { adminView, setAdminView, currentUser, logout } = useAppContext();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Đã bổ sung thêm Menu Khách hàng vào Sidebar
  const MENU_ITEMS = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard, roles: ['ADMIN', 'NHANVIEN'] },
    { id: 'room-map', label: 'Sơ đồ phòng', icon: MapIcon, roles: ['ADMIN', 'NHANVIEN'] },
    { id: 'bookings', label: 'Đặt phòng', icon: CalendarCheck, roles: ['ADMIN', 'NHANVIEN'] },
    { id: 'rooms', label: 'Quản lý phòng', icon: BedDouble, roles: ['ADMIN', 'NHANVIEN'] },
    { id: 'customers', label: 'Khách hàng', icon: Users, roles: ['ADMIN', 'NHANVIEN'] },
  ];

  const renderView = () => {
    switch (adminView) {
      case 'dashboard': return <AdminDashboard />;
      case 'room-map': return <AdminRoomMap />;
      case 'rooms': return <AdminRooms />;
      case 'bookings': return <AdminBookings />;
      case 'customers': return <AdminCustomers />;
      default: return <AdminDashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F7F8] font-['Inter', Arial, sans-serif] text-[#2C3E50]">
      <aside className={`fixed inset-y-0 left-0 z-30 w-[240px] bg-[#0B315F] text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} shadow-2xl`}>
        <div className="h-[70px] flex items-center justify-center border-b border-white/10 shrink-0 bg-black/10">
          <h1 className="text-xl font-black text-[#D9AC2B] tracking-widest uppercase">Royal Hotel</h1>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 flex flex-col gap-1 px-3">
          {MENU_ITEMS.map(item => {
            if (!item.roles.includes(currentUser.role)) return null;
            const isActive = adminView === item.id;
            const IconCmp = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => { setAdminView(item.id); setIsSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl cursor-pointer transition-all duration-200 ${isActive ? 'bg-[#3498DB] text-white font-bold shadow-lg shadow-blue-500/30' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`}
              >
                <IconCmp size={20} className={isActive ? 'text-white' : ''} />
                <span>{item.label}</span>
              </div>
            );
          })}
        </nav>
      </aside>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-[70px] bg-white shadow-sm flex items-center justify-between px-4 lg:px-8 shrink-0 z-10">
          <button className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-md" onClick={() => setIsSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-6 ml-auto">
            <div className="flex items-center gap-4 pl-6">
              <div className="flex flex-col items-end">
                <span className="text-sm font-black text-[#0B315F]">{currentUser.name}</span>
                <span className="text-xs text-gray-500 font-medium">{currentUser.role === 'ADMIN' ? 'Quản trị viên' : 'Nhân viên'}</span>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#3498DB] to-[#2980B9] text-white flex items-center justify-center font-bold shadow-md">
                {currentUser.name.charAt(0)}
              </div>
              <button onClick={logout} className="ml-2 text-gray-400 hover:text-red-500 transition-colors bg-gray-50 p-2 rounded-full hover:bg-red-50" title="Đăng xuất">
                <LogOut size={18}/>
              </button>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8FAFC]">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

// ==========================================
// 6. CUSTOMER VIEWS (GIAO DIỆN KHÁCH SẠN 5 SAO - ĐỘNG & 3D)
// ==========================================
const CustomerRoomsList = () => {
  const { rooms, showToast } = useAppContext();
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("Tất cả");

  const openBookingForm = (room) => {
    setSelectedRoom(room);
    setIsBookingModalOpen(true);
  };

  const handleBookRoom = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const checkInDate = formData.get('checkIn');
    const checkOutDate = formData.get('checkOut');
    if (!checkInDate || !checkOutDate) return alert("Vui lòng chọn ngày!");
    
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const days = Math.ceil((checkOut - checkIn) / (1000 * 3600 * 24));
    if (days <= 0) return alert("Ngày trả phòng phải sau ngày nhận!");

    const roomPrice = selectedRoom.Gia || selectedRoom.price || 0;
    const bookingData = {
      MaPhong: selectedRoom.MaPhong || selectedRoom.id,
      TenKhachHang: formData.get('customerName'),
      SoDienThoai: formData.get('phone'),
      NgayNhan: checkInDate,
      NgayTra: checkOutDate,
      TongTien: days * roomPrice
    };

    try {
      const response = await fetch("https://royal-hotel-6xe9.onrender.com/api/datphong", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bookingData),
      });
      if (response.ok) {
        alert("🎉 Đặt phòng thành công! Đơn của bạn đang chờ duyệt.");
        setIsBookingModalOpen(false);
      } else alert("Có lỗi xảy ra, form chưa được gửi!");
    } catch (error) {
      alert("Không thể kết nối đến server Backend.");
    }
  };

  const availableRooms = rooms.filter(room => {
    const matchSearch = (room.roomNumber || '').toString().toLowerCase().includes(searchTerm.toLowerCase());
    const matchType = filterType === "Tất cả" || room.type === filterType;
    return matchSearch && matchType;
  });

  const uniqueRoomTypes = ["Tất cả", ...new Set(rooms.map(r => r.type))];

  const getRoomImage = (type) => {
    const t = type ? type.toLowerCase() : "";
    if (t.includes('vip')) return "https://images.unsplash.com/photo-1590490360182-c33d57733427?q=80&w=1000&auto=format&fit=crop";
    if (t.includes('deluxe') || t.includes('gia đình')) return "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=1000&auto=format&fit=crop";
    return "https://images.unsplash.com/photo-1611892440504-42a792e24d32?q=80&w=1000&auto=format&fit=crop";
  };

  return (
    <div className="w-full bg-[#f8f9fa] overflow-x-hidden">
      
      {/* 1. HERO BANNER - MÀN HÌNH CHÍNH */}
      <div className="relative h-[85vh] w-full overflow-hidden flex items-center justify-center">
        <div 
          className="absolute inset-0 animate-slow-zoom"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1542314831-c6a4d2748624?q=80&w=2000&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#f8f9fa]"></div>
        
        <div className="relative z-10 text-center px-4 animate-3d-flip">
          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 drop-shadow-[0_5px_5px_rgba(0,0,0,0.5)] tracking-tight">
            Nơi Khởi Nguồn <br/> <span className="text-[#D9AC2B] animate-pulse">Sự Xa Hoa</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 font-light max-w-2xl mx-auto drop-shadow-md">
            Trải nghiệm kỳ nghỉ dưỡng hoàng gia với hệ thống phòng ốc đẳng cấp, tiện nghi vượt trội và dịch vụ tận tâm tại Royal Hotel.
          </p>
          <button onClick={() => document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' })} className="bg-gradient-to-r from-[#D9AC2B] to-[#b38b1b] text-white px-8 py-4 rounded-full font-bold text-lg shadow-[0_10px_20px_rgba(217,172,43,0.4)] hover:scale-110 hover:-translate-y-2 transition-all duration-300 animate-float">
            Khám Phá Phòng Ngay
          </button>
        </div>
      </div>

      {/* 2. DỊCH VỤ NỔI BẬT */}
      <div className="max-w-7xl mx-auto px-8 py-20 relative -mt-20 z-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: '🏊‍♂️', title: 'Hồ Bơi Vô Cực', desc: 'Hồ bơi nước ấm ngắm toàn cảnh thành phố' },
            { icon: '💆‍♀️', title: 'Spa & Relax', desc: 'Thư giãn tuyệt đối với liệu trình thảo mộc' },
            { icon: '🍽️', title: 'Nhà Hàng 5 Sao', desc: 'Ẩm thực Á-Âu được chế biến từ siêu đầu bếp' }
          ].map((item, i) => (
            <div key={i} className="glass-panel p-8 rounded-3xl text-center transform transition-all duration-500 hover:-translate-y-4 hover:shadow-2xl animate-fade-in-up" style={{animationDelay: `${i*0.2}s`}}>
              <div className="text-6xl mb-4 animate-3d-float">{item.icon}</div>
              <h3 className="text-2xl font-bold text-[#0B315F] mb-3">{item.title}</h3>
              <p className="text-gray-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 3. KHU VỰC TÌM KIẾM & ĐẶT PHÒNG */}
      <div id="booking-section" className="max-w-7xl mx-auto px-8 py-16">
        <div className="text-center mb-16 animate-fade-in-up">
          <h2 className="text-4xl font-extrabold text-[#0B315F] mb-4">Lựa Chọn Hoàn Hảo Của Bạn</h2>
          <div className="w-24 h-1 bg-[#D9AC2B] mx-auto rounded-full"></div>
        </div>

        <div className="glass-panel p-6 rounded-2xl mb-12 flex flex-col md:flex-row justify-between items-center gap-6 animate-3d-flip">
          <div className="flex w-full gap-4">
            <input 
              type="text" 
              placeholder="🔍 Nhập số phòng bạn muốn tìm..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-2/3 border-0 bg-white/80 rounded-xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/30 text-lg shadow-inner transition-all"
            />
            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full md:w-1/3 border-0 bg-white/80 rounded-xl px-6 py-4 outline-none focus:ring-4 focus:ring-blue-500/30 text-lg cursor-pointer shadow-inner transition-all"
            >
              {uniqueRoomTypes.map((type, index) => (
                <option key={index} value={type}>{type}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Lưới Thẻ Phòng 3D với Skeleton Load */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {rooms.length === 0 ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl shadow-lg h-96 animate-pulse"></div>
            ))
          ) : availableRooms.length > 0 ? (
            availableRooms.map((room, index) => (
              <div 
                key={room.id || index} 
                className="bg-white rounded-3xl overflow-hidden shadow-lg border border-gray-100 flex flex-col transition-all duration-500 transform hover:-translate-y-4 hover:scale-105 hover:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.3)] animate-3d-flip hover-3d-shine group"
                style={{ animationDelay: `${index * 0.1}s`, animationFillMode: 'both' }}
              >
                <div className="h-64 overflow-hidden relative">
                  <img 
                    src={getRoomImage(room.type)} 
                    alt={`Phòng ${room.roomNumber}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-md text-white text-sm font-bold px-4 py-2 rounded-full border border-white/20 shadow-lg">
                    {room.type}
                  </div>
                </div>
                <div className="p-8 flex-1 relative bg-white">
                  <div className={`absolute -top-6 right-6 w-12 h-12 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${room.status === 'AVAILABLE' ? 'bg-[#2ECC71]' : 'bg-[#E74C3C]'}`}>
                    <span className="text-white font-bold text-xl">{room.status === 'AVAILABLE' ? '✓' : '✗'}</span>
                  </div>
                  
                  <h3 className="text-3xl font-extrabold text-[#0B315F] mb-2">Phòng {room.roomNumber}</h3>
                  <div className="flex items-baseline text-[#D9AC2B] mb-6">
                    <span className="text-3xl font-black">{room.price ? room.price.toLocaleString('vi-VN') : 0}</span>
                    <span className="text-lg font-bold ml-1">VNĐ</span>
                    <span className="text-sm text-gray-500 ml-1">/ đêm</span>
                  </div>

                  {room.status === 'AVAILABLE' ? (
                    <button onClick={() => openBookingForm(room)} className="w-full bg-gradient-to-r from-[#0B315F] to-[#2980B9] text-white py-4 rounded-xl shadow-lg hover:shadow-2xl transition-all font-bold text-lg active:scale-95 group-hover:from-[#2980B9] group-hover:to-[#0B315F]">
                      TIẾN HÀNH ĐẶT PHÒNG
                    </button>
                  ) : (
                    <button disabled className="w-full bg-gray-200 text-gray-500 py-4 rounded-xl cursor-not-allowed font-bold text-lg">
                      ĐÃ KÍN PHÒNG
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 glass-panel rounded-3xl">
              <div className="text-7xl mb-4 animate-3d-float">🔍</div>
              <h3 className="text-2xl font-bold text-[#0B315F] mb-2">Không tìm thấy phòng</h3>
              <p className="text-gray-500">Vui lòng thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          )}
        </div>
      </div>

      {/* 4. FOOTER HIỆN ĐẠI */}
      <footer className="bg-[#0B315F] text-white pt-16 pb-8 border-t-4 border-[#D9AC2B]">
        <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 md:grid-cols-3 gap-12 text-center md:text-left">
          <div>
            <h2 className="text-3xl font-extrabold text-[#D9AC2B] mb-4 tracking-wider">ROYAL HOTEL</h2>
            <p className="text-gray-400 leading-relaxed">Nâng tầm phong cách sống với dịch vụ nghỉ dưỡng cao cấp hàng đầu Việt Nam. Sự hài lòng của bạn là vinh dự của chúng tôi.</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Liên Hệ</h3>
            <p className="text-gray-400 mb-2">📍 Số 1, Đường Lê Duẩn, Quận 1, TP.HCM</p>
            <p className="text-gray-400 mb-2">📞 Hotline: 1900 8888</p>
            <p className="text-gray-400">✉️ Email: booking@royalhotel.com</p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Theo dõi chúng tôi</h3>
            <div className="flex justify-center md:justify-start gap-4">
              {['Facebook', 'Instagram', 'Youtube'].map((m, i) => (
                <span key={i} className="bg-white/10 px-4 py-2 rounded-full cursor-pointer hover:bg-[#D9AC2B] hover:text-white transition-colors">{m}</span>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center text-gray-500 mt-16 pt-8 border-t border-white/10">
          © 2026 Royal Hotel. Phát triển bởi Lê Xuân Bách.
        </div>
      </footer>

      {/* MODAL ĐẶT PHÒNG */}
      <Modal isOpen={isBookingModalOpen} onClose={() => setIsBookingModalOpen(false)} title="ĐẶT PHÒNG HOÀNG GIA">
        {selectedRoom && (
          <form onSubmit={handleBookRoom} className="animate-fade-in-up">
            <div className="mb-6 p-5 bg-gradient-to-r from-blue-50 to-white border-l-4 border-[#3498DB] rounded-r-xl shadow-sm">
              <div className="flex gap-4 items-center">
                <img src={getRoomImage(selectedRoom.type)} className="w-24 h-24 rounded-xl object-cover shadow-md" alt="Room" />
                <div>
                  <h4 className="text-2xl font-black text-[#0B315F]">Phòng {selectedRoom.roomNumber}</h4>
                  <p className="text-gray-500 font-medium mb-1">{selectedRoom.type}</p>
                  <p className="text-[#D9AC2B] font-bold text-xl">{selectedRoom.price ? selectedRoom.price.toLocaleString('vi-VN') : 0} đ <span className="text-sm font-normal text-gray-400">/đêm</span></p>
                </div>
              </div>
            </div>
            
            <div className="space-y-5">
              <Input label="Họ và Tên Khách Hàng" name="customerName" placeholder="Ví dụ: Nguyễn Văn A" required className="w-full border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#3498DB] outline-none transition-all" />
              <Input label="Số điện thoại liên hệ" name="phone" placeholder="Ví dụ: 0987.654.321" required className="w-full border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#3498DB] outline-none transition-all" />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[#0B315F] font-bold mb-2">Nhận phòng</label>
                  <input type="date" name="checkIn" required className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#3498DB] outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-[#0B315F] font-bold mb-2">Trả phòng</label>
                  <input type="date" name="checkOut" required className="w-full border border-gray-300 rounded-xl px-4 py-3 bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#3498DB] outline-none transition-all" />
                </div>
              </div>
            </div>
            
            <button type="submit" className="w-full bg-gradient-to-r from-[#0B315F] to-[#3498DB] hover:from-[#3498DB] hover:to-[#0B315F] text-white py-4 rounded-xl shadow-lg font-bold text-lg transition-all mt-8 active:scale-95">
              XÁC NHẬN ĐẶT PHÒNG NÀY
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

const CustomerLayout = () => {
  const { currentUser, logout } = useAppContext();
  
  return (
    <div className="min-h-screen bg-[#FFFDF0] flex flex-col text-[#2C3E50]">
      <header className="fixed top-0 left-0 right-0 z-50 glass-panel py-4 px-8 flex justify-between items-center animate-fade-in-up">
        <div className="font-extrabold text-2xl tracking-widest text-[#0B315F]">
          ROYAL<span className="text-[#D9AC2B]">HOTEL</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="hidden md:inline font-medium text-gray-700">Xin chào, {currentUser?.name}</span>
          <button onClick={logout} className="bg-red-500 hover:bg-red-600 text-white font-bold px-6 py-2 rounded-full shadow-md hover:shadow-lg transition-all active:scale-95">
            Đăng xuất
          </button>
        </div>
      </header>
      
      <main className="flex-1 w-full">
        <CustomerRoomsList />
      </main>
    </div>
  );
};

// ==========================================
// 7. ROOT COMPONENT
// ==========================================
const AppRoot = () => {
  const { currentUser } = useAppContext();
  return (
    <>
      <Toast />
      {!currentUser ? <LoginView /> : (currentUser.role === 'ADMIN' || currentUser.role === 'NHANVIEN') ? <AdminLayout /> : <CustomerLayout />}
    </>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppRoot />
    </AppProvider>
  );
}
