'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

interface LotteryHistoryEntry {
  executedAt: string;
  allocations: Record<string, Record<string, string>>; // day -> { room: club }
}

export default function LotteryResultsPage() {
  const [history, setHistory] = useState<LotteryHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/lottery');
        const data = await res.json();
        setHistory(data.history ?? []);
      } catch (e) {
        console.error(e);
        setError('データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const recent = history.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">読み込み中...</div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-fuchsia-100 dark:from-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">直近の抽選結果</h1>
          <Button asChild className="bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600">
            <Link href="/">ホームに戻る</Link>
          </Button>
        </div>

        {recent.length === 0 && (
          <p className="text-muted-foreground">まだ抽選結果がありません。</p>
        )}

        <Accordion type="single" collapsible className="space-y-4">
          {recent.map((entry) => {
          const byDay = entry.allocations;
            const id = entry.executedAt;
          return (
              <AccordionItem value={id} key={id}>
                <AccordionTrigger>
                  {new Date(entry.executedAt).toLocaleString('ja-JP')}
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="mt-2 bg-card dark:bg-card">
                    <CardContent className="space-y-6 py-4">
                {Object.entries(byDay).map(([day, rooms]) => {
                  if (typeof rooms !== 'object' || rooms === null) return null;
                  const entries = Object.entries(rooms as Record<string, string>);
                  return (
                          <div key={day} className="border border-muted rounded-lg overflow-hidden">
                      <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 px-4 py-2 text-sm font-semibold">
                        {day}
                      </div>
                            <div className="grid grid-cols-2 bg-muted dark:bg-slate-700/50 text-muted-foreground text-xs font-semibold uppercase">
                        <div className="px-4 py-2">教室</div>
                        <div className="px-4 py-2">部活</div>
                      </div>
                      {entries.map(([room, club], idx) => (
                        <div
                                key={room}
                          className={`grid grid-cols-2 px-4 py-2 ${idx % 2 === 0 ? 'bg-background dark:bg-slate-800/30' : 'bg-muted dark:bg-slate-700/30'}`}
                        >
                          <div className="font-medium text-foreground">{room}</div>
                          <div className="text-foreground">{club}</div>
                        </div>
                      ))}
                    </div>
                  );
                })}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
          );
        })}
        </Accordion>
      </div>
    </div>
  );
} 