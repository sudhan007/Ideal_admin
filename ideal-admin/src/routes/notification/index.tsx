// app/routes/notification/index.tsx  (or wherever your route file is)
import { createFileRoute } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import { toast } from 'sonner';
import { _axios } from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/notification/')({
  component: NotificationPage,
});

function NotificationPage() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  const mutation = useMutation({
    mutationFn: (data: { title: string; body: string }) => {
      return _axios.post('/notification/all', data);
    },
    onSuccess: () => {
      toast('Notification sent successfully!');
      setTitle('');
      setBody('');
    },
    onError: (error) => {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Check console for details.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      alert('Both title and body are required');
      return;
    }
    mutation.mutate({ title, body });
  };

  return (
    <div className="mx-auto max-w-3xl p-4">
      <h1 className="py-5 text-xl">Send Notification to All Students</h1>
      <Card className="rounded-xsm border-background">
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <Label
                htmlFor="title"
                style={{ display: 'block', marginBottom: '0.5rem' }}>
                Title
              </Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Notification title"
                style={{ width: '100%', padding: '0.5rem' }}
                disabled={mutation.isPending}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <Label
                htmlFor="body"
                style={{ display: 'block', marginBottom: '0.5rem' }}>
                Message
              </Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Notification message..."
                rows={4}
                style={{ width: '100%', padding: '0.5rem' }}
                disabled={mutation.isPending}
              />
            </div>

            <div className="justify-end w-full flex">
              <Button
                type="submit"
                className="cursor-pointer"
                disabled={mutation.isPending || !title.trim() || !body.trim()}>
                {mutation.isPending ? 'Sending...' : 'Send to All'}
              </Button>
            </div>
          </form>
          {mutation.isError && (
            <div style={{ color: 'red', marginTop: '1rem' }}>
              Error: {mutation.error?.message || 'Something went wrong'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
