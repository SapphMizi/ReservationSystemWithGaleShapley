'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/theme-toggle';
import { cn } from '@/lib/utils';

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link href="/" className="font-bold text-lg">
          教室予約システム
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/student">学生</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">教務</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/lottery-results" target="_blank">抽選結果</Link>
          </Button>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
} 