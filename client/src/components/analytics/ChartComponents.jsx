import React from 'react';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Loader2 } from 'lucide-react';

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 shadow-xl">
        <p className="mb-2 text-sm font-medium text-zinc-300">{label}</p>
        <div className="space-y-1">
          {payload.map((entry, index) => (
             <div key={index} className="flex items-center gap-2">
               <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color || entry.payload.fill }} />
               <span className="text-sm text-zinc-400">{entry.name}:</span>
               <span className="text-sm font-medium text-zinc-200">
                  {entry.name.toLowerCase().includes('revenue') || entry.name.toLowerCase().includes('sales') || entry.name.toLowerCase().includes('target')
                    ? `$${entry.value}` 
                    : entry.value}
               </span>
             </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const ChartWrapper = ({ loading, data, emptyMessage = "No data available", children, height = "h-72" }) => {
  if (loading) {
    return (
      <div className={classNames("flex w-full items-center justify-center rounded-xl bg-zinc-900/50", height)}>
         <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className={classNames("flex w-full items-center justify-center rounded-xl border border-zinc-900 bg-zinc-900/50", height)}>
         <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={classNames("w-full", height)}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
};

export const RevenueLineChart = ({ data, loading }) => (
  <ChartWrapper data={data} loading={loading}>
    <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
      <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa', paddingTop: '10px' }} />
      <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 0 }} activeDot={{ r: 5 }} />
      <Line type="monotone" dataKey="target" name="Target" stroke="#3f3f46" strokeWidth={2} strokeDasharray="5 5" dot={false} />
    </LineChart>
  </ChartWrapper>
);

export const OrdersBarChart = ({ data, loading }) => (
  <ChartWrapper data={data} loading={loading}>
    <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
      <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#27272a', opacity: 0.4 }} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa', paddingTop: '10px' }} />
      <Bar dataKey="orders" name="Orders" fill="#0ea5e9" radius={[4, 4, 0, 0]} maxBarSize={40} />
    </BarChart>
  </ChartWrapper>
);

export const SalesAreaChart = ({ data, loading }) => (
  <ChartWrapper data={data} loading={loading}>
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
      <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa', paddingTop: '10px' }} />
      <Area type="monotone" dataKey="sales" name="Sales" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
    </AreaChart>
  </ChartWrapper>
);

const PIE_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"];

export const PaymentStatusPieChart = ({ data, loading }) => (
  <ChartWrapper data={data} loading={loading} height="h-72">
    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
      <Tooltip content={<CustomTooltip />} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa' }} />
      <Pie
        data={data}
        cx="50%"
        cy="45%"
        innerRadius={60}
        outerRadius={80}
        paddingAngle={4}
        dataKey="value"
        stroke="none"
      >
        {data?.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  </ChartWrapper>
);

export const CustomerGrowthChart = ({ data, loading }) => (
  <ChartWrapper data={data} loading={loading} height="h-72">
    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
      <defs>
        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
      <XAxis dataKey="name" stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
      <YAxis stroke="#52525b" fontSize={12} tickLine={false} axisLine={false} />
      <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeWidth: 1 }} />
      <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#a1a1aa', paddingTop: '10px' }} />
      <Area type="monotone" dataKey="users" name="New Customers" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorUsers)" />
    </AreaChart>
  </ChartWrapper>
);
