// import { Button } from '@/components/ui/button';
// import { _axios } from '@/lib/axios';
// import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
// import { createFileRoute, useNavigate } from '@tanstack/react-router';
// import { Plus, Edit, Trash2, HelpCircle } from 'lucide-react';
// import { useState } from 'react';
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
//   DialogFooter,
// } from '@/components/ui/dialog';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
//   AlertDialogTrigger,
// } from '@/components/ui/alert-dialog';
// import {
//   Accordion,
//   AccordionContent,
//   AccordionItem,
//   AccordionTrigger,
// } from '@/components/ui/accordion';
// import { toast } from 'sonner';

// export const Route = createFileRoute('/courses/$id/chapters/$chapterId/')({
//   component: RouteComponent,
// });

// function RouteComponent() {
//   const { id: courseId, chapterId } = Route.useParams();
//   const queryClient = useQueryClient();
//   const navigate = useNavigate();
//   const [isCreateOpen, setIsCreateOpen] = useState(false);
//   const [isEditOpen, setIsEditOpen] = useState(false);
//   const [editingLesson, setEditingLesson] = useState<any>(null);

//   const { data: lessons = [], isLoading } = useQuery({
//     queryKey: ['lessons', chapterId],
//     queryFn: async () => {
//       if (!chapterId || chapterId === 'new') return [];
//       const res = await _axios.get(`/lessons/${chapterId}`);
//       return res.data.lessons || res.data || [];
//     },
//     enabled: !!chapterId && chapterId !== 'new', // Add this line
//     refetchOnMount: true, // Add this line
//     staleTime: 0, // Add this line to ensure fresh data
//   });
//   // Mutations (unchanged)
//   const createMutation = useMutation({
//     mutationFn: (data: any) =>
//       _axios.post('/lessons', { ...data, courseId, chapterId }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
//       setIsCreateOpen(false);
//       toast.success('Lesson created successfully');
//     },
//     onError: () => toast.error('Failed to create lesson'),
//   });

//   const updateMutation = useMutation({
//     mutationFn: ({ lessonId, data }: any) =>
//       _axios.put(`/lessons/${lessonId}`, { ...data, courseId, chapterId }),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
//       setIsEditOpen(false);
//       toast.success('Lesson updated successfully');
//     },
//   });

//   const toggleStatusMutation = useMutation({
//     mutationFn: (lessonId: string) => _axios.patch(`/lessons/${lessonId}`),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
//       toast.success('Lesson status updated successfully');
//     },
//   });

//   const deleteMutation = useMutation({
//     mutationFn: (lessonId: string) => _axios.delete(`/lessons/${lessonId}`),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
//       toast.success('Lesson deleted successfully');
//     },
//   });

//   const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     const formData = new FormData(e.currentTarget);
//     const data = {
//       lessonName: formData.get('lessonName') as string,
//       order: Number(formData.get('order')),
//       duration: Number(formData.get('duration')),
//       videoUrl: formData.get('videoUrl') as string,
//     };
//     createMutation.mutate(data);
//   };

//   const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     if (!editingLesson) return;
//     const formData = new FormData(e.currentTarget);
//     const data = {
//       lessonName: formData.get('lessonName') as string,
//       order: Number(formData.get('order')),
//       duration: Number(formData.get('duration')),
//       videoUrl: formData.get('videoUrl') as string,
//     };
//     updateMutation.mutate({ lessonId: editingLesson._id, data });
//   };

//   const openEdit = (lesson: any) => {
//     setEditingLesson(lesson);
//     setIsEditOpen(true);
//   };

//   if (isLoading)
//     return <div className="p-8 text-center">Loading lessons...</div>;

//   return (
//     <div className="">
//       <header className="flex justify-between items-center p-4  text-foreground">
//         <h5 className="font-medium font-nunito">Lessons</h5>

//         <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
//           <DialogTrigger asChild>
//             <Button className="rounded-xsm cursor-pointer">
//               <Plus className="mr-2 h-4 w-4" /> Add Lesson
//             </Button>
//           </DialogTrigger>
//           <DialogContent autoFocus={false}>
//             <DialogHeader>
//               <DialogTitle>Create New Lesson</DialogTitle>
//             </DialogHeader>
//             <form onSubmit={handleCreate}>
//               <div className="grid gap-4 py-4">
//                 <div className="grid gap-2">
//                   <Label htmlFor="lessonName">Lesson Name</Label>
//                   <Input
//                     type="text"
//                     autoFocus={false}
//                     id="lessonName"
//                     name="lessonName"
//                     required
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="duration">Duration(min)</Label>
//                   <Input id="duration" name="duration" type="number" required />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="order">Order</Label>
//                   <Input
//                     id="order"
//                     name="order"
//                     type="number"
//                     defaultValue={lessons.length + 1}
//                     required
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="videoUrl">Video URL</Label>
//                   <Input
//                     id="videoUrl"
//                     name="videoUrl"
//                     placeholder="https://..."
//                   />
//                 </div>
//               </div>
//               <DialogFooter>
//                 <Button type="submit" disabled={createMutation.isPending}>
//                   Create
//                 </Button>
//               </DialogFooter>
//             </form>
//           </DialogContent>
//         </Dialog>
//       </header>

