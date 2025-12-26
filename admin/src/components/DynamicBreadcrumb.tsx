// src/components/DynamicBreadcrumb.tsx
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Link, useMatches } from '@tanstack/react-router';

// ------------------------------------------------------------------
// 1. Prettify a URL segment when we have no title
// ------------------------------------------------------------------
const fallbackLabel = (segment: string): string => {
  if (!segment) return '';
  if (/^\d+$/.test(segment)) return segment; // keep numbers
  return segment
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
};

// ------------------------------------------------------------------
// 2. Helper – is this segment a dynamic param that looks like an ID?
// ------------------------------------------------------------------
const isDynamicIdSegment = (segment: string): boolean => {
  // Mongo ObjectId, UUID, or any long hex string
  return /^[a-f0-9]{20,}$/i.test(segment) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
};

export function DynamicBreadcrumb() {
  const matches = useMatches();

  // Current full pathname (e.g. /products/6904…/variants/)
  const currentPathname = matches[matches.length - 1]?.pathname || '/';
  const pathSegments = currentPathname.split('/').filter(Boolean);

  // ------------------------------------------------------------------
  // 3. Build a map: pathname → staticData.title
  // ------------------------------------------------------------------
  const titleMap = new Map<string, string>();
  matches.forEach((m) => {
    const title = (m as any).staticData?.title;
    if (title) {
      titleMap.set(m.pathname, title);
      titleMap.set(m.pathname + '/', title); // also match trailing slash
    }
  });

  // ------------------------------------------------------------------
  // 4. Resolve label for a segment
  // ------------------------------------------------------------------
  const getLabelForSegment = (segment: string, index: number): string => {
    const pathSoFar = '/' + pathSegments.slice(0, index + 1).join('/');

    // 1. Exact match on this route (static title)
    if (titleMap.has(pathSoFar) || titleMap.has(pathSoFar + '/')) {
      return (
        titleMap.get(pathSoFar) ||
        titleMap.get(pathSoFar + '/') ||
        fallbackLabel(segment)
      );
    }

    // 2. Dynamic $id segment – use the *parent* route title
    if (isDynamicIdSegment(segment)) {
      const parentPath = '/' + pathSegments.slice(0, index).join('/');
      const parentTitle =
        titleMap.get(parentPath) || titleMap.get(parentPath + '/');
      return parentTitle ?? fallbackLabel(segment);
    }

    // 3. Anything else – prettify the raw segment
    return fallbackLabel(segment);
  };

  // ------------------------------------------------------------------
  // 5. Build breadcrumb items
  // ------------------------------------------------------------------
  const items = pathSegments.flatMap((segment, idx) => {
    const path = '/' + pathSegments.slice(0, idx + 1).join('/');
    const isLast = idx === pathSegments.length - 1;
    const label = getLabelForSegment(segment, idx);

    return [
      idx > 0 && <BreadcrumbSeparator key={`sep-${path}`} />,
      <BreadcrumbItem key={path}>
        {isLast ? (
          <BreadcrumbPage>{label}</BreadcrumbPage>
        ) : (
          <BreadcrumbLink className='text-foreground' asChild>
            <Link to={path}>{label}</Link>
          </BreadcrumbLink>
        )}
      </BreadcrumbItem>,
    ].filter(Boolean);
  });

  if (pathSegments.length <= 1) return null;

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex items-center gap-1">
        {items}
      </BreadcrumbList>
    </Breadcrumb>
  );
}