export interface Classroom {
  name: string;
}

export interface ClubPoints {
  name: string;
  points: number;
}

export interface ReservationRequestLegacy {
  user: string;
  selections: Array<{
    room: string;
    day: string;
  }>;
}

// 新バージョン（学生画面で使用）
export interface ReservationRequestV2 {
  user: string;
  selections: Array<{
    day: string;
    reservations: Array<{
      preferences: string[]; // 第1〜5希望
    }>;
  }>;
}

/**
 * 抽選結果（マッチング）を表す型
 * key: 教室名, value: 部活動名
 */
export type AllocationMap = Record<string, string | null>;

interface LotteryResult {
  allocations: AllocationMap;
  updatedClubPoints: ClubPoints[];
}

/** ランダムにシャッフル */
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

/**
 * 予約申請データから部活ごとの希望教室リストを抽出する
 */
function extractClubPreferences(
  reservations: Array<ReservationRequestLegacy | ReservationRequestV2>
): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  for (const r of reservations) {
    const club = r.user;
    if (!map[club]) map[club] = [];

    // 型を簡易判定
    const firstSel = r.selections[0] as
      | ReservationRequestLegacy['selections'][number]
      | ReservationRequestV2['selections'][number]
      | undefined;
    if (firstSel && 'room' in firstSel) {
      // レガシー形式
      (r as ReservationRequestLegacy).selections.forEach((sel) => {
        if (!map[club].includes(sel.room)) {
          map[club].push(sel.room);
        }
      });
    } else {
      // V2 形式
      (r as ReservationRequestV2).selections.forEach((sel) => {
        sel.reservations.forEach((slot) => {
          slot.preferences.forEach((pref) => {
            if (pref && !map[club].includes(pref)) {
              map[club].push(pref);
            }
          });
        });
      });
    }
  }

  return map;
}

/**
 * Gale-Shapley に基づく教室割り当て抽選
 * - 応募者: 各部活動 (クラブ)
 * - 企業   : 教室 (クラスルーム)
 * 教室側の選好はポイントが高い順 / ポイント同点の場合は先着順で決定
 */
export function performLottery(
  reservations: Array<ReservationRequestLegacy | ReservationRequestV2>,
  clubs: ClubPoints[],
  classrooms: Classroom[]
): LotteryResult {
  // 希望リストを抽出
  const preferences = extractClubPreferences(reservations);

  const allClubNames = clubs.map((c) => c.name);
  // その日付に申請を出していない部活は抽選対象から除外
  const clubNames = allClubNames.filter(
    (name) => (preferences[name]?.length ?? 0) > 0
  );

  // 参加していない部活はポイントを変更しないようにマーク
  const inactiveClubSet = new Set<string>(
    allClubNames.filter((name) => !clubNames.includes(name))
  );

  const pointsMap: Record<string, number> = {};
  clubs.forEach((c) => (pointsMap[c.name] = c.points));

  // 教室ごとの現在の割り当て部活
  const allocation: AllocationMap = {};
  classrooms.forEach((room) => (allocation[room.name] = null));

  // 各部活の次に提案するインデックス
  const proposalIndex: Record<string, number> = {};
  clubNames.forEach((club) => (proposalIndex[club] = 0));

  // マッチングされていない部活を追跡
  const isMatched: Record<string, boolean> = {};
  clubNames.forEach((club) => (isMatched[club] = false));

  let progress = true;
  while (progress) {
    progress = false;

    for (const club of clubNames) {
      if (isMatched[club]) continue;

      const prefList = preferences[club] || [];
      if (proposalIndex[club] >= prefList.length) {
        // もう提案できる教室がない
        continue;
      }

      const room = prefList[proposalIndex[club]];
      proposalIndex[club] += 1;

      if (!(room in allocation)) {
        // 不正な教室名 (存在しない)
        continue;
      }

      if (allocation[room] === null) {
        // 教室が空いている
        allocation[room] = club;
        isMatched[club] = true;
        progress = true;
      } else {
        const currentClub = allocation[room] as string;
        // ポイントが高い部活を優先
        if (pointsMap[club] > pointsMap[currentClub]) {
          allocation[room] = club;
          isMatched[club] = true;
          isMatched[currentClub] = false; // 追い出される
          progress = true;
        }
      }
    }
  }

  // 残った部活に対して空き教室をランダムに割り当て
  const unmatchedClubs = clubNames.filter((c) => !isMatched[c]);
  const remainingRooms = shuffle(
    classrooms.filter((r) => allocation[r.name] === null).map((r) => r.name)
  );

  for (let i = 0; i < unmatchedClubs.length && i < remainingRooms.length; i++) {
    const club = unmatchedClubs[i];
    const room = remainingRooms[i];
    allocation[room] = club;
    isMatched[club] = true;
  }

  // ポイント更新
  const updatedClubs: ClubPoints[] = clubs.map((c) => ({ ...c }));
  updatedClubs.forEach((club) => {
    if (inactiveClubSet.has(club.name)) {
      // 参加していない部活はポイント据え置き
      return;
    }

    const prefList = preferences[club.name] || [];

    // 採用されたか検索
    const matchedRoom = Object.entries(allocation).find(
      ([, v]) => v === club.name
    )?.[0];

    let increment = 0;
    if (!matchedRoom) {
      // 割り当てなし (希望が通らなかった)
      increment = 10;
    } else {
      const rank = prefList.indexOf(matchedRoom);
      if (rank === -1) {
        // 希望外の教室 (残り物)
        increment = 10;
      } else if (rank === 0) {
        increment = 1; // 第一希望通過
      } else {
        increment = 1 + rank * 2; // 第一希望から遠いほど多く
      }
    }
    club.points += increment;
  });

  return {
    allocations: allocation,
    updatedClubPoints: updatedClubs,
  };
} 