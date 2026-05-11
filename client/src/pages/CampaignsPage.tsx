import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PlusCircle } from 'lucide-react';
import { campaignApi } from '../api/client';
import { NavHeader } from '../components/layout/NavHeader';
import { Button } from '../components/ui/Button';
import { StatusBadge } from '../components/ui/StatusBadge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Modal } from '../components/ui/Modal';

export function CampaignsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data: campaigns, isLoading, error, refetch } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const res = await campaignApi.list();
      return res.data as any[];
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => campaignApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      setDeleteTarget(null);
    },
  });

  const draftCount = campaigns?.filter((c: any) => c.status === 'draft').length ?? 0;
  const sentCount = campaigns?.filter((c: any) => c.status === 'sent').length ?? 0;
  const scheduledCount = campaigns?.filter((c: any) => c.status === 'scheduled').length ?? 0;

  return (
    <div className="app-background">
      <NavHeader />
      <main id="main-content" className="max-w-6xl mx-auto px-6 pt-24 pb-12" role="main">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6 page-header">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
            {campaigns && campaigns.length > 0 && (
              <p className="text-sm text-slate-500 mt-1">
                {campaigns.length} total — {draftCount} draft{draftCount !== 1 ? 's' : ''}, {scheduledCount} scheduled, {sentCount} sent
              </p>
            )}
          </div>
          <Button onClick={() => navigate('/campaigns/new')} className="gap-2">
            <PlusCircle className="w-4 h-4" aria-hidden="true" />
            New Campaign
          </Button>
        </div>

        {isLoading && <LoadingSkeleton rows={5} />}
        {error && <ErrorAlert message="Failed to load campaigns" onRetry={refetch} />}

        {!isLoading && !error && campaigns?.length === 0 && (
          <EmptyState
            title="No campaigns yet"
            description="Create your first campaign to start sending emails to your audience."
            actionLabel="Create Campaign"
            onAction={() => navigate('/campaigns/new')}
          />
        )}

        {!isLoading && !error && campaigns && campaigns.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-md">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Name</th>
                  <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Subject</th>
                  <th scope="col" className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th scope="col" className="text-right px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.map((c: any) => (
                  <tr
                    key={c.id}
                    className="group hover:bg-blue-50/40 cursor-pointer transition-colors duration-100"
                    onClick={() => navigate(`/campaigns/${c.id}`)}
                  >
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-900 group-hover:text-blue-700">{c.name}</span>
                    </td>
                    <td className="px-5 py-4 hidden md:table-cell">
                      <span className="text-sm text-slate-500 truncate max-w-xs block">{c.subject}</span>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      {c.status === 'draft' && (
                        <button
                          onClick={() => setDeleteTarget({ id: c.id, name: c.name })}
                          className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                          aria-label={`Delete campaign ${c.name}`}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Campaign"
      >
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete <strong>{deleteTarget?.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button
            variant="danger"
            loading={deleteMutation.isPending}
            onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
          >
            Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