//       {lessons.length === 0 ? (
//         <div className="flex items-center justify-center h-64 text-muted-foreground">
//           <p>No lessons found. Add one to get started!</p>
//         </div>
//       ) : (
//         <Accordion type="single" collapsible className="w-full px-2 pt-2">
//           {lessons.map((lesson: any) => (
//             <AccordionItem
//               key={lesson._id}
//               value={lesson._id}
//               className="mb-3 rounded-lg border bg-card/50 shadow-sm transition-all hover:shadow-md">
//               <AccordionTrigger
//                 className={`
//           group px-5 py-4 text-left transition-all
//           hover:no-underline
//           data-[state=open]:bg-accent/30
//           data-[state=closed]:hover:bg-accent/20
//           rounded-t-lg
//           [&[data-state=open]>div>svg]:rotate-180
//         `}>
//                 <div className="flex w-full items-center justify-between gap-4">
//                   {/* Left side - name + order */}
//                   <div className="flex flex-1 items-center gap-3">
//                     <span className="font-medium text-base text-foreground capitalize">
//                       {lesson.lessonName}
//                     </span>
//                     <span className="text-sm text-muted-foreground">
//                       Order: {lesson.order}
//                     </span>
//                   </div>

//                   {/* Right side - actions (stops propagation so click doesn't toggle accordion) */}
//                   <div
//                     className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
//                     onClick={(e) => e.stopPropagation()}>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         navigate({
//                           to: '/tasks',
//                           search: {
//                             lessonId: lesson._id,
//                             courseId,
//                             chapterId,
//                             mode: 'list',
//                           },
//                         })
//                       }
//                       className="h-8 text-xs gap-1">
//                       <HelpCircle className="h-3.5 w-3.5" />
//                       Tasks
//                     </Button>

//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         navigate({
//                           to: '/courses/quizes',
//                           search: {
//                             page: 1,
//                             limit: 10,
//                             lessonId: lesson._id,
//                             courseId,
//                             chapterId,
//                             mode: 'list',
//                           },
//                         })
//                       }
//                       className="h-8 text-xs gap-1">
//                       <HelpCircle className="h-3.5 w-3.5" />
//                       Questions
//                     </Button>

//                     <Button
//                       variant="ghost"
//                       size="icon"
//                       className="h-8 w-8"
//                       onClick={() => openEdit(lesson)}>
//                       <Edit className="h-4 w-4" />
//                     </Button>

//                     {/* <Button
//                       variant="ghost"
//                       size="icon"
//                       className="h-8 w-8"
//                       onClick={() => toggleStatusMutation.mutate(lesson._id)}
//                       disabled={toggleStatusMutation.isPending}>
//                       {lesson.isActive ? (
//                         <ToggleRight className="h-5 w-5 text-green-600" />
//                       ) : (
//                         <ToggleLeft className="h-5 w-5 text-red-600" />
//                       )}
//                     </Button> */}

//                     <AlertDialog>
//                       <AlertDialogTrigger asChild>
//                         <Button variant="ghost" size="icon" className="h-8 w-8">
//                           <Trash2 className="h-4 w-4 text-destructive" />
//                         </Button>
//                       </AlertDialogTrigger>
//                       <AlertDialogContent>
//                         <AlertDialogHeader>
//                           <AlertDialogTitle>
//                             Delete "{lesson.lessonName}"?
//                           </AlertDialogTitle>
//                           <AlertDialogDescription>
//                             This will permanently remove the lesson and all
//                             associated content.
//                           </AlertDialogDescription>
//                         </AlertDialogHeader>
//                         <AlertDialogFooter>
//                           <AlertDialogCancel>Cancel</AlertDialogCancel>
//                           <AlertDialogAction
//                             onClick={() => deleteMutation.mutate(lesson._id)}
//                             className="">
//                             Delete
//                           </AlertDialogAction>
//                         </AlertDialogFooter>
//                       </AlertDialogContent>
//                     </AlertDialog>
//                   </div>
//                 </div>
//               </AccordionTrigger>

