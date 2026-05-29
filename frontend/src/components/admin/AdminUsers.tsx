import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { toggleUserActive, addUserByAdmin, fetchUsers } from '../../redux/authSlice';
import { User } from '../../types';
import { Shield, ShieldAlert, ShieldCheck, UserMinus, UserCheck, Plus, X, Search, Mail, Users } from 'lucide-react';

export const AdminUsers: React.FC = () => {
  const dispatch = useAppDispatch();
  const users = useAppSelector((state) => state.auth.users);

  const [filterQuery, setFilterQuery] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'admin' | 'staff_inventory' | 'customer'>('all');

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  // Form states to Add New Employee
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'staff_inventory'>('staff_inventory');

  const handleRegisterEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail || !formPassword) return;

    dispatch(addUserByAdmin({
      name: formName,
      email: formEmail,
      phone: formPhone,
      password: formPassword,
      role: formRole,
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    }));

    setIsFormOpen(false);
    // Clear forms
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormPassword('');
  };

  const filteredUsersList = users.filter((u) => {
    const q = filterQuery.toLowerCase();
    const inName = u.name.toLowerCase().includes(q);
    const inEmail = u.email.toLowerCase().includes(q);
    
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    return inName || inEmail;
  });

  return (
    <div className="space-y-6 font-sans text-xs">
      
      {/* Search and triggers Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-gray-150 rounded-xl p-4 shadow-xs">
        <div className="flex flex-wrap gap-2 flex-grow">
          <input
            type="text"
            placeholder="Tìm theo tên học viên, email..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="rounded-lg border border-gray-250 px-3 py-1.5 focus:border-indigo-500 max-w-xs font-semibold"
          />

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value as any)}
            className="rounded-lg border border-gray-255 px-3 py-1.5 font-bold"
          >
            <option value="all">Tất cả phân quyền</option>
            <option value="admin">Quản Trị Viên (Admin)</option>
            <option value="staff_inventory">Nhân viên kho (Staff)</option>
            <option value="customer">Khách hàng</option>
          </select>
        </div>

        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-1 rounded-lg bg-indigo-650 px-4 py-2 font-black text-white hover:bg-indigo-750 transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Thêm Nhân Viên Hệ Thống
        </button>
      </div>

      {/* Register Staff Overlay Form */}
      {isFormOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsFormOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-xl shadow-2xl p-6 border border-gray-150 z-10 space-y-4">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <span className="text-sm font-black uppercase text-gray-500 tracking-wider flex items-center gap-1">
                <Shield className="h-4.5 w-4.5 text-indigo-550" />
                Cấp tài khoản nhân viên mới
              </span>
              <button onClick={() => setIsFormOpen(false)} className="p-1 rounded-full text-gray-400 hover:bg-gray-100">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleRegisterEmployee} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Họ và Tên Nhân Viên *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ví dụ: Trần Nhân Viên"
                  className="w-full rounded-lg border border-gray-250 px-3.5 py-2"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Email Đăng Nhập *</label>
                <input
                  type="email"
                  required
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="employee@ecommerce.vn"
                  className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Số Điện Thoại</label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="0911xxxxxx"
                  className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Mật khẩu khởi tạo *</label>
                <input
                  type="password"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-gray-250 px-3.5 py-2 font-mono"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1 uppercase tracking-wider">Phân quyền đặc quyền *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as any)}
                  className="w-full rounded-lg border border-gray-250 px-3 py-2 font-bold"
                >
                  <option value="staff_inventory">Nhân Viên Kho (Chỉ xem và đóng hàng)</option>
                  <option value="admin">Quản Trị Viên (Admin toàn quyền)</option>
                </select>
                <span className="block text-[10px] text-gray-400 mt-1 leading-snug">
                  💡 Nhân viên kho bị hạn chế quyền sửa đổi danh mục, cấu trúc website và quản lý số lượng người dùng khác.
                </span>
              </div>

              <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="rounded-lg bg-white border border-gray-250 px-4 py-2 text-gray-500 font-bold hover:bg-gray-100"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-650 px-5 py-2 text-white font-black uppercase hover:bg-indigo-750"
                >
                  Khởi Tạo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Spreadsheet Listing grid details */}
      <div className="bg-white border border-gray-150 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-gray-500">
            <thead className="bg-gray-50 text-[10.5px] text-gray-400 uppercase tracking-wider border-b border-gray-100">
              <tr>
                <th className="py-3 px-4">Thành Viên</th>
                <th className="px-4">Địa Chỉ Liên Hệ</th>
                <th className="px-4">Chức Danh / Quyền</th>
                <th className="px-4">Trạng Thái Khoá</th>
                <th className="px-4 text-right">Lựa chọn</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium text-gray-750">
              {filteredUsersList.map((u) => (
                <tr key={u.id} className="hover:bg-gray-55/30">
                  {/* Photo profile and Name */}
                  <td className="py-3.5 px-4 flex items-center gap-3">
                    <img src={u.avatar} alt={u.name} className="h-9 w-9 rounded-full object-cover border" />
                    <div>
                      <span className="font-bold text-gray-900 block">{u.name}</span>
                      <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{u.id}</span>
                    </div>
                  </td>

                  {/* Contact details */}
                  <td className="px-4 leading-normal">
                    <span className="font-mono text-gray-905 block">{u.email}</span>
                    <span className="text-[10px] text-gray-400 block font-mono mt-0.5">{u.phone || 'Trống số điện thoại'}</span>
                  </td>

                  {/* Role flags */}
                  <td className="px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                      u.role === 'admin' ? 'bg-red-50 text-red-650 border border-red-100' :
                      u.role === 'staff_inventory' ? 'bg-cyan-50 text-cyan-650 border border-cyan-100' :
                      'bg-indigo-50 text-indigo-650 border border-indigo-100'
                    }`}>
                      {u.role === 'admin' ? 'Quản Trị Viên' :
                       u.role === 'staff_inventory' ? 'Nhân Viên Kho' : 'Khách Hàng'}
                    </span>
                  </td>

                  {/* Active lock tags */}
                  <td className="px-4">
                    {u.active ? (
                      <span className="text-green-600 font-bold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-green-500"></span>
                        Đang hoạt động
                      </span>
                    ) : (
                      <span className="text-red-500 font-bold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-red-500"></span>
                        Đã tạm khoá
                      </span>
                    )}
                  </td>

                  {/* Locking trigger controls */}
                  <td className="px-4 text-right">
                    <div className="flex gap-2 justify-end">
                      {/* Toggle locked / active user profile */}
                      <button
                        onClick={() => dispatch(toggleUserActive(u.id))}
                        className={`p-1 px-3 border rounded-lg font-bold transition flex items-center gap-1 ${
                          u.active
                            ? 'border-amber-200 hover:bg-amber-50 text-amber-600'
                            : 'border-green-200 hover:bg-green-50 text-green-600'
                        }`}
                      >
                        {u.active ? (
                          <>
                            <ShieldCheck className="h-3.5 w-3.5 inline text-amber-500 animate-pulse" />
                            Khóa tài khoản
                          </>
                        ) : (
                          <>
                            <Shield className="h-3.5 w-3.5 inline text-green-500" />
                            Mở khóa
                          </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
