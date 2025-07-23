'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogAction, AlertDialogCancel, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/alert-dialog';

interface Club {
  name: string;
  password: string;
}

export default function ClubManagementPage() {
  // 認証
  const [password, setPassword] = useState(''); // 予備（未使用）
  const [isLoggedIn, setIsLoggedIn] = useState(true); // 常にログイン済み扱い

  const handleLogin = () => {
    if (password === 'admin') setIsLoggedIn(true);
    else alert('パスワードが間違っています');
  };

  // クラブ一覧
  const [clubs, setClubs] = useState<Club[]>([]);
  const [newName, setNewName] = useState('');
  const [newPass, setNewPass] = useState('');
  const [statusMsg, setStatusMsg] = useState('');

  const fetchClubs = async () => {
    try {
      const res = await fetch('/api/clubs');
      const data = await res.json();
      setClubs(data);
    } catch (e) {
      console.error(e);
      setStatusMsg('クラブ取得失敗');
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchClubs();
  }, [isLoggedIn]);

  const addClub = async () => {
    if (!newName || !newPass) {
      alert('団体名とパスワードを入力してください');
      return;
    }
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, password: newPass }),
      });
      if (res.ok) {
        setNewName('');
        setNewPass('');
        fetchClubs();
      } else {
        alert('追加に失敗しました');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const updatePassword = async (name: string, password: string) => {
    if (!password) {
      alert('パスワードを入力してください');
      return;
    }
    try {
      const res = await fetch('/api/clubs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, password }),
      });
      if (res.ok) fetchClubs();
      else alert('更新失敗');
    } catch (e) {
      console.error(e);
    }
  };

  const deleteClub = async (name: string) => {
    try {
      const res = await fetch('/api/clubs', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      if (res.ok) fetchClubs();
      else setStatusMsg('削除に失敗しました');
    } catch (e) {
      console.error(e);
      setStatusMsg('削除に失敗しました');
    }
  };

  // ログイン不要のため、ログインフォームは表示しない

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 p-6 text-foreground">
      <div className="container mx-auto max-w-3xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold">団体管理</h2>
          <Button asChild className="bg-slate-600 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600">
            <Link href="/admin">戻る</Link>
          </Button>
        </div>

        {/* 追加フォーム */}
        <div className="bg-card p-4 rounded shadow mb-6">
          <h3 className="text-lg font-medium mb-4">団体を追加</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <Input placeholder="団体名" value={newName} onChange={(e) => setNewName(e.target.value)} />
            <Input placeholder="パスワード" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
            <Button className="bg-green-600 hover:bg-green-700" onClick={addClub}>追加</Button>
          </div>
        </div>

        {/* 一覧 */}
        <div className="bg-card p-4 rounded shadow">
          <h3 className="text-lg font-medium mb-4">団体一覧</h3>
          {statusMsg && (
            <Alert variant="destructive" className="mb-2">
              <AlertTitle>エラー</AlertTitle>
              <AlertDescription>{statusMsg}</AlertDescription>
            </Alert>
          )}
          <Table className="text-sm">
            <TableHeader>
              <TableRow>
                <TableHead className="text-foreground">団体名</TableHead>
                <TableHead className="text-foreground">パスワード</TableHead>
                <TableHead className="text-foreground">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clubs.map((club) => (
                <TableRow key={club.name}>
                  <TableCell className="text-foreground">{club.name}</TableCell>
                  <TableCell>
                    <Input
                      defaultValue={club.password}
                      onBlur={(e) => {
                        const val = e.target.value;
                        if (val !== club.password) updatePassword(club.name, val);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700">
                          削除
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>本当に削除しますか？</AlertDialogTitle>
                          <AlertDialogDescription>
                            {club.name} と関連予約データが完全に削除されます。
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>キャンセル</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteClub(club.name)}>
                            削除する
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 