//               <AccordionContent className="px-5 pb-5 pt-3 text-sm border-t">
//                 <div className="space-y-2.5">
//                   <p>
//                     <span className="font-medium">Status:</span>{' '}
//                     {lesson.isActive ? (
//                       <span className="text-green-600 font-medium">Active</span>
//                     ) : (
//                       <span className="text-red-600 font-medium">Inactive</span>
//                     )}
//                   </p>
//                   <p className="break-all">
//                     <span className="font-medium">Video:</span>{' '}
//                     {lesson.videoUrl ? (
//                       <a
//                         href={lesson.videoUrl}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                         className="text-primary hover:underline">
//                         {lesson.videoUrl}
//                       </a>
//                     ) : (
//                       <span className="text-muted-foreground italic">
//                         No video attached
//                       </span>
//                     )}
//                   </p>
//                 </div>
//               </AccordionContent>
//             </AccordionItem>
//           ))}
//         </Accordion>
//       )}

//       {/* Edit Dialog (unchanged) */}
//       <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
//         <DialogContent autoFocus={false}>
//           <DialogHeader>
//             <DialogTitle>Edit Lesson</DialogTitle>
//           </DialogHeader>
//           {editingLesson && (
//             <form onSubmit={handleUpdate}>
//               <div className="grid gap-4 py-4">
//                 <div className="grid gap-2">
//                   <Label htmlFor="edit-lessonName">Lesson Name</Label>
//                   <Input
//                     id="edit-lessonName"
//                     name="lessonName"
//                     defaultValue={editingLesson.lessonName}
//                     required
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="edit-duration">Duration(min)</Label>
//                   <Input
//                     id="edit-duration"
//                     name="duration"
//                     type="number"
//                     required
//                     defaultValue={editingLesson.duration}
//                     autoFocus={false}
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="edit-order">Order</Label>
//                   <Input
//                     id="edit-order"
//                     name="order"
//                     type="number"
//                     defaultValue={editingLesson.order}
//                     required
//                     autoFocus={false}
//                   />
//                 </div>
//                 <div className="grid gap-2">
//                   <Label htmlFor="edit-videoUrl">Video URL</Label>
//                   <Input
//                     id="edit-videoUrl"
//                     name="videoUrl"
//                     defaultValue={editingLesson.videoUrl || ''}
//                   />
//                 </div>
//               </div>
//               <DialogFooter>
//                 <Button type="submit" disabled={updateMutation.isPending}>
//                   Save Changes
//                 </Button>
//               </DialogFooter>
//             </form>
//           )}
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }
import { Button } from '@/components/ui/button';
import { _axios } from '@/lib/axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  Plus,
  Edit,
  Trash2,
  ToggleLeft,
  ToggleRight,
  HelpCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { toast } from 'sonner';

