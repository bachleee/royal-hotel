import api from './api';

// Lấy danh sách đặt phòng hoặc danh sách phòng (tùy thuộc vào backend của bạn)
export const getBookings = async () => {
  try {
    const response = await api.get('/bookings'); // Thay đường dẫn endpoint của FastAPI nếu cần
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy dữ liệu booking:", error);
    throw error;
  }
};