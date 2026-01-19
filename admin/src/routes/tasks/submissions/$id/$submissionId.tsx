// // src/routes/tasks/submissions/$id/$submissionId.tsx
// import { createFileRoute } from '@tanstack/react-router'
// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// import { _axios } from '@/lib/axios'
// import { format } from 'date-fns'
// import {
//   ArrowLeft,
//   CheckCircle2,
//   XCircle,
//   FileText,
//   Image as ImageIcon,
//   Link as LinkIcon,
//   Loader2,
//   MessageSquare,
// } from 'lucide-react'
// import { Button } from '@/components/ui/button'
// import { Textarea } from '@/components/ui/textarea'
// import { useState } from 'react'
// import { cn } from '@/lib/utils'
// import { toast } from 'sonner'

// // Types (expand as needed)
// type TimelineEvent = {
//   _id: string
//   submissionNumber: number
//   status: 'SUBMITTED' | 'RE_SUBMITTED' | 'REJECTED' | 'COMPLETED'
//   timestamp: string
//   note: string
//   actorType: 'STUDENT' | 'ADMIN'
//   feedback?: string
// }

// type SubmissionHistory = {
//   _id: string
//   submissionNumber: number
//   submissionType: 'IMAGES' | 'PDF' | 'LINK'
//   submissionData: {
//     type: 'IMAGES' | 'PDF' | 'LINK'
//     urls: string[]
//   }
//   notes: string
//   status: string
//   submittedAt: string
//   feedback?: string
//   rejectedItems?: string[] // e.g., rejected urls or indices
// }

// type ApiTimelineResponse = {
//   ok: boolean
//   data: TimelineEvent[]
// }

// type ApiHistoryResponse = {
//   ok: boolean
//   data: SubmissionHistory[]
//   mainSubmission: {
//     currentStatus: string
//     totalSubmissions: number
//     latestSubmissionNumber: number
//   }
//   pagination: {
//     currentPage: number
//     totalPages: number
//     totalHistory: number
//     limit: number
//     hasNextPage: boolean
//     hasPrevPage: boolean
//   }
// }

// type ReviewBody = {
//   submissionId: string
//   status: 'REJECTED' | 'COMPLETED'
//   feedback?: string
//   rejectedItems?: string[] // optional array of rejected item urls or indices
// }

// export const Route = createFileRoute('/tasks/submissions/$id/$submissionId')({
//   component: SubmissionReviewPage,
// })

// function SubmissionReviewPage() {
//   const { id: taskId, submissionId } = Route.useParams()
//   const navigate = Route.useNavigate()
//   const queryClient = useQueryClient()

//   const [feedback, setFeedback] = useState('')
//   const [rejectedItems, setRejectedItems] = useState<string[]>([]) // e.g., urls of rejected files

//   const { data: timelineData, isLoading: timelineLoading } =
//     useQuery<ApiTimelineResponse>({
//       queryKey: ['task-timeline', submissionId],
//       queryFn: async () => {
//         const res = await _axios.get(`/task/timeline/${submissionId}`)
//         return res.data
//       },
//     })

//   const { data: historyData, isLoading: historyLoading } =
//     useQuery<ApiHistoryResponse>({
//       queryKey: ['task-history', submissionId],
//       queryFn: async () => {
//         const res = await _axios.get(
//           `/task/submission-history?submissionId=${submissionId}`,
//         ) // Assuming it needs submissionId
//         return res.data
//       },
//     })

//   const reviewMutation = useMutation({
//     mutationFn: async (body: ReviewBody) => {
//       const res = await _axios.post('/api/task/review', body)
//       return res.data
//     },
//     onSuccess: () => {
//       toast({ title: 'Success', description: 'Review submitted successfully' })
//       queryClient.invalidateQueries({
//         queryKey: ['task-timeline', submissionId],
//       })
//       queryClient.invalidateQueries({
//         queryKey: ['task-history', submissionId],
//       })
//       queryClient.invalidateQueries({ queryKey: ['task-submissions', taskId] })
//       setFeedback('')
//       setRejectedItems([])
//     },
//     onError: (err: any) => {
//       toast({
//         variant: 'destructive',
//         title: 'Error',
//         description: err.response?.data?.error || 'Failed to submit review',
//       })
//     },
//   })