export const Route = createFileRoute('/courses/$id/chapters/$chapterId/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id: courseId, chapterId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons', chapterId],
    queryFn: async () => {
      if (!chapterId || chapterId === 'new') return [];
      const res = await _axios.get(`/lessons/${chapterId}`);
      return res.data.lessons || res.data || [];
    },
    enabled: !!chapterId && chapterId !== 'new',
    refetchOnMount: true,
    staleTime: 0,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) =>
      _axios.post('/lessons', { ...data, courseId, chapterId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
      setIsCreateOpen(false);
      toast.success('Lesson created successfully');
    },
    onError: () => toast.error('Failed to create lesson'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ lessonId, data }: any) =>
      _axios.put(`/lessons/${lessonId}`, { ...data, courseId, chapterId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
      setIsEditOpen(false);
      toast.success('Lesson updated successfully');
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: (lessonId: string) => _axios.patch(`/lessons/${lessonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
      toast.success('Lesson status updated successfully');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (lessonId: string) => _axios.delete(`/lessons/${lessonId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lessons', chapterId] });
      toast.success('Lesson deleted successfully');
    },
  });

  // Helper function to convert time inputs to seconds and rounded minutes
  const convertTimeToSecondsAndMinutes = (
    hours: number,
    minutes: number,
    seconds: number,
  ) => {
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    const roundedMinutes = Math.ceil(totalSeconds / 60); // Round up
    return { totalSeconds, roundedMinutes };
  };

  // Helper function to convert seconds back to hours, minutes, seconds for edit form
  const convertSecondsToTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return { hours, minutes, seconds };
  };

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const hours = Number(formData.get('hours') || 0);
    const minutes = Number(formData.get('minutes') || 0);
    const seconds = Number(formData.get('seconds') || 0);

    const { totalSeconds, roundedMinutes } = convertTimeToSecondsAndMinutes(
      hours,
      minutes,
      seconds,
    );

    const data = {
      lessonName: formData.get('lessonName') as string,
      order: Number(formData.get('order')),
      preQuizAttempt: Number(formData.get('preQuizAttempt')),
      postQuizAttempt: Number(formData.get('postQuizAttempt')),
      duration: roundedMinutes,
      accurateSeconds: totalSeconds,
      videoUrl: formData.get('videoUrl') as string,
    };

    createMutation.mutate(data);
  };

  const handleUpdate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLesson) return;

    const formData = new FormData(e.currentTarget);

    const hours = Number(formData.get('hours') || 0);
    const minutes = Number(formData.get('minutes') || 0);
    const seconds = Number(formData.get('seconds') || 0);

    const { totalSeconds, roundedMinutes } = convertTimeToSecondsAndMinutes(
      hours,
      minutes,
      seconds,
    );

    const data = {
      lessonName: formData.get('lessonName') as string,
      order: Number(formData.get('order')),
      duration: roundedMinutes, // Rounded minutes for display
      accurateSeconds: totalSeconds, // Exact seconds for video tracking
      videoUrl: formData.get('videoUrl') as string,
    };

    updateMutation.mutate({ lessonId: editingLesson._id, data });
  };

  const openEdit = (lesson: any) => {
    setEditingLesson(lesson);
    setIsEditOpen(true);
  };

  if (isLoading)
    return <div className="p-8 text-center">Loading lessons...</div>;

  return (
    <div className="">
      <header className="flex justify-between items-center p-4  text-foreground">
        <h5 className="font-medium font-nunito">Lessons</h5>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-xsm cursor-pointer">
              <Plus className="mr-2 h-4 w-4" /> Add Lesson
            </Button>
          </DialogTrigger>
          <DialogContent autoFocus={false}>
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="lessonName">Lesson Name</Label>
                  <Input
                    type="text"
                    autoFocus={false}
                    id="lessonName"
                    name="lessonName"
                    required
                  />
                </div>

                {/* Video Duration Input */}
                <div className="grid gap-2">
                  <Label>Video Duration (Accurate)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label
                        htmlFor="hours"
                        className="text-xs text-muted-foreground">
                        Hours
                      </Label>
                      <Input
                        id="hours"
                        name="hours"
                        type="number"
                        min="0"
                        defaultValue="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="minutes"
                        className="text-xs text-muted-foreground">
                        Minutes
                      </Label>
                      <Input
                        id="minutes"
                        name="minutes"
                        type="number"
                        min="0"
                        max="59"
                        defaultValue="0"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="seconds"
                        className="text-xs text-muted-foreground">
                        Seconds
                      </Label>
                      <Input
                        id="seconds"
                        name="seconds"
                        type="number"
                        min="0"
                        max="59"
                        defaultValue="0"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {/* <p className="text-xs text-muted-foreground">
                    Example: 1 hour 30 minutes 30 seconds = 91 minutes (rounded)
                  </p> */}
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="order">Order</Label>
                  <Input
                    id="order"
                    name="order"
                    type="number"
                    defaultValue={lessons.length + 1}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="videoUrl">Video URL</Label>
                  <Input
                    id="videoUrl"
                    name="videoUrl"
                    placeholder="https://..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preQuizAttempt">Pre Quiz max Attempt</Label>
                  <Input
                    id="preQuizAttempt"
                    name="preQuizAttempt"
                    type="number"
                    min="0"
                    defaultValue="0"
                    placeholder="0"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="postQuizAttempt">Post Quiz Attempt</Label>
                  <Input
                    id="postQuizAttempt"
                    name="postQuizAttempt"
                    type="number"
                    min="0"
                    defaultValue="0"
                    placeholder="0"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  Create
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {lessons.length === 0 ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No lessons found. Add one to get started!</p>
        </div>
      ) : (
        <Accordion type="single" collapsible className="w-full px-2 pt-2">
          {lessons.map((lesson: any) => (
            <AccordionItem
              key={lesson._id}
              value={lesson._id}
              className="mb-3 rounded-lg border bg-card/50 shadow-sm transition-all hover:shadow-md">
              <AccordionTrigger
                className={`
          group px-5 py-4 text-left transition-all
          hover:no-underline
          data-[state=open]:bg-accent/30
          data-[state=closed]:hover:bg-accent/20
          rounded-t-lg
          [&[data-state=open]>div>svg]:rotate-180
        `}>
                <div className="flex w-full items-center justify-between gap-4">
                  <div className="flex flex-1 items-center gap-3">
                    <span className="font-medium text-base text-foreground capitalize">
                      {lesson.lessonName}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Order: {lesson.order}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      Duration: {lesson.duration} min
                    </span>
                  </div>

                  <div
                    className="flex items-center gap-2 opacity-70 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/courses/exams',
                          search: {
                            page: 1,
                            limit: 10,
                            lessonId: lesson._id,
                            courseId,
                            chapterId,
                            mode: 'list',
                          },
                        })
                      }
                      className="h-8 text-xs gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Exams
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/courses/tasks',
                          search: {
                            page: 1,
                            limit: 10,
                            lessonId: lesson._id,
                            courseId,
                            chapterId,
                            mode: 'list',
                          },
                        })
                      }
                      className="h-8 text-xs gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Tasks
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        navigate({
                          to: '/courses/quizes',
                          search: {
                            page: 1,
                            limit: 10,
                            lessonId: lesson._id,
                            courseId,
                            chapterId,
                            mode: 'list',
                          },
                        })
                      }
                      className="h-8 text-xs gap-1">
                      <HelpCircle className="h-3.5 w-3.5" />
                      Questions
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEdit(lesson)}>
                      <Edit className="h-4 w-4" />
                    </Button>

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Delete "{lesson.lessonName}"?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the lesson and all
                            associated content.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteMutation.mutate(lesson._id)}
                            className="">
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5 pt-3 text-sm border-t">
                <div className="space-y-2.5">
                  {/* <p>
                    <span className="font-medium">Status:</span>{' '}
                    {lesson.isActive ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-600 font-medium">Inactive</span>
                    )}
                  </p> */}
                  <p>
                    <span className="font-medium">Duration:</span>{' '}
                    {lesson.duration} minutes
                    {lesson.accurateSeconds && (
                      <span className="text-muted-foreground text-xs ml-2">
                        ({Math.floor(lesson.accurateSeconds / 60)}:
                        {String(lesson.accurateSeconds % 60).padStart(2, '0')})
                      </span>
                    )}
                  </p>
                  <p className="break-all">
                    <span className="font-medium">Video:</span>{' '}
                    {lesson.videoUrl ? (
                      <a
                        href={lesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline cursor-pointer">
                        {lesson.videoUrl}
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">
                        No video attached
                      </span>
                    )}
                  </p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent autoFocus={false}>
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          {editingLesson && (
            <form onSubmit={handleUpdate}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-lessonName">Lesson Name</Label>
                  <Input
                    id="edit-lessonName"
                    name="lessonName"
                    defaultValue={editingLesson.lessonName}
                    required
                  />
                </div>

                {/* Video Duration Input */}
                <div className="grid gap-2">
                  <Label>Video Duration (Accurate)</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <Label
                        htmlFor="edit-hours"
                        className="text-xs text-muted-foreground">
                        Hours
                      </Label>
                      <Input
                        id="edit-hours"
                        name="hours"
                        type="number"
                        min="0"
                        defaultValue={
                          editingLesson.accurateSeconds
                            ? convertSecondsToTime(
                                editingLesson.accurateSeconds,
                              ).hours
                            : 0
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="edit-minutes"
                        className="text-xs text-muted-foreground">
                        Minutes
                      </Label>
                      <Input
                        id="edit-minutes"
                        name="minutes"
                        type="number"
                        min="0"
                        max="59"
                        defaultValue={
                          editingLesson.accurateSeconds
                            ? convertSecondsToTime(
                                editingLesson.accurateSeconds,
                              ).minutes
                            : 0
                        }
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label
                        htmlFor="edit-seconds"
                        className="text-xs text-muted-foreground">
                        Seconds
                      </Label>
                      <Input
                        id="edit-seconds"
                        name="seconds"
                        type="number"
                        min="0"
                        max="59"
                        defaultValue={
                          editingLesson.accurateSeconds
                            ? convertSecondsToTime(
                                editingLesson.accurateSeconds,
                              ).seconds
                            : 0
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-order">Order</Label>
                  <Input
                    id="edit-order"
                    name="order"
                    type="number"
                    defaultValue={editingLesson.order}
                    required
                    autoFocus={false}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-videoUrl">Video URL</Label>
                  <Input
                    id="edit-videoUrl"
                    name="videoUrl"
                    defaultValue={editingLesson.videoUrl || ''}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
