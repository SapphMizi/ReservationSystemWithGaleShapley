'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, ShieldCheck, ListChecks } from 'lucide-react';

/* 教室データの型定義 */
interface Classroom {
  name: string;
  capacity: number;
  status: string;
  available_per_day: Record<string, string>;
}

/* 部活データの型定義 */
interface Club {
  name: string;
  password: string;
}

/* ホームページのコンポーネント */
export default function Home() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [notice, setNotice] = useState<string>('例：C棟全体は6/22（土）音出し禁止です。');

  // 初期ロード時に adminNote を取得
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adminNote');
      if (saved) {
        setNotice(saved);
      }
    } catch (e) {
      console.error('adminNote の読み込みに失敗しました', e);
    }
  }, []);

  useEffect(() => {
    // 実際のAPIからデータを取得する処理
    fetchClassrooms();
    fetchClubs();
  }, []);

  // 教室データを取得する関数
  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/classrooms');
      const data = await response.json();
      setClassrooms(data);
    } catch (error) {
      console.error('教室データの取得に失敗しました:', error);
    }
  };

  // 部活データを取得する関数
  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      const data = await response.json();
      setClubs(data);
    } catch (error) {
      console.error('部活データの取得に失敗しました:', error);
    }
  };

  // ホームページのレンダリング
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Hero */}
        <div className="text-center mb-10 pt-6">
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4">
            教室予約システム
          </h1>
        </div>

        {/* 注意事項 */}
        <div className="bg-muted border-l-4 border-blue-400 dark:border-slate-600 p-4 mb-8 max-w-3xl mx-auto">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-foreground">
                教務からの注意事項
              </h3>
              <div className="mt-2 text-sm text-muted-foreground">
                <p className="w-full whitespace-pre-line text-muted-foreground">
                  {notice}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/student" className="group">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-green-100 group-hover:bg-green-200 transition-colors duration-200">
                  <User className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-green-600">学生ログイン</CardTitle>
                  <CardDescription>部活動の教室予約を申請</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/admin" className="group">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-blue-100 group-hover:bg-blue-200 transition-colors duration-200">
                  <ShieldCheck className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-blue-600">教務ログイン</CardTitle>
                  <CardDescription>教室管理と予約承認</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/lottery-results" target="_blank" rel="noopener noreferrer" className="group md:col-span-2">
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center gap-4">
                <div className="p-3 rounded-full bg-purple-100 group-hover:bg-purple-200 transition-colors duration-200">
                  <ListChecks className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg group-hover:text-purple-600">抽選結果一覧</CardTitle>
                  <CardDescription>直近2期間の抽選結果を確認</CardDescription>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
