import React, { useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  ExternalLink,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { _axios } from '@/lib/axios'
import { Input } from '../ui/input'

interface TimelineEntry {
  _id: string
  submissionNumber: number
  status: 'SUBMITTED' | 'COMPLETED' | 'REJECTED' | 'RESUBMITTED'
  timestamp: string
  note: string
  actorType: 'STUDENT' | 'ADMIN'
  feedback?: string
}

interface SubmissionData {
  type: 'IMAGES' | 'PDF' | 'GOOGLE_DRIVE'
  urls?: string[]
  url?: string
  driveLink?: string
}

interface SubmissionHistory {
  _id: string
  submissionNumber: number
  submissionType: 'IMAGES' | 'PDF' | 'GOOGLE_DRIVE'
  submissionData: SubmissionData
  notes: string
  status: 'SUBMITTED' | 'COMPLETED' | 'REJECTED' | 'RESUBMITTED'
  submittedAt: string
  reviewedAt?: string
  feedback?: string
  rejectedItems?: number[]
}

interface MainSubmission {
  currentStatus: string
  totalSubmissions: number
  latestSubmissionNumber: number
}

const TaskReviewPage: React.FC = () => {
  const { id, submissionId } = useParams({
    from: '/tasks/submissions/$id/$submissionId',
  })
  const queryClient = useQueryClient()

  const [feedback, setFeedback] = useState('')
  const [selectedImages, setSelectedImages] = useState<
    Array<{ index: number; reason: string }>
  >([])
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [showCompleteDialog, setShowCompleteDialog] = useState(false)
  const [expandedSubmission, setExpandedSubmission] = useState<string | null>(
    null,
  )
  const [rejectionReasons, setRejectionReasons] = useState<
    Record<number, string>
  >({})

  // Fetch Timeline
  const { data: timelineData, isLoading: isLoadingTimeline } = useQuery({
    queryKey: ['task-timeline', submissionId],
    queryFn: async () => {
      const response = await _axios.get(`/task/timeline/${submissionId}`)
      return response.data
    },
  })

  // Fetch Submission History
  const { data: historyData, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['task-submission-history', submissionId],
    queryFn: async () => {
      const params = new URLSearchParams({ submissionId })
      const response = await _axios.get(
        `/task/submission-history?${params.toString()}`,
      )
      return response.data
    },
  })

  // Review Mutation
  const reviewMutation = useMutation({
    mutationFn: async (data: {
      submissionId: string
      status: 'COMPLETED' | 'REJECTED'
      feedback?: string
      rejectedItems?: Array<{
        type: string
        index?: number
        reason: string
      }>
    }) => {
      const response = await _axios.post('/task/review', data)
      return response.data
    },
    onSuccess: (data) => {
      toast({
        title: 'Success',
        description: data.message,
      })
      queryClient.invalidateQueries({
        queryKey: ['task-timeline', submissionId],
      })
      queryClient.invalidateQueries({
        queryKey: ['task-submission-history', submissionId],
      })
      setFeedback('')
      setSelectedImages([])
      setRejectionReasons({})
      setShowRejectDialog(false)
      setShowCompleteDialog(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description:
          error.response?.data?.error || 'Failed to review submission',
        variant: 'destructive',
      })
    },
  })

  const handleComplete = () => {
    reviewMutation.mutate({
      submissionId,
      status: 'COMPLETED',
      feedback: feedback || undefined,
    })
  }

  const handleReject = () => {
    if (!feedback.trim()) {
      toast({
        title: 'Error',
        description: 'Feedback is required when rejecting',
        variant: 'destructive',
      })
      return
    }

    // Build rejectedItems array based on submission type
    let rejectedItems:
      | Array<{ type: string; index?: number; reason: string }>
      | undefined

    if (
      latestSubmission?.submissionType === 'IMAGES' &&
      selectedImages.length > 0
    ) {
      rejectedItems = selectedImages.map((item) => ({
        type: 'image',
        index: item.index,
        reason: item.reason || 'Image needs correction',
      }))
    } else if (latestSubmission?.submissionType === 'PDF') {
      rejectedItems = [
        {
          type: 'pdf',
          reason: feedback,
        },
      ]
    } else if (latestSubmission?.submissionType === 'GOOGLE_DRIVE') {
      rejectedItems = [
        {
          type: 'link',
          reason: feedback,
        },
      ]
    }

    reviewMutation.mutate({
      submissionId,
      status: 'REJECTED',
      feedback,
      rejectedItems,
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return 'bg-blue-100 text-blue-800'
      case 'COMPLETED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'SUBMITTED':
      case 'RESUBMITTED':
        return <Clock className="h-5 w-5 text-blue-600" />
      default:
        return <Clock className="h-5 w-5 text-gray-600" />
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleImageSelection = (index: number) => {
    setSelectedImages((prev) => {
      const exists = prev.find((item) => item.index === index)
      if (exists) {
        // Remove from selection
        const updated = prev.filter((item) => item.index !== index)
        const newReasons = { ...rejectionReasons }
        delete newReasons[index]
        setRejectionReasons(newReasons)
        return updated
      } else {
        // Add to selection
        return [...prev, { index, reason: rejectionReasons[index] || '' }]
      }
    })
  }

  const updateRejectionReason = (index: number, reason: string) => {
    setRejectionReasons((prev) => ({ ...prev, [index]: reason }))
    setSelectedImages((prev) =>
      prev.map((item) => (item.index === index ? { ...item, reason } : item)),
    )
  }

  const isImageSelected = (index: number) => {
    return selectedImages.some((item) => item.index === index)
  }

  const latestSubmission = historyData?.data?.[0]
  const mainSubmission = historyData?.mainSubmission
  const canReview = mainSubmission?.currentStatus === 'SUBMITTED'

  if (isLoadingTimeline || isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Submission Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Submission Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Current Submission</CardTitle>
                <Badge
                  className={getStatusColor(
                    mainSubmission?.currentStatus || '',
                  )}
                >
                  {mainSubmission?.currentStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Total Submissions</p>
                  <p className="font-semibold text-lg">
                    {mainSubmission?.totalSubmissions}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Current Version</p>
                  <p className="font-semibold text-lg">
                    #{mainSubmission?.latestSubmissionNumber}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Submitted On</p>
                  <p className="font-semibold text-sm">
                    {latestSubmission &&
                      formatDate(latestSubmission.submittedAt)}
                  </p>
                </div>
              </div>

              {latestSubmission?.notes && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Student Notes:
                  </p>
                  <p className="text-sm text-gray-600">
                    {latestSubmission.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submission Content */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Content</CardTitle>
            </CardHeader>
            <CardContent>
              {latestSubmission?.submissionType === 'IMAGES' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-gray-600">
                      {latestSubmission.submissionData.urls?.length} image(s)
                      uploaded
                    </p>
                    {canReview && selectedImages.length > 0 && (
                      <Badge variant="outline" className="bg-orange-50">
                        {selectedImages.length} image(s) marked for rejection
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {latestSubmission.submissionData.urls?.map((url, index) => (
                      <div key={index} className="relative group">
                        <div
                          className={`border-2 rounded-lg overflow-hidden ${
                            isImageSelected(index)
                              ? 'border-red-500'
                              : 'border-gray-200'
                          }`}
                        >
                          <img
                            src={url}
                            alt={`Submission ${index + 1}`}
                            className="w-full h-48 object-cover"
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                        {canReview && (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2">
                              <Checkbox
                                checked={isImageSelected(index)}
                                onCheckedChange={() =>
                                  toggleImageSelection(index)
                                }
                                id={`image-${index}`}
                              />
                              <label
                                htmlFor={`image-${index}`}
                                className="text-sm text-gray-600 cursor-pointer"
                              >
                                Mark for rejection
                              </label>
                            </div>
                            {isImageSelected(index) && (
                              <Input
                                placeholder="Reason for rejection..."
                                value={rejectionReasons[index] || ''}
                                onChange={(e) =>
                                  updateRejectionReason(index, e.target.value)
                                }
                                className="text-sm"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestSubmission?.submissionType === 'PDF' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <FileText className="h-12 w-12 text-red-500" />
                    <div className="flex-1">
                      <p className="font-medium">PDF Document</p>
                      <p className="text-sm text-gray-500">
                        Click to view in new tab
                      </p>
                    </div>
                    <a
                      href={latestSubmission.submissionData.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open PDF
                      </Button>
                    </a>
                  </div>
                </div>
              )}

              {latestSubmission?.submissionType === 'GOOGLE_DRIVE' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <ExternalLink className="h-12 w-12 text-blue-500" />
                    <div className="flex-1">
                      <p className="font-medium">Google Drive Link</p>
                      <p className="text-sm text-gray-500 break-all">
                        {latestSubmission.submissionData.driveLink}
                      </p>
                    </div>
                    <a
                      href={latestSubmission.submissionData.driveLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open Link
                      </Button>
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Review Actions */}
          {canReview && (
            <Card>
              <CardHeader>
                <CardTitle>Review Submission</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Feedback {!canReview && '(Optional)'}
                  </label>
                  <Textarea
                    placeholder="Enter your feedback here..."
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setShowCompleteDialog(true)}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    disabled={reviewMutation.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Mark as Completed
                  </Button>
                  <Button
                    onClick={() => setShowRejectDialog(true)}
                    variant="destructive"
                    className="flex-1"
                    disabled={reviewMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Request Resubmission
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!canReview && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This submission has already been reviewed. Current status:{' '}
                {mainSubmission?.currentStatus}
              </AlertDescription>
            </Alert>
          )}

          {/* Submission History */}
          <Card>
            <CardHeader>
              <CardTitle>Submission History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {historyData?.data?.map(
                (submission: SubmissionHistory, index: number) => (
                  <div key={submission._id} className="border rounded-lg">
                    <button
                      onClick={() =>
                        setExpandedSubmission(
                          expandedSubmission === submission._id
                            ? null
                            : submission._id,
                        )
                      }
                      className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <Badge variant="outline">
                          v{submission.submissionNumber}
                        </Badge>
                        <div className="text-left">
                          <p className="font-medium">
                            {submission.submissionType} Submission
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(submission.submittedAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(submission.status)}>
                          {submission.status}
                        </Badge>
                        {expandedSubmission === submission._id ? (
                          <ChevronUp className="h-5 w-5" />
                        ) : (
                          <ChevronDown className="h-5 w-5" />
                        )}
                      </div>
                    </button>

                    {expandedSubmission === submission._id && (
                      <div className="p-4 border-t bg-gray-50 space-y-3">
                        {submission.feedback && (
                          <div>
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Reviewer Feedback:
                            </p>
                            <p className="text-sm text-gray-600 bg-white p-3 rounded">
                              {submission.feedback}
                            </p>
                          </div>
                        )}
                        {submission.rejectedItems &&
                          submission.rejectedItems.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-red-700 mb-1">
                                Rejected Items:{' '}
                                {submission.rejectedItems.join(', ')}
                              </p>
                            </div>
                          )}
                        {submission.reviewedAt && (
                          <p className="text-sm text-gray-500">
                            Reviewed on: {formatDate(submission.reviewedAt)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ),
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Timeline */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle>Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timelineData?.data?.map(
                  (entry: TimelineEntry, index: number) => (
                    <div key={entry._id} className="relative">
                      {index !== timelineData.data.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-gray-200" />
                      )}
                      <div className="flex gap-4">
                        <div className="flex-shrink-0 mt-1">
                          <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                            {getStatusIcon(entry.status)}
                          </div>
                        </div>
                        <div className="flex-1 pb-6">
                          <div className="flex items-start justify-between mb-1">
                            <Badge className={getStatusColor(entry.status)}>
                              {entry.status}
                            </Badge>
                            <span className="text-xs text-gray-500">
                              v{entry.submissionNumber}
                            </span>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mt-2">
                            {entry.note}
                          </p>
                          {entry.feedback && (
                            <p className="text-sm text-gray-600 mt-1 bg-gray-50 p-2 rounded">
                              {entry.feedback}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                            <User className="h-3 w-3" />
                            <span>{entry.actorType}</span>
                            <span>•</span>
                            <span>{formatDate(entry.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Complete Dialog */}
      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Completed</DialogTitle>
            <DialogDescription>
              Are you sure you want to mark this submission as completed? This
              action will finalize the review.
            </DialogDescription>
          </DialogHeader>
          {feedback && (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-sm font-medium mb-1">Your feedback:</p>
              <p className="text-sm text-gray-600">{feedback}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleComplete}
              className="bg-green-600 hover:bg-green-700"
              disabled={reviewMutation.isPending}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Completion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Resubmission</DialogTitle>
            <DialogDescription>
              Please provide feedback explaining why this submission needs to be
              resubmitted.
            </DialogDescription>
          </DialogHeader>
          {!feedback.trim() && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Feedback is required when requesting resubmission.
              </AlertDescription>
            </Alert>
          )}
          {selectedImages.length > 0 && (
            <div className="bg-orange-50 p-3 rounded space-y-2">
              <p className="text-sm font-medium mb-2">
                Rejected items ({selectedImages.length}):
              </p>
              {selectedImages.map((item, idx) => (
                <div key={idx} className="text-sm bg-white p-2 rounded">
                  <span className="font-medium">Image {item.index + 1}:</span>{' '}
                  <span className="text-gray-600">
                    {item.reason || 'No specific reason provided'}
                  </span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRejectDialog(false)}
              disabled={reviewMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={reviewMutation.isPending || !feedback.trim()}
            >
              {reviewMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Request Resubmission
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default TaskReviewPage
