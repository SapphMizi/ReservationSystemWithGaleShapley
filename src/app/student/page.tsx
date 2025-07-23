// cd pbl_sample/webapp/frontend
'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { 
  getCurrentReservationPeriod, 
  generateWeekDates,
  generateWeekDatesWithDayOfWeek,
  generateWeekDateInfo,
  debugPeriodInfo,
  ReservationPeriod,
  DateInfo
} from '../../utils/dateManager';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface Classroom {
  name: string;
  capacity: number;
  status: string;
  available_per_day: Record<string, string>;
}

interface Club {
  name: string;
  password: string;
}

interface ReservationSlot {
  preferences: string[]; // 第1〜3希望の教室名
}

interface DateReservation {
  date: string;
  slotCount: number; // この日の予約スロット数（1-3）
  slots: ReservationSlot[]; // 各スロットの希望教室
}

interface ReservationRequest {
  user: string;
  selections: Array<{
    day: string;
    reservations: Array<{
      preferences: string[]; // 第1〜3希望
    }>;
  }>;
  timestamp: string;
}

// 最大希望数
const MAX_PREFS = 3;

export default function StudentPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [selectedClub, setSelectedClub] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [notice, setNotice] = useState<string>('例：C棟全体は6/22（土）音出し禁止です。');
  // 新しい予約システムの状態管理
  const [dateReservations, setDateReservations] = useState<Record<string, DateReservation>>({});
  const [allocationResults, setAllocationResults] = useState<Record<string, string>>({});
  const [outputData, setOutputData] = useState<string>('');
  
  // 管理画面で設定された教室の利用可否状態
  const [roomStatus, setRoomStatus] = useState<Record<string, string>>({});

  // 新しい日付管理システム
  const [reservationPeriod, setReservationPeriod] = useState<ReservationPeriod | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<'first' | 'second'>('first');
  const [dateInfos, setDateInfos] = useState<DateInfo[]>([]);

  // クライアントサイドでの初期化完了を示すフラグ
  const [isClientInitialized, setIsClientInitialized] = useState(false);

  // 教室データを取得する関数
  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/classrooms');
      const data = await response.json();
      setClassrooms(data);
      
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
        const savedRoomStatus = localStorage.getItem('roomStatus');
        if (savedRoomStatus) {
          setRoomStatus(JSON.parse(savedRoomStatus));
        }
      } catch (e) {
        console.error('ローカルストレージからの読み込みも失敗しました', e);
      }
    }
  };

  // クライアントサイドでの初期化
  useEffect(() => {
    // クライアントサイドでのみ実行される処理
    setIsClientInitialized(true);
    
    fetchClassrooms();
    fetchClubs();
    
    // adminNote を読み込み
    try {
      const saved = localStorage.getItem('adminNote');
      if (saved) {
        setNotice(saved);
      }
    } catch (e) {
      console.error('adminNote の読み込みに失敗しました', e);
    }
    
    // 新しい日付管理システムの初期化
    const period = getCurrentReservationPeriod();
    setReservationPeriod(period);
    
    // デバッグ情報をコンソールに出力
    console.log('予約期間情報:', debugPeriodInfo(period));
    
    // 初期表示は前半週
    const initialDateInfos = generateWeekDateInfo(period.firstWeek);
    setDateInfos(initialDateInfos);
    
    // サンプルの抽選結果データ（新しいキー形式に更新）
    setAllocationResults({
      "C101_7/14": "当選",
      "C101_7/15": "落選",
      "C106_7/18": "当選",
      "C203_7/20": "落選"
    });

    // ポーリング機能：30秒ごとに教室データを更新
    const pollInterval = setInterval(() => {
      fetchClassrooms();
    }, 30000);

    return () => clearInterval(pollInterval);
  }, []);

  // 週選択が変更されたときの処理
  useEffect(() => {
    if (reservationPeriod && isClientInitialized) {
      const weekPeriod = selectedWeek === 'first' ? reservationPeriod.firstWeek : reservationPeriod.secondWeek;
      const newDateInfos = generateWeekDateInfo(weekPeriod);
      setDateInfos(newDateInfos);
      
      // 新しい日付に対応する予約データを初期化
      // 既存の予約データを保持しつつ、新しい日付だけ初期化
      setDateReservations(prev => {
        const updated: Record<string, DateReservation> = { ...prev };
        newDateInfos.forEach(dateInfo => {
          if (!updated[dateInfo.date]) {
            updated[dateInfo.date] = {
              date: dateInfo.date,
              slotCount: 1,
              slots: [{ preferences: Array(MAX_PREFS).fill('') }]
            };
          }
        });
        return updated;
      });
    }
  }, [selectedWeek, reservationPeriod, isClientInitialized]);

  const fetchClubs = async () => {
    try {
      const response = await fetch('/api/clubs');
      const data = await response.json();
      setClubs(data);
    } catch (error) {
      console.error('部活データの取得に失敗しました:', error);
      // サンプルデータ
      setClubs([
        { name: "野球部", password: "baseball" },
        { name: "サッカー部", password: "soccer" },
        { name: "軽音学部", password: "lightmusic" }
      ]);
    }
  };

  const handleLogin = () => {
    const club = clubs.find(c => c.name === selectedClub);
    if (club && club.password === password) {
      setIsLoggedIn(true);
    } else {
      alert('部活名またはパスワードが間違っています。');
    }
  };

  // 日付の予約スロット数を変更する関数
  const updateSlotCount = (date: string, count: number) => {
    setDateReservations(prev => {
      const existing = prev[date] || {
        date,
        slotCount: 1,
        slots: [{ preferences: Array(MAX_PREFS).fill('') }]
      };
      
      const newSlots = Array.from({ length: count }, (_, index) => {
        const base = existing.slots[index] || { preferences: [] };
        const prefs = Array.from({ length: MAX_PREFS }, (_, i) => base.preferences[i] || '');
        return { preferences: prefs };
      });
      
      return {
        ...prev,
        [date]: {
          ...existing,
          slotCount: count,
          slots: newSlots
        }
      };
    });
  };

  // 特定の予約スロットの希望順位を更新する関数
  const updatePreference = (date: string, slotIndex: number, preferenceIndex: number, classroom: string) => {
    setDateReservations(prev => {
      const existing = prev[date];
      if (!existing) return prev;
      
      const newSlots = [...existing.slots];
      const newPreferences = [...newSlots[slotIndex].preferences];
      // 必ず MAX_PREFS 個に揃える
      if (newPreferences.length < MAX_PREFS) {
        newPreferences.push(...Array(MAX_PREFS - newPreferences.length).fill(''));
      }
      newPreferences[preferenceIndex] = classroom;
      newSlots[slotIndex] = { preferences: newPreferences };
      
      return {
        ...prev,
        [date]: {
          ...existing,
          slots: newSlots
        }
      };
    });
  };

  // 特定の日付での教室の利用可否を取得する関数
  const getClassroomAvailability = (classroomName: string, date: string) => {
    const key = `${classroomName}_${date}`;
    return roomStatus[key] || '使用可';
  };

  // 指定日付で既に選択されている教室を取得
  const getSelectedClassroomsForDate = (date: string): Set<string> => {
    const set = new Set<string>();
    const dateRes = dateReservations[date];
    if (!dateRes) return set;
    dateRes.slots.forEach(slot => {
      slot.preferences.forEach(pref => {
        if (pref) set.add(pref);
      });
    });
    return set;
  };

  // 特定の日付で利用可能な教室の選択肢を生成する関数
  const getAvailableClassroomOptions = (
    date: string,
    currentValue: string
  ): Array<{ value: string; label: string; classroom: Classroom }> => {
    const selectedSet = getSelectedClassroomsForDate(date);

    return classrooms
      .map((classroom) => {
        const availability = getClassroomAvailability(classroom.name, date);
        
        // 利用不可の場合は除外
        if (availability === '使用不可') {
          return null;
        }
        
        // 既に他で選択されている場合は除外（ただし現在値は残す）
        if (selectedSet.has(classroom.name) && classroom.name !== currentValue) {
          return null;
        }

        // 音出し禁止等のラベル
        let displayName = `${classroom.name} (${classroom.capacity}人・${classroom.status})`;
        if (availability === '音出し不可') {
          displayName += ' ※音出し禁止';
        } else if (availability === '抽選中') {
          displayName += ' ※抽選中';
        } else if (availability === '予約済') {
          displayName += ' ※予約済';
        }
        
        return {
          value: classroom.name,
          label: displayName,
          classroom: classroom,
        };
      })
      .filter(
        (
          option
        ): option is { value: string; label: string; classroom: Classroom } => option !== null
      );
  };

  const submitSelection = async () => {
    // 新しいデータ構造から申請データを生成
    const selections = Object.values(dateReservations)
      .filter(dateRes => dateRes.slots.some(slot => slot.preferences.some(pref => pref !== '')))
      .map(dateRes => ({
        day: dateRes.date,
        reservations: dateRes.slots
          .filter(slot => slot.preferences.some(pref => pref !== ''))
          .map(slot => ({
            preferences: slot.preferences.filter(pref => pref !== '')
          }))
      }));

    const requestData: ReservationRequest = {
      user: selectedClub,
      selections,
      timestamp: new Date().toISOString()
    };

    setOutputData(JSON.stringify(requestData, null, 2));
    console.log("🔽 抽選申請データ:", requestData);

    // APIに予約申請を送信
    try {
      const response = await fetch('/api/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        const result = await response.json();
        alert('予約申請を受け付けました！');
        console.log('予約申請結果:', result);

        // ローカルストレージに保存
        if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`studentReservations_${selectedClub}`, JSON.stringify(dateReservations));
        } catch (e) {
          console.error('ローカルストレージへの保存に失敗しました', e);
          }
        }
      } else {
        alert('予約申請の送信に失敗しました。');
      }
    } catch (error) {
      console.error('予約申請エラー:', error);
      alert('予約申請の送信に失敗しました。');
    }
  };

  // ログイン後に保存済みの予約データを読み込む
  useEffect(() => {
    if (isLoggedIn && isClientInitialized) {
      try {
        const saved = localStorage.getItem(`studentReservations_${selectedClub}`);
        if (saved) {
          const parsed: Record<string, DateReservation> = JSON.parse(saved);
          // 現行の dateReservations とマージ（現在期間の日付についてのみ更新）
          setDateReservations(prev => ({ ...prev, ...parsed }));
        }
      } catch (e) {
        console.error('ローカルストレージからの読み込みに失敗しました', e);
      }
    }
  }, [isLoggedIn, selectedClub, isClientInitialized]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center">
        <div className="bg-card rounded-lg shadow-lg p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">学生ログイン</h1>
            <p className="text-gray-600">部活動の教室予約を申請</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                部活動を選択
              </label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="部活動を選択してください" />
                </SelectTrigger>
                <SelectContent>
                  {clubs.map((club) => (
                    <SelectItem key={club.name} value={club.name}>
                    {club.name}
                    </SelectItem>
                ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                パスワード
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleLogin();
                }}
                placeholder="パスワードを入力"
              />
            </div>

            <Button className="w-full bg-green-600 hover:bg-green-700" onClick={handleLogin}>
              ログイン
            </Button>

            <Link href="/" className="block text-center text-green-600 hover:text-green-700">
              ホームに戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 dark:from-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">教室予約申請フォーム</h1>
            <p className="text-muted-foreground mt-2">ログイン中: {selectedClub}</p>
          </div>
          <div className="flex space-x-3">
            <Link href="/lottery-results" target="_blank" rel="noopener noreferrer" className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors duration-200">
              抽選結果
            </Link>
          <Link href="/" className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors duration-200">
            ホームに戻る
          </Link>
          </div>
        </div>

        {/* 注意事項 */}
        <div className="bg-muted dark:bg-slate-700/60 border-l-4 border-blue-400 dark:border-slate-600 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-foreground">教務からの注意事項</h3>
              <div className="mt-2 text-sm text-muted-foreground">
                <p className="w-full whitespace-pre-line text-muted-foreground">
                  {notice}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-muted dark:bg-slate-700/60 p-4 mb-6 rounded-lg">
          <div className="text-foreground font-medium space-y-2">
            <p>📢 予約システムの使い方：</p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>各日付で最大3つの教室予約が可能です</li>
              <li>各予約について第3希望まで選択できます</li>
              <li>予約数を選択後、各予約の希望順位をプルダウンで設定してください</li>
              <li>設定完了後、画面下の「申込を完了」をクリックしてください</li>
            </ul>
          </div>
        </div>

        {/* 週選択 */}
        {reservationPeriod && isClientInitialized && (
          <div className="bg-card rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-medium text-foreground mb-4">📅 予約期間選択</h3>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                予約可能期間: {reservationPeriod && (
                  <>
                    {reservationPeriod.reservationStartDate.getMonth() + 1}/{reservationPeriod.reservationStartDate.getDate()} 
                    〜 
                    {reservationPeriod.reservationEndDate.getMonth() + 1}/{reservationPeriod.reservationEndDate.getDate()}
                  </>
                )}
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setSelectedWeek('first')}
                  className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                    selectedWeek === 'first'
                      ? 'bg-green-600 text-white'
                      : 'bg-muted dark:bg-slate-700 text-foreground hover:bg-muted dark:hover:bg-slate-600'
                  }`}
                >
                  前半週 ({reservationPeriod.firstWeek.startDate.getMonth() + 1}/{reservationPeriod.firstWeek.startDate.getDate()} 〜 {reservationPeriod.firstWeek.endDate.getMonth() + 1}/{reservationPeriod.firstWeek.endDate.getDate()})
                </button>
                <button
                  onClick={() => setSelectedWeek('second')}
                  className={`px-4 py-2 rounded-md transition-colors duration-200 ${
                    selectedWeek === 'second'
                      ? 'bg-green-600 text-white'
                      : 'bg-muted dark:bg-slate-700 text-foreground hover:bg-muted dark:hover:bg-slate-600'
                  }`}
                >
                  後半週 ({reservationPeriod.secondWeek.startDate.getMonth() + 1}/{reservationPeriod.secondWeek.startDate.getDate()} 〜 {reservationPeriod.secondWeek.endDate.getMonth() + 1}/{reservationPeriod.secondWeek.endDate.getDate()})
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 新しい予約システム：日付別希望入力 */}
        {!isClientInitialized ? (
          <div className="bg-card rounded-lg shadow-md p-6 mb-6">
            <div className="animate-pulse">
              <div className="h-6 bg-muted rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          </div>
        ) : (
        <Accordion type="multiple" className="space-y-4 mb-6">
          {dateInfos.map((dateInfo) => {
            const dateReservation = dateReservations[dateInfo.date];
            if (!dateReservation) return null;

            const isDone = dateReservation.slots.some((slot) =>
              slot.preferences.some((pref) => pref !== '')
            );

            return (
              <AccordionItem value={dateInfo.date} key={dateInfo.date}>
                <AccordionTrigger
                  className="text-lg bg-card shadow-md rounded-md px-4 py-3 mb-2 flex items-center justify-between hover:bg-muted [&[data-state=open]]:rounded-b-none"
                >
                  <span>
                    {dateInfo.displayDate} の予約
                        {isDone && (
                          <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            済
                          </span>
                        )}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <Card className="p-4 border-t-0 rounded-t-none shadow-md">
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-end mb-2">
                        <label className="text-sm font-medium mr-2">予約数:</label>
                    <select
                      value={dateReservation.slotCount}
                      onChange={(e) => updateSlotCount(dateInfo.date, parseInt(e.target.value))}
                          className="px-3 py-1 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground dark:bg-card dark:text-card-foreground"
                    >
                      <option value={1}>1つ</option>
                      <option value={2}>2つ</option>
                      <option value={3}>3つ</option>
                    </select>
                  </div>
                  {dateReservation.slots.map((slot, slotIndex) => (
                        <div key={slotIndex} className="border border-muted rounded-lg p-4 bg-background dark:bg-slate-700/40">
                          <h4 className="text-md font-medium mb-3">予約 {slotIndex + 1}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {Array.from({ length: MAX_PREFS }, (_, prefIndex) => {
                              const preference = slot.preferences[prefIndex] || '';
                              return (
                          <div key={prefIndex}>
                                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                              第{prefIndex + 1}希望
                            </label>
                                                         <select
                               value={preference}
                               onChange={(e) => updatePreference(dateInfo.date, slotIndex, prefIndex, e.target.value)}
                                    className="w-full px-3 py-2 border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-background text-foreground dark:bg-card dark:text-card-foreground"
                             >
                               <option value="">選択してください</option>
                                    {getAvailableClassroomOptions(dateInfo.date, preference).map((option) => (
                                 <option key={option.value} value={option.value}>
                                   {option.label}
                                 </option>
                               ))}
                             </select>
                          </div>
                              );
                            })}
                      </div>
                    </div>
                  ))}
                    </CardContent>
                  </Card>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
        )}

        <button
          onClick={submitSelection}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors duration-200 text-lg font-medium"
        >
          申込を完了
        </button>

        {/* 提出データ */}
        {outputData && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📦 提出データ（ペアに共有）</h2>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
              {outputData}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
