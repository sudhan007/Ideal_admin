import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import appCss from '../styles.css?url'
import { NotFound } from '@/components/NotFound'
import Layout from '@/components/Layout'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'

export const Route = createRootRoute<{ queryClient: QueryClient }>({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        name: 'description',
        content:
          'Ideal Admin - Modern admin dashboard for managing your applications',
      },
      {
        name: 'keywords',
        content: 'admin, dashboard, management, panel, analytics',
      },
      {
        name: 'author',
        content: 'Ideal Admin',
      },
      {
        name: 'theme-color',
        content: '#3b82f6',
      },
      // Open Graph / Facebook
      {
        property: 'og:type',
        content: 'website',
      },
      {
        property: 'og:title',
        content: 'Ideal Admin - Modern Admin Dashboard',
      },
      {
        property: 'og:description',
        content:
          'Powerful and intuitive admin dashboard for managing your applications',
      },
      {
        property: 'og:image',
        content: '/og-image.jpg', // Add your OG image path
      },
      // Twitter
      {
        name: 'twitter:card',
        content: 'summary_large_image',
      },
      {
        name: 'twitter:title',
        content: 'Ideal Admin - Modern Admin Dashboard',
      },
      {
        name: 'twitter:description',
        content:
          'Powerful and intuitive admin dashboard for managing your applications',
      },
      {
        name: 'twitter:image',
        content: '/twitter-image.jpg', // Add your Twitter image path
      },
    ],
    title: 'Ideal Admin - Modern Admin Dashboard',
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      // Favicon and Apple Touch Icons
      {
        rel: 'icon',
        type: 'image/x-icon',
        href: '/favicon.ico',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/favicon-32x32.png',
      },
      {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/favicon-16x16.png',
      },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
    ],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
    },
  },
})

function RootDocument() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false)
  return (
    <html lang="en">
      <head>
        <title>Ideal Admin</title>
        <HeadContent />
      </head>
      <body className={`${isDarkMode ? 'dark ' : ''}`}>
        <QueryClientProvider client={queryClient}>
          <Layout isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        </QueryClientProvider>
        <Scripts />
      </body>
    </html>
  )
}
