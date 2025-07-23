'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import {
  getCurrentReservationPeriod,
  generateWeekDates,
  generateWeekDatesWithDayOfWeek,
  generateWeekDateInfo,
  debugPeriodInfo,
  ReservationPeriod,
  DateInfo,
  getToday,
} from '../../utils/dateManager';

interface Room {
  name: string;
  capacity: number;
  seatType: string;
}

const rooms: Room[] = [
  { name: 'C101', capacity: 105, seatType: '固定' },
  { name: 'C104', capacity: 52, seatType: 'セパ' },
  { name: 'C105', capacity: 68, seatType: 'セパ' },
  { name: 'C106', capacity: 102, seatType: 'セパ' },
  { name: 'C202', capacity: 156, seatType: '固定' },
  { name: 'C203', capacity: 73, seatType: '固定' },
  { name: 'C204', capacity: 44, seatType: 'セパ' },
  { name: 'C205', capacity: 60, seatType: '固定' },
  { name: 'C206', capacity: 106, seatType: '固定' },
  { name: 'C301', capacity: 105, seatType: '固定' },
  { name: 'C302', capacity: 156, seatType: '固定' },
  { name: 'C303', capacity: 72, seatType: '固定' },
  { name: 'C304', capacity: 51, seatType: 'セパ' },
  { name: 'C305', capacity: 54, seatType: '固定' },
  { name: 'C306', capacity: 106, seatType: '固定' },
  { name: 'C307', capacity: 72, seatType: '固定' },
  { name: 'C308', capacity: 72, seatType: '固定' },
  { name: 'C401', capacity: 105, seatType: '固定' },
  { name: 'C402', capacity: 156, seatType: '固定' },
  { name: 'C403', capacity: 72, seatType: '固定' },
  { name: 'C404', capacity: 53, seatType: 'セパ' },
  { name: 'C405', capacity: 54, seatType: '固定' },
  { name: 'C406', capacity: 106, seatType: '固定' },
  { name: 'C407', capacity: 36, seatType: 'セパ' },
  { name: 'C408', capacity: 36, seatType: 'セパ' },
  { name: 'C409', capacity: 36, seatType: 'セパ' },
  { name: '講義室', capacity: 309, seatType: '固定' },
];

const statusOptions = ['使用可', '使用不可', '音出し不可', '抽選中', '予約済'];

