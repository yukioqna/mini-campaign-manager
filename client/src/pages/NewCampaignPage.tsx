import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mail } from 'lucide-react';
import { campaignApi } from '../api/client';
import { NavHeader } from '../components/layout/NavHeader';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Button } from '../components/ui/Button';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { ErrorAlert } from '../components/ui/ErrorAlert';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ParsedRecipient { email: string; name: string }

function parseRecipients(raw: string): ParsedRecipient[] {
  const lines = raw.split('\n').filter((l) => l.trim());
  const seen = new Set<string>();
  const results: ParsedRecipient[] = [];
  for (const line of lines) {
    const [emailPart, ...rest] = line.trim().split(',');
    const email = emailPart.trim().toLowerCase();
    const name = rest.join(',').trim() || email.split('@')[0];
    if (email && !seen.has(email)) {
      seen.add(email);
      results.push({ email, name });
    }
  }
  return results;
}

export function NewCampaignPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientEmails, setRecipientEmails] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMutation = useMutation({
    mutationFn: () => campaignApi.create({ name, subject, body, emails: parseRecipients(recipientEmails) }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      navigate(`/campaigns/${res.data.id}`);
    },
  });

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Campaign name is required';
    if (name.trim().length > 255) errs.name = 'Campaign name must be 255 characters or less';
    if (!subject.trim()) errs.subject = 'Subject is required';
    if (subject.trim().length > 500) errs.subject = 'Subject must be 500 characters or less';
    const parsed = parseRecipients(recipientEmails);
    if (parsed.length === 0) errs.recipients = 'At least one valid recipient is required';
    for (const r of parsed) {
      if (!EMAIL_REGEX.test(r.email)) {
        errs.recipients = `Invalid recipient email: ${r.email}`;
        break;
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    createMutation.mutate();
  };

  const parsedCount = parseRecipients(recipientEmails).length;

  return (
    <div className="app-background">
      <NavHeader />
      <main id="main-content" className="max-w-2xl mx-auto px-6 pt-24 pb-12" role="main">
        {/* Back */}
        <button
          onClick={() => navigate('/campaigns')}
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg px-2 py-1 -ml-2"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          Back to Campaigns
        </button>

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Campaign</h1>
          <p className="text-slate-500 mt-1 text-sm">Fill in the details below to create your email campaign.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" aria-hidden="true" />
              <span className="font-semibold text-slate-900">Campaign Details</span>
            </div>
          </CardHeader>
          <CardBody>
            {createMutation.error && (
              <div className="mb-5">
                <ErrorAlert message={(createMutation.error as any).response?.data?.error || 'Failed to create campaign'} />
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Campaign Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={errors.name}
                required
                maxLength={255}
                placeholder="Summer Sale 2026"
              />

              <Input
                label="Email Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                error={errors.subject}
                required
                maxLength={500}
                placeholder="Don't miss our summer deals!"
              />

              <Textarea
                label="Email Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={5}
                placeholder="Write your email content here..."
              />

              <div className="space-y-1.5">
                <Textarea
                  label="Recipients"
                  value={recipientEmails}
                  onChange={(e) => setRecipientEmails(e.target.value)}
                  error={errors.recipients}
                  required
                  rows={5}
                  placeholder={`alice@example.com, Alice\nbob@example.com, Bob\ncarlos@example.com`}
                />
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">
                    One email per line. Format: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">email,name</code> or just <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-mono text-xs">email</code>. Duplicates are removed.
                  </p>
                  {parsedCount > 0 && (
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {parsedCount} recipient{parsedCount !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <Button variant="ghost" type="button" onClick={() => navigate('/campaigns')}>Cancel</Button>
                <Button type="submit" loading={createMutation.isPending} disabled={createMutation.isPending} className="gap-1.5">
                  Create Campaign
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}
