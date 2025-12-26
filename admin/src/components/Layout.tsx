import {
  ChevronLeftCircle,
  Home,
  Library,
  Menu,
  MessageCircleQuestionMark,
  Moon,
  Sun,
} from 'lucide-react'
import { useEffect, useState } from 'react'
// import { Separator } from "./ui/separator";
import { Outlet, useLocation, useNavigate } from '@tanstack/react-router'
// import { DynamicBreadcrumb } from "./DynamicBreadcrumb";
import { Toaster } from '@/components/ui/sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
// Define link type for TypeScript
interface Link {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

// Navigation links
const links: Link[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Courses', href: '/courses', icon: Library },
  {
    name: 'Questions',
    href: '/questions?lessonId=694b64159a673d7d1b495b1c&courseId=694b63969a673d7d1b495b19&chapterId=694b63e79a673d7d1b495b1a&mode=create',
    icon: MessageCircleQuestionMark,
  },
]

export default function Layout({ isDarkMode, setIsDarkMode }: any) {
  const navigate = useNavigate()
  const location = useLocation()

  // Initialize states with safe defaults (no localStorage access during SSR)
  const [isIconMode, setIsIconMode] = useState<boolean>(true)
  const [activeMenu, setActiveMenu] = useState<string>('')
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const [isLargeScreen, setIsLargeScreen] = useState<boolean>(true)
  // const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)

  // Load settings from localStorage after component mounts (client-side only)
  useEffect(() => {
    setMounted(true)

    // Load sidebar mode
    const savedSidebarMode = localStorage.getItem('sidebarMode')
    if (savedSidebarMode === 'icon') {
      setIsIconMode(true)
    } else {
      setIsIconMode(false)
    }

    // Load dark mode
    const savedDarkMode = localStorage.getItem('darkMode')
    if (savedDarkMode === 'true') {
      setIsDarkMode(true)
    }

    // Set initial screen size
    setIsLargeScreen(window.innerWidth >= 1024)
  }, [])

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode
    setIsDarkMode(newDarkMode)
    localStorage.setItem('darkMode', String(newDarkMode))
  }

  // Handle window resize to detect screen size
  useEffect(() => {
    const handleResize = () => {
      setIsLargeScreen(window.innerWidth >= 1024)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Persist sidebar mode for large screens
  useEffect(() => {
    if (mounted && isLargeScreen) {
      localStorage.setItem('sidebarMode', isIconMode ? 'icon' : 'default')
    }
  }, [isIconMode, isLargeScreen, mounted])

  // Toggle functions
  const toggleSidebar = () => {
    if (isLargeScreen) {
      setIsIconMode(!isIconMode)
    } else {
      setIsOpen(!isOpen)
    }
  }

  const handleMenuClick = (path: string) => {
    navigate({
      to: path,
    })
    setActiveMenu(path)
    setIsOpen(false)
  }

  useEffect(() => {
    const activeMenu = location.pathname.split('/')[1]
      ? `/${location.pathname.split('/')[1]}`
      : '/'
    setActiveMenu(activeMenu)
  }, [location.pathname])

  return (
    <main>
      <aside
        className={`z-50
          min-h-screen bg-sidebar text-sidebar-foreground transform fixed transition-all duration-300
          overflow-hidden
          ${
            isLargeScreen
              ? isIconMode
                ? 'w-20'
                : 'w-72'
              : isOpen
                ? 'w-72 opacity-100 pointer-events-auto'
                : 'w-0 p-0 pointer-events-none -translate-x-72 duration-500'
          }
        `}
      >
        <ul className="flex flex-col gap-0 relative">
          <li
            className={`flex items-center absolute top-2 right-0 p-2 m-1 gap-3 rounded-sm cursor-pointer ${isIconMode && isLargeScreen ? 'justify-center' : ''}`}
          >
            {!isLargeScreen && (
              <ChevronLeftCircle
                className="right-2 cursor-pointer"
                onClick={toggleSidebar}
              />
            )}
            {isLargeScreen && !isIconMode && (
              <ChevronLeftCircle
                className="right-2 cursor-pointer"
                onClick={toggleSidebar}
              />
            )}
          </li>

          <li
            className={`flex items-center p-2 m-1 gap-3 rounded-sm min-h-16 cursor-pointer ${isIconMode && isLargeScreen ? 'justify-center' : ''}`}
          >
            <span>
              {!isIconMode && <img src="/logo.png" alt="" className="" />}
              {isIconMode && isLargeScreen && (
                <Menu
                  className={`cursor-pointer ${isIconMode ? 'top-12 right-0' : ''}`}
                  onClick={toggleSidebar}
                />
              )}
            </span>
          </li>

          {links.map((link, index) =>
            isIconMode ? (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <li
                    onClick={() => handleMenuClick(link.href)}
                    className={`flex items-center p-2 m-1 gap-3 rounded-sm cursor-pointer hover:bg-background hover:text-sidebar-foreground ${isIconMode && isLargeScreen ? 'justify-center' : ''} ${activeMenu === link.href ? 'bg-background text-sidebar-foreground' : ''}`}
                  >
                    <span>
                      <link.icon className="w-6 h-6" />
                    </span>

                    {((!isLargeScreen && isOpen) ||
                      (isLargeScreen && !isIconMode)) && (
                      <span className="text-lg">{link.name}</span>
                    )}
                  </li>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{link.name}</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <li
                key={index}
                onClick={() => handleMenuClick(link.href)}
                className={`flex items-center p-2 m-1 gap-3 rounded-sm cursor-pointer hover:bg-background hover:text-sidebar-foreground ${isIconMode && isLargeScreen ? 'justify-center' : ''} ${activeMenu === link.href ? 'bg-background text-sidebar-foreground' : ''}`}
              >
                <span>
                  <link.icon className="w-6 h-6" />
                </span>

                {((!isLargeScreen && isOpen) ||
                  (isLargeScreen && !isIconMode)) && (
                  <span className="text-lg">{link.name}</span>
                )}
              </li>
            ),
          )}
        </ul>
      </aside>

      <header
        className={`h-16 z-45 fixed flex justify-between transform transition-all duration-300 bg-sidebar text-sidebar-foreground p-2 ${isLargeScreen && !isIconMode ? 'ml-72 min-w-[calc(100vw-18rem)]' : isLargeScreen ? 'ml-20 min-w-[calc(100vw-5rem)]' : 'min-w-full'}`}
      >
        <div className="h-full flex items-center text-primary gap-3">
          {!isLargeScreen && (
            <Menu className="cursor-pointer" onClick={toggleSidebar} />
          )}
          <h1 className="text-3xl capitalize text-foreground">
            {location.pathname.split('/')[1] !== ''
              ? location.pathname.split('/')[1]
              : 'Dashboard'}
          </h1>
        </div>

        <div className="h-full flex items-center mr-5">
          <button onClick={toggleDarkMode}>
            {isDarkMode ? (
              <Sun className="w-6 h-6" />
            ) : (
              <Moon className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      <main
        className={`relative p-2 pt-18 ${isLargeScreen && !isIconMode ? 'ml-72' : isLargeScreen ? 'ml-20' : ''}`}
      >
        {/* <div className="sticky top-16 p-2 bg-background z-40">
          <DynamicBreadcrumb />
        </div> */}
        <Outlet />
        <Toaster />
      </main>
    </main>
  )
}
