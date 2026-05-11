import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send, Clock, Pencil, Trash2, Users } from 'lucide-react';
import { campaignApi, recipientApi } from '../api/client';
import { NavHeader } from '../components/layout/NavHeader';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { StatusBadge } from '../components/ui/StatusBadge';
import { StatCard } from '../components/ui/StatCard';
import { LoadingSkeleton } from '../components/ui/LoadingSkeleton';
import { ErrorAlert } from '../components/ui/ErrorAlert';
import { Modal } from '../components/ui/Modal';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showSchedule, setShowSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [showEdit, setShowEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editBody, setEditBody] = useState('');
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [newRecipientEmail, setNewRecipientEmail] = useState('');
  const [newRecipientName, setNewRecipientName] = useState('');
  const [addError, setAddError] = useState('');

  const { data: campaign, isLoading, error, refetch } = useQuery({
    queryKey: ['campaign', id],
    queryFn: async () => {
      const res = await campaignApi.get(id!);
      return res.data as any;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['campaignStats', id],
    queryFn: async () => {
      const res = await campaignApi.stats(id!);
      return res.data;
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: () => campaignApi.schedule(id!, new Date(scheduleDate).toISOString()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setShowSchedule(false);
      setScheduleDate('');
    },
  });

  const sendMutation = useMutation({
    mutationFn: () => campaignApi.send(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setShowSendConfirm(false);
      const interval = setInterval(async () => {
        const res = await campaignApi.get(id!);
        if (res.data.status === 'sent') {
          clearInterval(interval);
          queryClient.invalidateQueries({ queryKey: ['campaigns'] });
          queryClient.invalidateQueries({ queryKey: ['campaign', id] });
          queryClient.invalidateQueries({ queryKey: ['campaignStats', id] });
        }
      }, 2000);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => campaignApi.update(id!, { name: editName, subject: editSubject, body: editBody }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      setShowEdit(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => campaignApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate('/campaigns');
    },
  });

  const addRecipientMutation = useMutation({
    mutationFn: async () => {
      const email = newRecipientEmail.trim();
      const recipientName = newRecipientName.trim() || email.split('@')[0];
      await recipientApi.create({ email, name: recipientName });
      await campaignApi.addRecipients(id!, [{ email, name: recipientName }]);
    },
    onSuccess: () => {
      setNewRecipientEmail('');
      setNewRecipientName('');
      setAddError('');
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaign', id] });
    },
    onError: (err: any) => setAddError(err.response?.data?.error || 'Failed to add recipient'),
  });

  const canEdit = campaign?.status === 'draft';
  const canDelete = campaign?.status === 'draft';
  const canSchedule = campaign?.status === 'draft';
  const canSend = campaign?.status === 'draft' || campaign?.status === 'scheduled';

  if (isLoading) return (
    <div className="app-background">
      <NavHeader />
      <div className="pt-24 max-w-6xl mx-auto px-6"><LoadingSkeleton rows={4} /></div>
    </div>
  );
  if (error) return (
    <div className="app-background">
      <NavHeader />
      <div className="pt-24 max-w-6xl mx-auto px-6"><ErrorAlert message="Failed to load campaign" onRetry={refetch} /></div>
    </div>
  );
  if (!campaign) return null;

  return (
    <div className="app-background">
      <NavHeader />
      <main id="main-content" className="max-w-6xl mx-auto px-6 pt-24 pb-12" role="main">
        {/* Back */}
        <button
          onClick={() => navigate('/campaigns')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-5 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Campaigns
        </button>

        {/* Campaign header */}
        <div className="flex items-start justify-between mb-8">
          <div className="flex-1 min-w-0 pr-4">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight truncate">{campaign.name}</h1>
            <p className="text-slate-500 mt-1 text-sm">{campaign.subject}</p>
          </div>
          <StatusBadge status={campaign.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-5">
            {/* Stats grid */}
            {stats && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatCard value={stats.total} label="Total" type="total" />
                <StatCard value={stats.sent} label="Sent" type="sent" />
                <StatCard value={stats.failed} label="Failed" type="failed" />
                <StatCard value={stats.opened} label="Opened" type="opened" />
                <StatCard value={`${(stats.open_rate * 100).toFixed(1)}%`} label="Open Rate" type="open_rate" />
                <StatCard value={`${(stats.send_rate * 100).toFixed(1)}%`} label="Send Rate" type="send_rate" />
              </div>
            )}

            {/* Action card */}
            <Card>
              <CardHeader>
                <span className="font-semibold text-slate-900 text-sm">Actions</span>
              </CardHeader>
              <CardBody className="space-y-4">
                {campaign.status === 'sent' && campaign.sent_at && (
                  <p className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
                    Sent on {new Date(campaign.sent_at).toLocaleString()}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {canEdit && (
                    <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => { setEditName(campaign.name); setEditSubject(campaign.subject); setEditBody(campaign.body || ''); setShowEdit(true); }}>
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      Edit
                    </Button>
                  )}
                  {canSchedule && (
                    <Button size="sm" variant="secondary" className="gap-1.5" onClick={() => setShowSchedule(true)}>
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                      Schedule
                    </Button>
                  )}
                  {canSend && (
                    <Button size="sm" className="gap-1.5" onClick={() => setShowSendConfirm(true)} loading={sendMutation.isPending}>
                      <Send className="w-3.5 h-3.5" aria-hidden="true" />
                      {campaign.status === 'scheduled' ? 'Send Now' : 'Send'}
                    </Button>
                  )}
                  {canDelete && (
                    <Button size="sm" variant="danger" className="gap-1.5" onClick={() => setShowDeleteConfirm(true)}>
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      Delete
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Edit form */}
            {showEdit && (
              <Card>
                <CardHeader>
                  <span className="font-semibold text-slate-900 text-sm">Edit Campaign</span>
                </CardHeader>
                <CardBody className="space-y-4">
                  <Input label="Name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <Input label="Subject" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} />
                  <Textarea label="Body" value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={4} />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => updateMutation.mutate()} loading={updateMutation.isPending} className="gap-1.5">
                      <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setShowEdit(false)}>Cancel</Button>
                  </div>
                  {updateMutation.error && <ErrorAlert message="Failed to update" />}
                </CardBody>
              </Card>
            )}
          </div>

          {/* Right column — Recipients */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" aria-hidden="true" />
                <span className="font-semibold text-slate-900 text-sm">Recipients</span>
              </div>
              {campaign.campaignRecipients?.length > 0 && (
                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {campaign.campaignRecipients.length}
                </span>
              )}
            </CardHeader>
            <CardBody className="space-y-4">
              {/* Add single recipient */}
              {campaign.status === 'draft' ? (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Email address"
                      value={newRecipientEmail}
                      onChange={(e) => { setNewRecipientEmail(e.target.value); setAddError(''); }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Name (optional)"
                      value={newRecipientName}
                      onChange={(e) => setNewRecipientName(e.target.value)}
                      className="w-36"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        const email = newRecipientEmail.trim();
                        if (!EMAIL_REGEX.test(email)) {
                          setAddError('Invalid email address');
                          return;
                        }
                        addRecipientMutation.mutate();
                      }}
                      loading={addRecipientMutation.isPending}
                      disabled={!newRecipientEmail.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  {addError && <ErrorAlert message={addError} />}
                </>
              ) : (
                <p className="text-xs text-slate-400 italic bg-slate-50 rounded-lg px-3 py-2">
                  Recipients are locked after scheduling or sending.
                </p>
              )}

              {/* Recipient list */}
              {campaign.campaignRecipients?.length > 0 ? (
                <div className="divide-y divide-slate-100 border border-slate-100 rounded-lg overflow-hidden">
                  {campaign.campaignRecipients.map((cr: any) => {
                    const displayStatus = cr.opened_at ? 'opened' : cr.status;
                    return (
                      <div key={cr.id} className="flex items-center justify-between px-4 py-3 hover:bg-slate-50/60 transition-colors">
                        <div className="min-w-0 flex-1 pr-4">
                          <div className="text-sm font-medium text-slate-900 truncate">{cr.recipient?.name}</div>
                          <div className="text-xs text-slate-400 truncate">{cr.recipient?.email}</div>
                        </div>
                        <StatusBadge status={displayStatus} />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-8 h-8 text-slate-200 mx-auto mb-2" aria-hidden="true" />
                  <p className="text-sm text-slate-400">No recipients added yet</p>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      </main>

      {/* Schedule Modal */}
      <Modal open={showSchedule} onClose={() => setShowSchedule(false)} title="Schedule Campaign">
        <div className="space-y-4">
          <Input
            label="Date and Time"
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
          />
          {scheduleMutation.error && <ErrorAlert message="Failed to schedule" />}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setShowSchedule(false)}>Cancel</Button>
            <Button onClick={() => scheduleMutation.mutate()} loading={scheduleMutation.isPending}>Schedule</Button>
          </div>
        </div>
      </Modal>

      {/* Send Confirm */}
      <Modal open={showSendConfirm} onClose={() => setShowSendConfirm(false)} title="Send Campaign">
        <p className="text-sm text-slate-600 mb-4">
          Send this campaign to <strong>{campaign.campaignRecipients?.length || 0} recipients</strong>? This cannot be undone.
        </p>
        {sendMutation.error && (
          <div className="mb-4"><ErrorAlert message={(sendMutation.error as any).response?.data?.error || 'Send failed'} /></div>
        )}
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowSendConfirm(false)}>Cancel</Button>
          <Button onClick={() => sendMutation.mutate()} loading={sendMutation.isPending} className="gap-1.5">
            <Send className="w-3.5 h-3.5" aria-hidden="true" />
            Send Campaign
          </Button>
        </div>
      </Modal>

      {/* Delete Confirm */}
      <Modal open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Campaign">
        <p className="text-sm text-slate-600 mb-4">
          Are you sure you want to delete <strong>{campaign.name}</strong>? This cannot be undone.
        </p>
        <div className="flex gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => deleteMutation.mutate()} loading={deleteMutation.isPending}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}
