from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pyodbc
from pydantic import BaseModel

app = FastAPI()

# Cấu hình CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"], 
    allow_headers=["*"],
)

# Chuỗi kết nối
DB_CONN_STR = r"DRIVER={ODBC Driver 17 for SQL Server};SERVER=.\SQLEXPRESS;DATABASE=RoyalHotel;Trusted_Connection=yes;"

# --- KHAI BÁO CẤU TRÚC DỮ LIỆU ---
class PhongCreate(BaseModel):
    MaPhong: int
    SoPhong: str
    LoaiPhong: str
    Gia: float
    TrangThai: str

class DatPhongCreate(BaseModel):
    MaPhong: int
    TenKhachHang: str
    SoDienThoai: str
    NgayNhan: str
    NgayTra: str
    TongTien: float

class DatPhongUpdate(BaseModel):
    TrangThai: str
    MaPhong: int

# ==========================================
# --- API QUẢN LÝ PHÒNG ---
# ==========================================
@app.get("/api/phong")
def lay_danh_sach_phong():
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM PHONG")
    
    danh_sach_phong = []
    for row in cursor.fetchall():
        phong = {
            "MaPhong": row[0],
            "SoPhong": row[1],
            "LoaiPhong": row[2],
            "Gia": row[3],
            "TrangThai": row[4]
        }
        danh_sach_phong.append(phong)
        
    conn.close()
    return danh_sach_phong

@app.post("/api/phong")
def them_phong(phong: PhongCreate):
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO PHONG (MaPhong, SoPhong, LoaiPhong, Gia, TrangThai) VALUES (?, ?, ?, ?, ?)",
        (phong.MaPhong, phong.SoPhong, phong.LoaiPhong, phong.Gia, phong.TrangThai)
    )
    conn.commit()
    conn.close()
    return {"message": "Thêm phòng thành công!"}

@app.delete("/api/phong/{ma_phong}")
def xoa_phong(ma_phong: int):
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM PHONG WHERE MaPhong = ?", ma_phong)
    conn.commit()
    conn.close()
    return {"message": "Xóa phòng thành công!"}

@app.put("/api/phong/{ma_phong}")
def sua_phong(ma_phong: int, phong: PhongCreate):
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE PHONG SET SoPhong = ?, LoaiPhong = ?, Gia = ?, TrangThai = ? WHERE MaPhong = ?",
        (phong.SoPhong, phong.LoaiPhong, phong.Gia, phong.TrangThai, ma_phong)
    )
    conn.commit()
    conn.close()
    return {"message": "Cập nhật phòng thành công!"}

# ==========================================
# --- API QUẢN LÝ ĐẶT PHÒNG ---
# ==========================================
@app.get("/api/datphong")
def lay_danh_sach_dat_phong():
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute('''
        SELECT d.MaDatPhong, d.MaPhong, p.SoPhong, d.TenKhachHang, 
               d.SoDienThoai, d.NgayNhan, d.NgayTra, d.TongTien, d.TrangThai
        FROM DATPHONG d
        JOIN PHONG p ON d.MaPhong = p.MaPhong
    ''')
    danh_sach = []
    for row in cursor.fetchall():
        danh_sach.append({
            "MaDatPhong": row[0],
            "MaPhong": row[1],
            "SoPhong": row[2],
            "TenKhachHang": row[3],
            "SoDienThoai": row[4],
            "NgayNhan": str(row[5]),
            "NgayTra": str(row[6]),
            "TongTien": row[7],
            "TrangThai": row[8]
        })
    conn.close()
    return danh_sach

@app.post("/api/datphong")
def tao_don_dat_phong(don: DatPhongCreate):
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO DATPHONG (MaPhong, TenKhachHang, SoDienThoai, NgayNhan, NgayTra, TongTien, TrangThai) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (don.MaPhong, don.TenKhachHang, don.SoDienThoai, don.NgayNhan, don.NgayTra, don.TongTien, 'Chờ duyệt')
    )
    conn.commit()
    conn.close()
    return {"message": "Đặt phòng thành công!"}

@app.put("/api/datphong/{ma_dat_phong}")
def cap_nhat_dat_phong(ma_dat_phong: int, data: DatPhongUpdate):
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute("UPDATE DATPHONG SET TrangThai = ? WHERE MaDatPhong = ?", (data.TrangThai, ma_dat_phong))
    
    # Ở đây dùng dấu nháy đơn '...' của Python thay vì N'...'
    if data.TrangThai == 'Đã duyệt':
        cursor.execute("UPDATE PHONG SET TrangThai = N'Đang ở' WHERE MaPhong = ?", data.MaPhong)
    elif data.TrangThai == 'Đã hủy' or data.TrangThai == 'Đã trả phòng':
        cursor.execute("UPDATE PHONG SET TrangThai = N'Sẵn sàng' WHERE MaPhong = ?", data.MaPhong)
        
    conn.commit()
    conn.close()
    return {"message": "Cập nhật đơn thành công!"}
# ==========================================
# --- API THỐNG KÊ TỔNG QUAN ---
# ==========================================
@app.get("/api/thongke")
def thong_ke_tong_quan():
    conn = pyodbc.connect(DB_CONN_STR)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM PHONG")
    tong_phong = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM PHONG WHERE TrangThai = N'Sẵn sàng'")
    phong_trong = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM DATPHONG")
    tong_don = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT SUM(TongTien) FROM DATPHONG WHERE TrangThai IN (N'Đã duyệt', N'Đã trả phòng')")
    doanh_thu = cursor.fetchone()[0] or 0
    
    conn.close()
    return {
        "tongPhong": tong_phong,
        "phongTrong": phong_trong,
        "tongDon": tong_don,
        "doanhThu": doanh_thu
    }
