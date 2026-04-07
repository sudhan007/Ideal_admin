import { _axios } from '@/lib/axios';
import { WHATSAPP_TEMPLATES } from '@/lib/whatsapp_template';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/batches/whatsapp/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: batchId } = Route.useParams();
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const currentTemplate = WHATSAPP_TEMPLATES.find(
    (t) => t.id === selectedTemplate,
  );

  const { mutate: sendMutation, isPending } = useMutation({
    mutationFn: async (payload: {
      batchId: string;
      templateName: string;
      parameters: string[];
      sendToStudent?: boolean;
    }) => {
      const res = await _axios.post('/notification/whatsapp/batch', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      return res.data;
    },

    onSuccess: (data) => {
      toast.success(
        `Success! Sent ${data.sentCount} messages to batch "${data.batchName}"`,
      );
      setSelectedTemplate('');
      setFieldValues({});
    },

    onError: (error: any) => {
      const msg =
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Failed to send batch notification';
      alert(`Error: ${msg}`);
    },
  });

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    setFieldValues({});
  };

  const handleFieldChange = (key: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSend = () => {
    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (!currentTemplate) return;

    // Check required fields
    const missing = currentTemplate.fields.filter(
      (f) => !fieldValues[f.key]?.trim(),
    );

    if (missing.length > 0) {
      alert(`Please fill: ${missing.map((f) => f.label).join(', ')}`);
      return;
    }

    // Get batchId from route params

    // Prepare ordered parameters (important – backend expects correct order)
    const parameters = currentTemplate.fields.map(
      (field) => fieldValues[field.key]?.trim() || '',
    );

    sendMutation({
      batchId,
      templateName: selectedTemplate,
      parameters,
      sendToStudent: false,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Batch WhatsApp Notification
        </h1>
        <p className="text-gray-600">
          Send notification to all students/parents in this batch using a
          template.
        </p>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        {/* Template Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Template *
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => handleTemplateChange(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option value="">-- Select a template --</option>
            {WHATSAPP_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields */}
        {currentTemplate && (
          <div className="mb-8 space-y-5">
            <h3 className="text-lg font-semibold border-b pb-2">
              Template Fields
            </h3>

            {currentTemplate.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  {field.label} *
                </label>

                {field.type === 'select' ? (
                  <select
                    value={fieldValues[field.key] || ''}
                    onChange={(e) =>
                      handleFieldChange(field.key, e.target.value)
                    }
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Select --</option>
                    {field.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={fieldValues[field.key] || ''}
                    onChange={(e) =>
                      handleFieldChange(field.key, e.target.value)
                    }
                    placeholder={field.placeholder}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Preview */}
        {currentTemplate && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-3 border-b pb-2">
              Message Preview
            </h3>
            <div className="bg-gray-50 border rounded-lg p-4 whitespace-pre-wrap font-mono text-sm">
              {currentTemplate.preview(fieldValues)}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-4">
          <button
            onClick={handleSend}
            disabled={isPending || !selectedTemplate || !currentTemplate}
            className={`
                px-6 py-3 rounded-lg font-medium text-white
                ${
                  isPending || !selectedTemplate
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                }
                transition-colors flex items-center gap-2
              `}>
            {isPending && (
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            )}
            {isPending ? 'Sending...' : 'Send to Batch'}
          </button>
        </div>
      </div>
    </div>
  );
}
