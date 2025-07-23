// 日付管理ユーティリティ

export interface WeekPeriod {
  startDate: Date;
  endDate: Date;
  label: string;
  weekType: 'first' | 'second';
}

export interface ReservationPeriod {
  baseDate: Date;
  reservationStartDate: Date;
  reservationEndDate: Date;
  /** 予約締切日 (開始日から10日目) */
  closingDate?: Date;
  /** 抽選結果発表日 (締切日の翌日) */
  announcementDate?: Date;
  firstWeek: WeekPeriod;
  secondWeek: WeekPeriod;
}

/**
 * 基準日から2週間後の予約期間を計算する
 * @param baseDate 基準日（例：2024-06-30）
 * @returns 予約期間の情報
 */
export function calculateReservationPeriod(baseDate: Date): ReservationPeriod {
  // 基準日から2週間後を計算
  const reservationStartDate = new Date(baseDate);
  reservationStartDate.setDate(baseDate.getDate() + 14);
  
  // 予約期間の終了日（開始日から2週間後）
  const reservationEndDate = new Date(reservationStartDate);
  reservationEndDate.setDate(reservationStartDate.getDate() + 13); // 14日間（0-13日）
  
  // 前半の週（1週目）
  const firstWeekStart = new Date(reservationStartDate);
  const firstWeekEnd = new Date(reservationStartDate);
  firstWeekEnd.setDate(reservationStartDate.getDate() + 6);
  
  // 後半の週（2週目）
  const secondWeekStart = new Date(reservationStartDate);
  secondWeekStart.setDate(reservationStartDate.getDate() + 7);
  const secondWeekEnd = new Date(reservationEndDate);

  // 締切日: 予約開始日 + 9日 (0-index)
  const closingDate = new Date(baseDate);
  closingDate.setDate(baseDate.getDate() + 10); // オープンから10日目に締切

  const announcementDate = new Date(baseDate);
  announcementDate.setDate(baseDate.getDate() + 11); // 翌日に抽選発表
  
  return {
    baseDate,
    reservationStartDate,
    reservationEndDate,
    closingDate,
    announcementDate,
    firstWeek: {
      startDate: firstWeekStart,
      endDate: firstWeekEnd,
      label: '前半週',
      weekType: 'first'
    },
    secondWeek: {
      startDate: secondWeekStart,
      endDate: secondWeekEnd,
      label: '後半週',
      weekType: 'second'
    }
  };
}

/**
 * 今日の日付を取得（開発用オーバーライド対応）
 * 1. ブラウザ側 localStorage の `overrideToday`
 * 2. NEXT_PUBLIC_OVERRIDE_DATE 環境変数
 * が設定されていればそれを優先して返す
 */
export function getToday(): Date {
  // ブラウザ
  if (typeof window !== 'undefined') {
    try {
      const ls = localStorage.getItem('overrideToday');
      if (ls) return new Date(ls);
    } catch {}
  }
  // 環境変数
  if (process.env.NEXT_PUBLIC_OVERRIDE_DATE) {
    return new Date(process.env.NEXT_PUBLIC_OVERRIDE_DATE);
  }
  return new Date();
}

/**
 * 現在の日付に基づいて適切な予約期間を取得する
 * @returns 現在有効な予約期間
 */
export function getCurrentReservationPeriod(): ReservationPeriod {
  const today = getToday();

  // 基準日(最初の月曜)を6月30日に設定
  const baseDate = new Date(today.getFullYear(), 5, 30);

  // 目的: "次回" の予約期間を返す (予約開始日が今日より後)
  let period = calculateReservationPeriod(baseDate);
  while (today >= period.reservationStartDate) {
    // 次の基準日 = 現在の baseDate + 14 日
    baseDate.setDate(baseDate.getDate() + 14);
    period = calculateReservationPeriod(baseDate);
  }

  return period;
}

/**
 * 日付を表示用のフォーマット（M/d）に変換する
 * @param date 日付オブジェクト
 * @returns フォーマットされた文字列
 */
export function formatDateDisplay(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

/**
 * 曜日を日本語で取得する
 * @param date 日付オブジェクト
 * @returns 曜日文字列
 */
export function getJapaneseDayOfWeek(date: Date): string {
  const days = ['日', '月', '火', '水', '木', '金', '土'];
  return days[date.getDay()];
}

/**
 * 日付を曜日付きの表示用フォーマット（M/d（曜））に変換する
 * @param date 日付オブジェクト
 * @returns フォーマットされた文字列
 */
export function formatDateDisplayWithDayOfWeek(date: Date): string {
  const dateStr = formatDateDisplay(date);
  const dayOfWeek = getJapaneseDayOfWeek(date);
  return `${dateStr}（${dayOfWeek}）`;
}

/**
 * 週の日付配列を生成する
 * @param weekPeriod 週の期間
 * @returns 日付文字列の配列（7日間）
 */
export function generateWeekDates(weekPeriod: WeekPeriod): string[] {
  const dates: string[] = [];
  const currentDate = new Date(weekPeriod.startDate);
  
  for (let i = 0; i < 7; i++) {
    dates.push(formatDateDisplay(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * 週の日付配列を曜日付きで生成する
 * @param weekPeriod 週の期間
 * @returns 日付文字列の配列（7日間、曜日付き）
 */
export function generateWeekDatesWithDayOfWeek(weekPeriod: WeekPeriod): string[] {
  const dates: string[] = [];
  const currentDate = new Date(weekPeriod.startDate);
  
  for (let i = 0; i < 7; i++) {
    dates.push(formatDateDisplayWithDayOfWeek(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * 指定された日付が予約期間内かどうかを判定する
 * @param date 判定する日付
 * @param period 予約期間
 * @returns 期間内かどうか
 */
export function isDateInReservationPeriod(date: Date, period: ReservationPeriod): boolean {
  return date >= period.reservationStartDate && date <= period.reservationEndDate;
}

/**
 * デバッグ用：期間情報を文字列で出力
 * @param period 予約期間
 * @returns デバッグ用文字列
 */
export function debugPeriodInfo(period: ReservationPeriod): string {
  return `
予約期間: ${formatDateDisplay(period.reservationStartDate)} - ${formatDateDisplay(period.reservationEndDate)}
前半週: ${formatDateDisplay(period.firstWeek.startDate)} - ${formatDateDisplay(period.firstWeek.endDate)}
後半週: ${formatDateDisplay(period.secondWeek.startDate)} - ${formatDateDisplay(period.secondWeek.endDate)}
  `.trim();
} 

/**
 * 日付と表示形式の情報を含むインターフェース
 */
export interface DateInfo {
  /** 内部処理用の日付文字列（M/d形式） */
  date: string;
  /** 表示用の日付文字列（M/d（曜）形式） */
  displayDate: string;
  /** Dateオブジェクト */
  dateObject: Date;
}

/**
 * 週の日付情報配列を生成する（内部処理用と表示用の両方）
 * @param weekPeriod 週の期間
 * @returns 日付情報の配列（7日間）
 */
export function generateWeekDateInfo(weekPeriod: WeekPeriod): DateInfo[] {
  const dateInfos: DateInfo[] = [];
  const currentDate = new Date(weekPeriod.startDate);
  
  for (let i = 0; i < 7; i++) {
    const date = formatDateDisplay(currentDate);
    const displayDate = formatDateDisplayWithDayOfWeek(currentDate);
    dateInfos.push({
      date,
      displayDate,
      dateObject: new Date(currentDate)
    });
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dateInfos;
} 