//   const handleReview = (status: 'COMPLETED' | 'REJECTED') => {
//     if (status === 'REJECTED' && !feedback.trim()) {
//       toast({
//         variant: 'destructive',
//         description: 'Feedback is required for rejection',
//       })
//       return
//     }

//     reviewMutation.mutate({
//       submissionId,
//       status,
//       feedback: status === 'REJECTED' ? feedback : undefined,
//       rejectedItems:
//         status === 'REJECTED' && rejectedItems.length > 0
//           ? rejectedItems
//           : undefined,
//     })
//   }

//   const isLoading = timelineLoading || historyLoading
//   const timeline = timelineData?.data ?? []
//   const history = historyData?.data ?? []
//   const mainSubmission = historyData?.mainSubmission

//   const canReview =
//     mainSubmission?.currentStatus === 'SUBMITTED' ||
//     mainSubmission?.currentStatus === 'RE_SUBMITTED'

//   if (isLoading) {
//     return (
//       <div className="flex h-screen items-center justify-center">
//         <Loader2 className="h-8 w-8 animate-spin text-primary" />
//       </div>
//     )
//   }

//   return (
//     <div className="container mx-auto p-6">
//       {/* Back Button */}
//       <Button
//         variant="ghost"
//         className="mb-6"
//         onClick={() =>
//           navigate({ to: '/tasks/submissions/$id', params: { id: taskId } })
//         }
//       >
//         <ArrowLeft className="mr-2 h-4 w-4" /> Back to Submissions
//       </Button>

//       <h1 className="text-3xl font-bold mb-8">Submission Review</h1>

//       {/* Timeline Section */}
//       <section className="mb-12">
//         <h2 className="text-xl font-semibold mb-4">Timeline</h2>
//         <div className="relative pl-8 space-y-6 border-l-2 border-muted">
//           {timeline.map((event) => (
//             <div key={event._id} className="relative">
//               <div className="absolute -left-3 top-2 h-6 w-6 rounded-full bg-background border-2 border-primary flex items-center justify-center">
//                 {event.actorType === 'STUDENT' ? (
//                   <MessageSquare className="h-3 w-3" />
//                 ) : (
//                   <CheckCircle2 className="h-3 w-3" />
//                 )}
//               </div>
//               <div className="bg-card p-4 rounded-lg shadow">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="font-medium">
//                     {event.status.replace('_', ' ')} (Attempt{' '}
//                     {event.submissionNumber})
//                   </span>
//                   <span className="text-sm text-muted-foreground">
//                     {format(new Date(event.timestamp), 'MMM dd, yyyy HH:mm')}
//                   </span>
//                 </div>
//                 <p className="text-sm">{event.note}</p>
//                 {event.feedback && (
//                   <p className="mt-2 text-sm italic text-muted-foreground">
//                     Feedback: {event.feedback}
//                   </p>
//                 )}
//               </div>
//             </div>
//           ))}
//           {timeline.length === 0 && (
//             <p className="text-muted-foreground">No timeline events yet</p>
//           )}
//         </div>
//       </section>

