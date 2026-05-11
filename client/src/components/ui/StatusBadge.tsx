import React from 'react';
import { FileText, Clock, Loader2, CheckCircle2, AlertCircle, MailOpen } from 'lucide-react';

type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent';
type RecipientStatus = 'pending' | 'sent' | 'failed' | 'opened';

type Status = CampaignStatus | RecipientStatus;

const styles: Record<Status, string> = {
  draft: 'bg-slate-100 text-slate-700',
  scheduled: 'bg-blue-100 text-blue-800',
  sending: 'bg-amber-100 text-amber-800',
  sent: 'bg-emerald-50 text-emerald-700',
  pending: 'bg-slate-100 text-slate-500',
  failed: 'bg-red-100 text-red-700',
  opened: 'bg-blue-50 text-blue-700',
};

const icons: Record<Status, React.FC<{ className?: string }>> = {
  draft: FileText,
  scheduled: Clock,
  sending: Loader2,
  sent: CheckCircle2,
  pending: MailOpen,
  failed: AlertCircle,
  opened: MailOpen,
};

const labels: Record<Status, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  sending: 'Sending',
  sent: 'Sent',
  pending: 'Pending',
  failed: 'Failed',
  opened: 'Opened',
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const Icon = icons[status] || FileText;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.draft}`}>
      <Icon className="w-3 h-3" aria-hidden="true" />
      {labels[status] || status}
    </span>
  );
}
