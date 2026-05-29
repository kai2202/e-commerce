import React, { useState, useEffect } from 'react';
import { useAppSelector, useAppDispatch } from '../../redux/hooks';
import { fetchAllOrders } from '../../redux/orderSlice';
import { fetchProducts } from '../../redux/shopSlice';
import { fetchUsers } from '../../redux/authSlice';
import { Users, Package, ShoppingBag, DollarSign, TrendingUp, TrendingDown, Clock, CheckCircle, XCircle, AlertTriangle, Sparkles, Inbox } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

/* ─── SVG Sparkline Component ─── */
const Sparkline: React.FC<{ data: number[]; color?: string }> = ({ data, color = '#D2FC38' }) => {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 160;
  const h = 36;
  const step = w / (data.length - 1);

  const points = data.map((v, i) => ({
    x: i * step,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }));

  const linePath = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${h} L${points[0].x},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-9 mt-2" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`spark-grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.35} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
        <filter id="glow-volt">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={areaPath} fill={`url(#spark-grad-${color.replace('#', '')})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#glow-volt)" />
    </svg>
  );
};

export const AdminDashboard: React.FC = () => {
  const dispatch = useAppDispatch();
  const orders = useAppSelector((state) => state.order.orders);
  const products = useAppSelector((state) => state.shop.products);
  const users = useAppSelector((state) => state.auth.users);
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    dispatch(fetchAllOrders());
    dispatch(fetchProducts());
    dispatch(fetchUsers());
  }, [dispatch]);

  const formatVND = (num: number) => {
    return num.toLocaleString('vi-VN') + ' ₫';
  };

  const formatCompact = (num: number) => {
    if (num >= 1_000_000_000) return (num / 1_000_000_000).toFixed(1) + 'B';
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
    return num.toString();
  };

  // Summary Metrics
  const approvedOrders = orders.filter((o) => o.status === 'shipping' || o.status === 'completed');
  const revenueSum = approvedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalOrdersCount = orders.length;
  const customersCount = users.filter((u) => u.role === 'customer').length;
  const productsCount = products.length;

  // Low stock warnings
  const lowStockWarnings = products.flatMap((p) => {
    return p.variants
      .filter((v) => v.stock <= 5)
      .map((v) => ({
        productName: p.name,
        brand: p.brand,
        color: v.color,
        size: v.size,
        stock: v.stock,
      }));
  });

  // Top sellers
  const topSellers = [...products]
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  // Generate sparkline-style data from orders
  const revenueSparkData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return orders
      .filter((o) => new Date(o.date).toISOString().split('T')[0] === dateStr && (o.status === 'shipping' || o.status === 'completed'))
      .reduce((s, o) => s + o.total, 0);
  });

  const ordersSparkData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    return orders.filter((o) => new Date(o.date).toISOString().split('T')[0] === dateStr).length;
  });

  // Chart data
  const getChartData = () => {
    const groups: Record<string, { date: string; doanhThu: number; donHang: number }> = {};
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      groups[dateStr] = { date: dateStr, doanhThu: 0, donHang: 0 };
    }

    orders.forEach((o) => {
      const dateStr = new Date(o.date).toISOString().split('T')[0];
      const isApproved = o.status === 'shipping' || o.status === 'completed';
      const rev = isApproved ? o.total : 0;
      
      if (groups[dateStr]) {
        groups[dateStr].doanhThu += rev;
        groups[dateStr].donHang += 1;
      } else {
        groups[dateStr] = { date: dateStr, doanhThu: rev, donHang: 1 };
      }
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  };

  const chartData = getChartData();

  // KPI Cards Data
  const kpiCards = [
    {
      label: 'DOANH THU',
      value: formatCompact(revenueSum),
      detail: `${approvedOrders.length} đơn duyệt`,
      growth: '+12.5%',
      positive: true,
      icon: DollarSign,
      sparkData: revenueSparkData,
    },
    {
      label: 'ĐƠN HÀNG',
      value: totalOrdersCount.toString(),
      detail: `${orders.filter((o) => o.status === 'pending').length} chờ duyệt`,
      growth: '+8.3%',
      positive: true,
      icon: ShoppingBag,
      sparkData: ordersSparkData,
    },
    {
      label: 'SẢN PHẨM',
      value: productsCount.toString(),
      detail: `${lowStockWarnings.length} cảnh báo kho`,
      growth: lowStockWarnings.length > 0 ? `-${lowStockWarnings.length}` : '+0',
      positive: lowStockWarnings.length === 0,
      icon: Package,
      sparkData: [productsCount, productsCount + 2, productsCount - 1, productsCount + 3, productsCount, productsCount + 1, productsCount],
    },
    {
      label: 'THÀNH VIÊN',
      value: customersCount.toString(),
      detail: 'Đã đăng ký',
      growth: '+5.7%',
      positive: true,
      icon: Users,
      sparkData: [customersCount - 2, customersCount - 1, customersCount, customersCount, customersCount + 1, customersCount + 1, customersCount],
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Header with Time Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-neutral-900 uppercase tracking-widest font-display">
            PHÂN TÍCH & BÁO CÁO
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Theo dõi hiệu suất bán hàng thời gian thực.
          </p>
        </div>

        {/* Time Filter — Pill Style */}
        <div className="flex bg-neutral-900 rounded-full p-1 shrink-0 self-start">
          {[
            { id: 'day', label: 'HÔM NAY' },
            { id: 'week', label: '7 NGÀY' },
            { id: 'month', label: 'THÁNG' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setTimePeriod(item.id as any)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all duration-200 font-display ${
                timePeriod === item.id
                  ? 'text-black shadow-lg'
                  : 'text-neutral-500 hover:text-white'
              }`}
              style={timePeriod === item.id ? { backgroundColor: '#D2FC38' } : undefined}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* ──── ATHLETIC KPI BLOCKS ──── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => {
          const IconComp = kpi.icon;
          return (
            <div
              key={idx}
              className="relative bg-white border border-neutral-200 rounded-2xl p-5 overflow-hidden group hover:border-neutral-900 transition-all duration-300"
            >
              {/* Top Row: Icon + Growth Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-neutral-950 flex items-center justify-center">
                  <IconComp className="h-5 w-5" style={{ color: '#D2FC38' }} />
                </div>
                <span
                  className={`text-[11px] font-black px-2.5 py-1 rounded-full font-display tracking-wider ${
                    kpi.positive
                      ? 'text-black'
                      : 'bg-red-50 text-red-600'
                  }`}
                  style={kpi.positive ? { backgroundColor: '#D2FC3830', color: '#5a7a00' } : undefined}
                >
                  {kpi.growth}
                </span>
              </div>

              {/* Metric */}
              <span className="block text-3xl font-black text-neutral-900 font-display tracking-tight leading-none">
                {kpi.value}
              </span>
              <span className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mt-1 font-display">
                {kpi.label}
              </span>
              <span className="block text-[10px] text-neutral-400 mt-0.5">
                {kpi.detail}
              </span>

              {/* SVG Sparkline */}
              <Sparkline data={kpi.sparkData} />
            </div>
          );
        })}
      </div>

      {/* ──── CHARTS ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
          <div className="flex justify-between items-center border-b border-neutral-100 pb-3">
            <span className="text-[11px] font-black uppercase text-neutral-400 tracking-widest flex items-center gap-2 font-display">
              <TrendingUp className="h-4 w-4" style={{ color: '#D2FC38' }} />
              XU HƯỚNG DOANH THU (VND)
            </span>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDoanhThu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#D2FC38" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#D2FC38" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="date" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderRadius: '12px', border: 'none', fontSize: '11px', color: '#fff' }}
                  formatter={(value) => [formatVND(value as number), 'Doanh thu']}
                  labelStyle={{ color: '#D2FC38', fontWeight: 800 }}
                />
                <Area type="monotone" dataKey="doanhThu" stroke="#D2FC38" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDoanhThu)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
          <span className="text-[11px] font-black uppercase text-neutral-400 tracking-widest block border-b border-neutral-100 pb-3 font-display">
            SẢN LƯỢNG ĐƠN HÀNG
          </span>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                <XAxis dataKey="date" stroke="#a3a3a3" fontSize={10} tickLine={false} />
                <YAxis stroke="#a3a3a3" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0a0a0a', borderRadius: '12px', border: 'none', fontSize: '11px', color: '#fff' }}
                  formatter={(value) => [`${value} đơn`, 'Số lượng']}
                  labelStyle={{ color: '#D2FC38', fontWeight: 800 }}
                />
                <Bar dataKey="donHang" fill="#0a0a0a" radius={[6, 6, 0, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ──── TABLES: Best Sellers + Low Stock ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Top-selling panel */}
        <section className="lg:col-span-7 bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
          <span className="text-[11px] font-black uppercase text-neutral-400 tracking-widest block border-b border-neutral-100 pb-3 flex items-center gap-2 font-display">
            <Sparkles className="h-4 w-4" style={{ color: '#D2FC38' }} />
            SẢN PHẨM BÁN CHẠY NHẤT
          </span>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[10px] text-neutral-400 uppercase tracking-widest border-b border-neutral-100 font-display font-black">
                <tr>
                  <th className="py-2.5">SẢN PHẨM</th>
                  <th>THƯƠNG HIỆU</th>
                  <th>DOANH SỐ</th>
                  <th>GIÁ BÁN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50 font-medium text-neutral-600">
                {topSellers.map((prod) => (
                  <tr key={prod.id} className="hover:bg-neutral-50/50 transition">
                    <td className="py-3 flex items-center gap-3 pr-3">
                      <img src={prod.image[0]} alt={prod.name} className="h-9 w-9 object-cover rounded-lg border border-neutral-100" referrerPolicy="no-referrer" />
                      <span className="font-bold text-neutral-900 max-w-[200px] truncate">{prod.name}</span>
                    </td>
                    <td className="font-bold text-neutral-500">{prod.brand}</td>
                    <td>
                      <span className="font-black font-display" style={{ color: '#5a7a00' }}>
                        {prod.salesCount}
                      </span>
                    </td>
                    <td className="font-bold text-neutral-900">{formatVND(prod.discountPrice ?? prod.originalPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Low stocks panel */}
        <section className="lg:col-span-5 bg-white rounded-2xl border border-neutral-200 p-5 space-y-4">
          <span className="text-[11px] font-black uppercase tracking-widest text-neutral-400 block border-b border-neutral-100 pb-3 font-display">
            CẢNH BÁO TỒN KHO
          </span>

          <div className="overflow-y-auto max-h-[240px] space-y-2 pr-1">
            {lowStockWarnings.length > 0 ? (
              lowStockWarnings.map((warn, index) => (
                <div key={index} className="flex gap-3 p-3 rounded-xl bg-neutral-50 border border-neutral-100 text-[11px] font-medium items-center justify-between hover:border-neutral-300 transition">
                  <div className="min-w-0">
                    <span className="block font-bold text-neutral-900 truncate max-w-[200px]">{warn.productName}</span>
                    <span className="block text-[9.5px] text-neutral-400 font-semibold mt-0.5">
                      {warn.color} — {warn.size}
                    </span>
                  </div>
                  <span className="bg-neutral-900 text-white font-mono font-black px-2.5 py-1 rounded-full text-[10px] shrink-0">
                    {warn.stock}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-12 space-y-2 text-neutral-400">
                <CheckCircle className="h-8 w-8 mx-auto mb-2" style={{ color: '#D2FC38' }} />
                <p className="text-xs font-bold">Kho hàng ổn định</p>
                <p className="text-[10px]">Toàn bộ sản phẩm đều sẵn hàng.</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
