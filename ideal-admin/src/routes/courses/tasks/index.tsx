import { NotFound } from '@/components/NotFound';
import CreateEditTask from '@/components/tasks/createTask';
import { TaskList } from '@/components/tasks/taskList';
import { createFileRoute, useSearch } from '@tanstack/react-router';

export const Route = createFileRoute('/courses/tasks/')({
  component: RouteComponent,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      lessonId: search.lessonId,
      courseId: search.courseId,
      chapterId: search.chapterId,
      mode: search.mode,
      taskId: search.taskId,
      taskData: search.taskData,
      page: Number(search.page ?? 1),
      search: (search.search as string) ?? '',
      limit: (search.limit as number) ?? 10,
      sortBy: (search.sortBy as string) ?? 'createdAt',
      sortOrder: (search.sortOrder as 'asc' | 'desc') ?? 'desc',
    };
  },
});

function RouteComponent() {
  const search = useSearch({ from: '/courses/tasks/' });
  const {
    mode = 'list',
    chapterId,
    courseId,
    lessonId,
    taskId,
    taskData,
  } = search;

  if (
    (mode === 'create' || mode === 'edit') &&
    (!chapterId || !courseId || !lessonId)
  ) {
    return <NotFound />;
  }

  if (mode === 'create') {
    return (
      <CreateEditTask
        courseId={courseId}
        lessonId={lessonId}
        chapterId={chapterId}
      />
    );
  }

  if (mode === 'edit' && taskId) {
    return (
      <CreateEditTask
        courseId={courseId}
        lessonId={lessonId}
        chapterId={chapterId}
        taskId={taskId}
        taskData={taskData}
      />
    );
  }

  if (mode === 'list') {
    return <TaskList />;
  }

  return <NotFound />;
}
