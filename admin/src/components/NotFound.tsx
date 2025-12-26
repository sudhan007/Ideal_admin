// app/routes/__not-found.tsx
import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Home, BookOpen } from 'lucide-react'

export function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-5">
      <div className="text-center space-y-8">
        <h1 className="text-9xl font-black text-white/20 select-none">404</h1>
        <div className="space-y-4">
          <p className="text-4xl font-bold text-white">Page Not Found</p>
          <p className="text-xl text-purple-200 max-w-md mx-auto">
            The course or lesson you're looking for doesn't exist... yet!
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
            <Link to="/demo/api/names">
              <BookOpen className="mr-2 h-5 w-5" />
              Browse Courses
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link to="/" className="text-white border-purple-400 hover:bg-purple-600">
              <Home className="mr-2 h-5 w-5" />
              Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}