export default function AdminPage() {
  const [adminNote, setAdminNote] = useState<string>(
    '例：C棟全体は6/22（土）音出し禁止です。',
  );
  const [roomStatus, setRoomStatus] = useState<Record<string, string>>({});
  const [saveStatus, setSaveStatus] = useState<string>('');

  // 抽選実行状態
  const [lotteryStatus, setLotteryStatus] = useState<string>('');
  
  // ヘルスチェック状態
  const [healthStatus, setHealthStatus] = useState<string>('');

  // 日付管理
  const [reservationPeriod, setReservationPeriod] =
    useState<ReservationPeriod | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<'first' | 'second'>('first');
  const [dateInfos, setDateInfos] = useState<DateInfo[]>([]);

  // 開発用日付オーバーライド
  const [overrideDate, setOverrideDate] = useState<string>(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('overrideToday') || '';
    return '';
  });

  const applyOverrideDate = () => {
    localStorage.setItem('overrideToday', overrideDate);
    // リロードして期間再計算
    window.location.reload();
  };

  // ログイン状態
  const [password, setPassword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);

  const handleLogin = () => {
    if (password === 'admin') {
      setIsLoggedIn(true);
    } else {
      alert('パスワードが間違っています。');
    }
  };

  // 教室データを取得する関数
  const fetchClassroomsData = async () => {
    try {
      const response = await fetch('/api/classrooms');
      const data = await response.json();
      
      // 教室データから利用可否ステータスを抽出
      const statusData: Record<string, string> = {};
      data.forEach((room: any) => {
        if (room.availablePerDay) {
          Object.entries(room.availablePerDay).forEach(([date, status]) => {
            const key = `${room.name}_${date}`;
            statusData[key] = status as string;
          });
        }
      });
      setRoomStatus(statusData);
    } catch (error) {
      console.error('教室データの取得に失敗しました:', error);
      // フォールバック: ローカルストレージから読み込み
      try {
        const savedStatus = localStorage.getItem('roomStatus');
        if (savedStatus) {
          setRoomStatus(JSON.parse(savedStatus));
        }
      } catch (e) {
        console.error('ローカルストレージからの読み込みも失敗しました', e);
      }
    }
  };

  useEffect(() => {
    const savedNote = localStorage.getItem('adminNote');
    if (savedNote) setAdminNote(savedNote);

    // データベースから教室の利用可否データを取得
    fetchClassroomsData();

    const period = getCurrentReservationPeriod();
    setReservationPeriod(period);
    console.log('予約期間情報:', debugPeriodInfo(period));
    setDateInfos(generateWeekDateInfo(period.firstWeek));
  }, []);

  useEffect(() => {
    if (reservationPeriod) {
      const weekPeriod =
        selectedWeek === 'first'
          ? reservationPeriod.firstWeek
          : reservationPeriod.secondWeek;
      setDateInfos(generateWeekDateInfo(weekPeriod));
    }
  }, [selectedWeek, reservationPeriod]);

  // ログインしていない場合はログインフォームを表示
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">教務ログイン</h1>
            <p className="text-gray-600">教室管理と予約承認</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">パスワード</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                placeholder="パスワードを入力"
              />
            </div>

            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleLogin}>
              ログイン
            </Button>

            <Link href="/" className="block text-center text-blue-600 hover:text-blue-700">
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleStatusChange = (room: string, day: number, status: string) => {
    const actualDate = dateInfos[day]?.date;
    if (!actualDate) return;
    const key = `${room}_${actualDate}`;
    setRoomStatus((prev) => ({ ...prev, [key]: status }));
    
    // リアルタイムでデータベースに保存
    updateClassroomStatusInDB(room, actualDate, status);
  };

  // データベースに教室の利用可否を保存する関数
  const updateClassroomStatusInDB = async (classroomName: string, date: string, status: string) => {
    try {
      console.log(`🔄 Updating ${classroomName} on ${date} to ${status}`);
      
      const response = await fetch('/api/classrooms/status', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          classroom_name: classroomName,
          date,
          status,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error('API Error:', data);
        
        // エラーメッセージをユーザーに表示
        const errorMsg = data.error || `教室利用可否の更新に失敗しました (${response.status})`;
        setSaveStatus(`❌ ${errorMsg}`);
        
        // デバッグ情報があれば表示
        if (data.debug) {
          console.error('Debug info:', data.debug);
        }
        
        setTimeout(() => setSaveStatus(''), 5000);
        return false;
      }
      
      console.log('✅ Update successful:', data);
      return true;
      
    } catch (error) {
      console.error('Network error:', error);
      setSaveStatus('❌ ネットワークエラーが発生しました。接続を確認してください。');
      setTimeout(() => setSaveStatus(''), 5000);
      return false;
    }
  };

  const saveSettings = async () => {
    setSaveStatus('保存中...');
    
    // adminNoteは引き続きローカルストレージに保存
    localStorage.setItem('adminNote', adminNote);
    
    // 全ての教室利用可否データをデータベースに一括保存
    const updates = Object.entries(roomStatus).map(([key, status]) => {
      const [roomName, date] = key.split('_');
      return { classroom_name: roomName, date, status };
    });

    if (updates.length === 0) {
      setSaveStatus('⚠️ 更新するデータがありません');
      setTimeout(() => setSaveStatus(''), 3000);
      return;
    }

    console.log(`🔄 Bulk saving ${updates.length} updates`);

    try {
      const response = await fetch('/api/classrooms/status/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      const data = await response.json();
      
      if (response.ok) {
        console.log('✅ Bulk save successful:', data);
        
        if (data.summary) {
          const { success, failure, total } = data.summary;
          if (failure > 0) {
            setSaveStatus(`⚠️ 部分的に保存完了: 成功${success}件、失敗${failure}件`);
          } else {
            setSaveStatus(`✅ 全${total}件を正常に保存しました`);
          }
        } else {
          setSaveStatus('✅ 保存しました（学生画面に反映されます）');
        }
      } else {
        console.error('API Error:', data);
        
        const errorMsg = data.error || `一括保存に失敗しました (${response.status})`;
        setSaveStatus(`❌ ${errorMsg}`);
        
        // デバッグ情報があれば表示
        if (data.debug) {
          console.error('Debug info:', data.debug);
        }
      }
    } catch (error) {
      console.error('Network error:', error);
      setSaveStatus('❌ ネットワークエラーが発生しました。接続を確認してください。');
    }
    
    setTimeout(() => setSaveStatus(''), 5000);
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case '使用不可':
        return 'bg-red-100 dark:bg-red-900/30';
      case '音出し不可':
        return 'bg-yellow-100 dark:bg-yellow-900/30';
      case '抽選中':
        return 'bg-blue-100 dark:bg-blue-900/30';
      case '予約済':
        return 'bg-green-100 dark:bg-green-900/30';
      default:
        return 'bg-background';
    }
  };

  const canRunLottery = reservationPeriod && getToday() >= (reservationPeriod.announcementDate!);

  async function runLottery() {
    setLotteryStatus('抽選実行中...');
    try {
      const res = await fetch('/api/lottery', { method: 'POST' });
      if (res.ok) {
        setLotteryStatus('✅ 抽選完了');
      } else {
        setLotteryStatus('❌ 抽選失敗');
      }
    } catch (e) {
      console.error(e);
      setLotteryStatus('❌ 抽選失敗');
    }
    setTimeout(() => setLotteryStatus(''), 4000);
  }

  // データベース接続状況を確認する関数
  async function checkHealth() {
    setHealthStatus('接続確認中...');
    try {
      console.log('🏥 Running health check');
      const res = await fetch('/api/health');
      const data = await res.json();
      
      console.log('Health check result:', data);
      
      if (res.ok && data.status === 'healthy') {
        const { database } = data;
        setHealthStatus(`✅ 接続正常 (${database.provider}, ${database.responseTime}ms, 教室${database.classroomCount}件)`);
      } else {
        setHealthStatus(`❌ 接続エラー: ${data.diagnosis || data.error || '不明なエラー'}`);
      }
    } catch (e) {
      console.error('Health check failed:', e);
      setHealthStatus('❌ ヘルスチェック失敗：ネットワークエラー');
    }
    setTimeout(() => setHealthStatus(''), 10000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">教務用：教室予約設定画面</h1>
          <div className="flex space-x-3">
            <Button asChild className="bg-purple-600 hover:bg-purple-700 text-white">
              <Link href="/lottery-results" target="_blank" rel="noopener noreferrer">
                抽選結果
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/admin/clubs">団体管理</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/">ホームに戻る</Link>
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-md p-6 mb-6">
          {/* 週選択 */}
          {reservationPeriod && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-foreground mb-4">📅 予約期間選択</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  予約可能期間:{' '}
                  {reservationPeriod && (
                    <>
                      {reservationPeriod.reservationStartDate.getMonth() + 1}/
                      {reservationPeriod.reservationStartDate.getDate()} 〜{' '}
                      {reservationPeriod.reservationEndDate.getMonth() + 1}/
                      {reservationPeriod.reservationEndDate.getDate()}
                    </>
                  )}
                </p>
                <div className="flex space-x-4">
              <button
                    onClick={() => setSelectedWeek('first')}
                    className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                      selectedWeek === 'first'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                    前半週 (
                    {reservationPeriod.firstWeek.startDate.getMonth() + 1}/
                    {reservationPeriod.firstWeek.startDate.getDate()} 〜{' '}
                    {reservationPeriod.firstWeek.endDate.getMonth() + 1}/
                    {reservationPeriod.firstWeek.endDate.getDate()})
              </button>
              <button
                    onClick={() => setSelectedWeek('second')}
                    className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                      selectedWeek === 'second'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted text-foreground hover:bg-muted/80'
                }`}
              >
                    後半週 (
                    {reservationPeriod.secondWeek.startDate.getMonth() + 1}/
                    {reservationPeriod.secondWeek.startDate.getDate()} 〜{' '}
                    {reservationPeriod.secondWeek.endDate.getMonth() + 1}/
                    {reservationPeriod.secondWeek.endDate.getDate()})
              </button>
                </div>
              </div>
            </div>
          )}

          {/* 開発用: 日付オーバーライド */}
          <div className="mb-6 p-4 border border-red-300 bg-red-50 rounded">
            <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">開発者向け: 今日の日付を上書き</h4>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={overrideDate}
                onChange={(e) => setOverrideDate(e.target.value)}
                className="border px-2 py-1 rounded text-foreground bg-background"
              />
              <button
                onClick={applyOverrideDate}
                className="bg-red-600 text-white px-3 py-1 rounded"
              >
                適用
              </button>
              <span className="text-xs text-red-600">※ ブラウザの localStorage に保存され、ページ再読み込み後に有効</span>
            </div>
          </div>

          {/* 注意文設定 */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-foreground mb-2">
              📢 学生に表示される注意文を入力：
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              className="w-full p-3 border border-input rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-background text-foreground"
              placeholder="例：C棟全体は6/22（土）音出し禁止です。"
            />
        </div>

          {/* 予約テーブル */}
              <div className="border rounded overflow-auto max-h-[60vh]">
                <Table className="w-full text-sm">
                  <TableHeader className="sticky top-0 z-10 bg-background/90 backdrop-blur dark:bg-background/80">
                    <TableRow className="bg-muted">
                      <TableHead className="px-2 py-2 text-foreground">講義室</TableHead>
                      <TableHead className="px-2 py-2 text-foreground">定員</TableHead>
                      <TableHead className="px-2 py-2 text-foreground">席</TableHead>
                      {dateInfos.map((dateInfo) => (
                        <TableHead key={dateInfo.date} className="px-2 py-2 text-foreground">
                          {dateInfo.displayDate}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rooms.map((room) => (
                      <TableRow key={room.name}>
                        <TableCell className="text-center text-foreground">{room.name}</TableCell>
                        <TableCell className="text-center text-foreground">{room.capacity}</TableCell>
                        <TableCell className="text-center text-foreground">{room.seatType}</TableCell>
                        {[0, 1, 2, 3, 4, 5, 6].map((day) => {
                          const actualDate = dateInfos[day]?.date;
                          if (!actualDate) return null;
                          const key = `${room.name}_${actualDate}`;
                          const status = roomStatus[key] || '使用可';
                          return (
                            <TableCell key={day} className={getStatusColor(status)}>
                              <Select
                                value={status}
                                onValueChange={(val) => handleStatusChange(room.name, day, val)}
                              >
                                <SelectTrigger className="w-full border-none text-xs bg-transparent px-1 py-0 text-foreground">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {statusOptions.map((option) => (
                                    <SelectItem key={option} value={option} className="text-xs text-foreground">
                                      {option}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

          {/* 保存ボタン */}
          <div className="mt-6 flex items-center space-x-4">
            <Button 
              onClick={saveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              変更を保存
            </Button>
            
            <Button 
              onClick={checkHealth}
              variant="outline"
              className="border-gray-300 hover:bg-gray-50"
            >
              接続確認
            </Button>

            {saveStatus && (
              <div className="text-sm text-green-600 dark:text-green-400">
                {saveStatus}
              </div>
            )}
            
            {healthStatus && (
              <div className={`text-sm ${healthStatus.startsWith('✅') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {healthStatus}
              </div>
            )}

            {/* 抽選ボタン */}
            {reservationPeriod && (
              <Button
                onClick={runLottery}
                disabled={!canRunLottery}
                variant={canRunLottery ? 'default' : 'secondary'}
              >
                抽選を実行
              </Button>
            )}
            {lotteryStatus && <span className="text-purple-700 text-sm">{lotteryStatus}</span>}
          </div>
          </div>
      </div>
    </div>
  );
}