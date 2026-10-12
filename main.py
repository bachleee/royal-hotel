from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import psycopg2
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

# Chuỗi kết nối Neon Postgres của bạn
DB_CONN_STR = "postgresql://neondb_owner:npg_m1EWhevZuA2B@ep-raspy-mode-b3af4k2k-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

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
    conn = psycopg2.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM PHONG")
    
    danh_sach_phong = []
    for row in cursor.fetchall():
        phong = {
            "MaPhong": row[0],
            "SoPhong": row[1],
            "LoaiPhong": row[2],
            "Gia": float(row[3]),
            "TrangThai": row[4]
        }
        danh_sach_phong.append(phong)
        
    conn.close()
    return danh_sach_phong

@app.post("/api/phong")
def them_phong(phong: PhongCreate):
    conn = psycopg2.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO PHONG (MaPhong, SoPhong, LoaiPhong, Gia, TrangThai) VALUES (%s, %s, %s, %s, %s)",
        (phong.MaPhong, phong.SoPhong, phong.LoaiPhong, phong.Gia, phong.TrangThai)
    )
    conn.commit()
    conn.close()
    return {"message": "Thêm phòng thành công!"}

@app.delete("/api/phong/{ma_phong}")
def xoa_phong(ma_phong: int):
    conn = psycopg2.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute("DELETE FROM PHONG WHERE MaPhong = %s", (ma_phong,))
    conn.commit()
    conn.close()
    return {"message": "Xóa phòng thành công!"}

@app.put("/api/phong/{ma_phong}")
def sua_phong(ma_phong: int, phong: PhongCreate):
    conn = psycopg2.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE PHONG SET SoPhong = %s, LoaiPhong = %s, Gia = %s, TrangThai = %s WHERE MaPhong = %s",
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
    conn = psycopg2.connect(DB_CONN_STR)
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
            "TongTien": float(row[7]),
            "TrangThai": row[8]
        })
    conn.close()
    return danh_sach

@app.post("/api/datphong")
def tao_don_dat_phong(don: DatPhongCreate):
    conn = psycopg2.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO DATPHONG (MaPhong, TenKhachHang, SoDienThoai, NgayNhan, NgayTra, TongTien, TrangThai) VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (don.MaPhong, don.TenKhachHang, don.SoDienThoai, don.NgayNhan, don.NgayTra, don.TongTien, 'Chờ duyệt')
    )
    conn.commit()
    conn.close()
    return {"message": "Đặt phòng thành công!"}

@app.put("/api/datphong/{ma_dat_phong}")
def cap_nhat_dat_phong(ma_dat_phong: int, data: DatPhongUpdate):
    conn = psycopg2.connect(DB_CONN_STR)
    cursor = conn.cursor()
    cursor.execute("UPDATE DATPHONG SET TrangThai = %s WHERE MaDatPhong = %s", (data.TrangThai, ma_dat_phong))
    
    if data.TrangThai == 'Đã duyệt':
        cursor.execute("UPDATE PHONG SET TrangThai = 'Đang ở' WHERE MaPhong = %s", (data.MaPhong,))
    elif data.TrangThai == 'Đã hủy' or data.TrangThai == 'Đã trả phòng':
        cursor.execute("UPDATE PHONG SET TrangThai = 'Sẵn sàng' WHERE MaPhong = %s", (data.MaPhong,))
        
    conn.commit()
    conn.close()
    return {"message": "Cập nhật đơn thành công!"}

# ==========================================
# --- API THỐNG KÊ TỔNG QUAN ---
# ==========================================
@app.get("/api/thongke")
def thong_ke_tong_quan():
    conn = psycopg2.connect(DB_CONN_STR)
    cursor = conn.cursor()
    
    cursor.execute("SELECT COUNT(*) FROM PHONG")
    tong_phong = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM PHONG WHERE TrangThai = 'Sẵn sàng'")
    phong_trong = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT COUNT(*) FROM DATPHONG")
    tong_don = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT SUM(TongTien) FROM DATPHONG WHERE TrangThai IN ('Đã duyệt', 'Đã trả phòng')")
    doanh_thu = cursor.fetchone()[0] or 0
    
    conn.close()
    return {
        "tongPhong": tong_phong,
        "phongTrong": phong_trong,
        "tongDon": tong_don,
        "doanhThu": doanh_thu
    }