//       {/* Submission History & Files */}
//       <section className="mb-12">
//         <h2 className="text-xl font-semibold mb-4">Submission History</h2>
//         {history.map((entry) => (
//           <div key={entry._id} className="mb-6 border rounded-lg p-4">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="font-medium">
//                 Attempt {entry.submissionNumber} ({entry.status})
//               </h3>
//               <span className="text-sm text-muted-foreground">
//                 {format(new Date(entry.submittedAt), 'MMM dd, yyyy HH:mm')}
//               </span>
//             </div>
//             <p className="text-sm mb-4">{entry.notes || 'No notes'}</p>
//             {entry.feedback && (
//               <p className="text-sm italic text-muted-foreground mb-4">
//                 Feedback: {entry.feedback}
//               </p>
//             )}
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//               {entry.submissionData.urls.map((url, index) => {
//                 const isRejected =
//                   entry.rejectedItems?.includes(url) ||
//                   rejectedItems.includes(url)
//                 const type = entry.submissionType
//                 return (
//                   <div
//                     key={index}
//                     className={cn(
//                       'border rounded-lg overflow-hidden relative',
//                       isRejected && 'border-red-500 opacity-70',
//                     )}
//                   >
//                     <div className="p-2 bg-muted flex items-center gap-2">
//                       {type === 'IMAGES' && <ImageIcon className="h-4 w-4" />}
//                       {type === 'PDF' && <FileText className="h-4 w-4" />}
//                       {type === 'LINK' && <LinkIcon className="h-4 w-4" />}
//                       <span className="text-sm font-medium">
//                         Item {index + 1}
//                       </span>
//                     </div>
//                     {type === 'IMAGES' ? (
//                       <img
//                         src={url}
//                         alt={`Submitted image ${index + 1}`}
//                         className="w-full h-48 object-cover"
//                       />
//                     ) : type === 'PDF' ? (
//                       <div className="p-4 text-center">
//                         <Button variant="link" asChild>
//                           <a
//                             href={url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                           >
//                             View PDF
//                           </a>
//                         </Button>
//                       </div>
//                     ) : (
//                       <div className="p-4">
//                         <Button variant="link" asChild>
//                           <a
//                             href={url}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                           >
//                             Open Link
//                           </a>
//                         </Button>
//                       </div>
//                     )}
//                     {canReview && (
//                       <Button
//                         variant="ghost"
//                         size="sm"
//                         className="absolute top-2 right-2"
//                         onClick={() => {
//                           setRejectedItems((prev) =>
//                             prev.includes(url)
//                               ? prev.filter((u) => u !== url)
//                               : [...prev, url],
//                           )
//                         }}
//                       >
//                         <XCircle
//                           className={cn(
//                             'h-4 w-4',
//                             isRejected ? 'text-red-500' : 'text-gray-500',
//                           )}
//                         />
//                       </Button>
//                     )}
//                   </div>
//                 )
//               })}
//             </div>
//           </div>
//         ))}
//         {history.length === 0 && (
//           <p className="text-muted-foreground">No submission history</p>
//         )}
//       </section>

//       {/* Review Form */}
//       {canReview && (
//         <section>
//           <h2 className="text-xl font-semibold mb-4">Review Submission</h2>
//           <div className="space-y-4">
//             <Textarea
//               placeholder="Provide feedback (required for rejection)..."
//               value={feedback}
//               onChange={(e) => setFeedback(e.target.value)}
//               className="min-h-[100px]"
//             />
//             <div className="flex gap-4">
//               <Button
//                 onClick={() => handleReview('COMPLETED')}
//                 disabled={reviewMutation.isPending}
//                 className="bg-green-600 hover:bg-green-700"
//               >
//                 {reviewMutation.isPending ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <CheckCircle2 className="mr-2 h-4 w-4" />
//                 )}
//                 Complete
//               </Button>
//               <Button
//                 variant="destructive"
//                 onClick={() => handleReview('REJECTED')}
//                 disabled={reviewMutation.isPending}
//               >
//                 {reviewMutation.isPending ? (
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                 ) : (
//                   <XCircle className="mr-2 h-4 w-4" />
//                 )}
//                 Reject
//               </Button>
//             </div>
//           </div>
//         </section>
//       )}
//     </div>
//   )
// }

import TaskReviewPage from '@/components/tasks/trackPage'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/tasks/submissions/$id/$submissionId')({
  component: TaskReviewPage,
})
