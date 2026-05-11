import { Mail, AlertCircle, Eye, TrendingUp, Users } from 'lucide-react';

interface StatCardProps {
  value: string | number;
  label: string;
  type?: 'total' | 'sent' | 'failed' | 'opened' | 'open_rate' | 'send_rate';
}

const iconMap = {
  total: Users,
  sent: Mail,
  failed: AlertCircle,
  opened: Eye,
  open_rate: TrendingUp,
  send_rate: TrendingUp,
};

const accentMap = {
  total: 'stat-total',
  sent: 'stat-sent',
  failed: 'stat-failed',
  opened: 'stat-opened',
  open_rate: 'stat-open_rate',
  send_rate: 'stat-send_rate',
};

export function StatCard({ value, label, type = 'total' }: StatCardProps) {
  const Icon = iconMap[type] || Users;
  const accentClass = accentMap[type] || 'stat-total';
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-5 text-left ${accentClass}`}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-slate-400" aria-hidden="true" />
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <div className="text-2xl font-bold text-slate-900 font-variant-numeric tabular-nums leading-tight">{value}</div>
    </div>
  );
}
