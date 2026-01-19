import { NotFound } from '@/components/NotFound'
import CreateEditTask from '@/components/tasks/createTask'
import { TaskList } from '@/components/tasks/taskList'
import { createFileRoute, useSearch } from '@tanstack/react-router'

export const Route = createFileRoute('/tasks/')({
  component: RouteComponent,

  validateSearch: (search: {
    lessonId?: string
    courseId?: string
    chapterId?: string
    mode?: 'list' | 'create' | 'edit'
    taskId?: string
    taskData?: any
  }) => search,
})

function RouteComponent() {
  const search = useSearch({ from: '/tasks/' })
  const { mode, chapterId, courseId, lessonId, taskId, taskData } = search
  console.log(taskData)
  // if (!chapterId || !courseId || !lessonId) {
  //   return null
  // }

  if (mode === 'create') {
    return (
      <CreateEditTask
        courseId={courseId}
        lessonId={lessonId}
        chapterId={chapterId}
      />
    )
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
    )
  }

  if (mode === 'list') {
    return <TaskList />
  }

  return (
    <div>
      <NotFound />
    </div>
  )
}
