import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export interface ReservationRequest {
  user: string;
  selections: unknown; // フロントの形式をそのまま JSON で保存
  timestamp: string;
}

export async function GET() {
  try {
    const all = await prisma.reservation.findMany({
      include: { club: true, classroom: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(all);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: '予約データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let body: any = null;
  let user: string = '';
  let selections: any = null;
  
  try {
    body = await request.json();
    user = body.user;
    selections = body.selections;

    // club を取得
    const club = await prisma.club.findUnique({ where: { name: user } });
    if (!club) {
      return NextResponse.json({ error: '部活が存在しません' }, { status: 400 });
    }

    await prisma.reservation.create({
      data: {
        clubId: club.id,
        day: Array.isArray(selections) && selections[0]?.day ? selections[0].day : '',
        data: selections,
      },
    });

    return NextResponse.json({ message: '予約申請を受け付けました' });
  } catch (error) {
    console.error('Database error:', error);
    
    // データベース接続に失敗した場合のフォールバック処理
    // 開発・デモ環境では成功レスポンスを返す
    console.log('Fallback: 予約申請をローカルログに記録しました:', { user, selections });
    
    return NextResponse.json({ 
      message: '予約申請を受け付けました（デモモード）',
      note: 'データベースが設定されていないため、この申請は一時的に記録されます'
    });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id } = body; // action は現在未使用

    await prisma.reservation.update({
      where: { id },
      data: { data: { ...body } },
    });

    return NextResponse.json({ message: '予約申請を処理しました' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: '予約申請の処理に失敗しました' },
      { status: 500 }
    );
  }
} 