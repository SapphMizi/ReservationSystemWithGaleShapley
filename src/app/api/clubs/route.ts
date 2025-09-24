import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 初回アクセス時、DB が空ならサンプルデータを投入
async function ensureSeed() {
  const count = await prisma.club.count();
  if (count === 0) {
    await prisma.club.createMany({
      data: [
        { name: '野球部', password: 'baseball', points: 0 },
        { name: 'サッカー部', password: 'soccer', points: 0 },
        { name: '軽音学部', password: 'lightmusic', points: 0 },
        { name: 'バスケットボール部', password: 'basketball', points: 0 },
        { name: 'テニス部', password: 'tennis', points: 0 },
        { name: '卓球部', password: 'pingpong', points: 0 },
        { name: '吹奏楽部', password: 'band', points: 0 },
        { name: '美術部', password: 'art', points: 0 },
        { name: '写真部', password: 'photo', points: 0 },
        { name: '科学部', password: 'science', points: 0 },
      ],
    });
  }
}

export async function GET() {
  try {
    await ensureSeed();
    const allClubs = await prisma.club.findMany();
    return NextResponse.json(allClubs);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '部活データの取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, password } = body;

    const created = await prisma.club.create({
      data: { name, password },
    });

    return NextResponse.json({ message: '部活を追加しました', club: created });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: '部活データの追加に失敗しました' },
      { status: 500 }
    );
  }
} 

// パスワード変更
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { name, password } = body;

    if (!name || !password) {
      return NextResponse.json({ error: 'name と password が必要です' }, { status: 400 });
    }

    const updated = await prisma.club.update({
      where: { name },
      data: { password },
    });

    return NextResponse.json({ message: 'パスワードを更新しました', club: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}

// クラブ削除
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json({ error: 'name が必要です' }, { status: 400 });
    }

    // 関連予約を削除
    await prisma.reservation.deleteMany({ where: { club: { name } } });

    await prisma.club.delete({ where: { name } });

    return NextResponse.json({ message: '部活を削除しました' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
} 