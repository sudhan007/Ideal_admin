import { NotFound } from '@/components/NotFound'
import CreateQuestion from '@/components/Questions/CreateQuestion'
import QuestionList from '@/components/Questions/QuestionList'
import { createFileRoute, useSearch } from '@tanstack/react-router'

export const Route = createFileRoute('/questions/')({
  component: RouteComponent,

  validateSearch: (search: {
    lessonId?: string
    courseId?: string
    chapterId?: string
    mode?: 'list' | 'create'
  }) => search,
})

function RouteComponent() {
  const search = useSearch({ from: '/questions/' })
  const { mode, chapterId, courseId, lessonId } = search
  console.log(mode)
  // if (!chapterId || !courseId || !lessonId) {
  //   return null
  // }

  if (mode === 'create') {
    return (
      <CreateQuestion
        courseId={courseId}
        lessonId={lessonId}
        chapterId={chapterId}
      />
    )
  }

  if (mode === 'list') {
    return <QuestionList />
  }

  return (
    <div>
      <NotFound />
    </div>
  )
}
