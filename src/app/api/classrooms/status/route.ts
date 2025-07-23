import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 個別更新
export async function PUT(request: Request) {
  console.log('🔄 [PUT /api/classrooms/status] Request received');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Database URL exists:', !!process.env.DATABASE_URL);
  console.log('Direct URL exists:', !!process.env.DIRECT_URL);

  try {
    const body = await request.json();
    const { classroom_name, date, status } = body;
    
    console.log('📝 Request body:', { classroom_name, date, status });

    if (!classroom_name || !date || !status) {
      console.log('❌ Missing required parameters');
      return NextResponse.json({ 
        error: '必須パラメータが不足しています (classroom_name, date, status)' 
      }, { status: 400 });
    }

    console.log('🔍 Searching for classroom:', classroom_name);
    
    // 教室の存在確認
    const room = await prisma.classroom.findUnique({ 
      where: { name: classroom_name } 
    });
    
    if (!room) {
      console.log('❌ Classroom not found:', classroom_name);
      return NextResponse.json({ 
        error: `教室 '${classroom_name}' が見つかりません` 
      }, { status: 404 });
    }

    console.log('✅ Classroom found:', { id: room.id, name: room.name });

    // availablePerDayの更新
    const current: Record<string, any> = (room.availablePerDay as Record<string, any> | null) ?? {};
    current[date] = status;

    console.log('📊 Updating availablePerDay:', current);

    const updatedRoom = await prisma.classroom.update({
      where: { id: room.id },
      data: { availablePerDay: current },
    });

    console.log(`✅ 教室 ${classroom_name} の ${date} を ${status} に更新しました`);

    return NextResponse.json({ 
      message: '更新しました',
      updated: {
        classroom: classroom_name,
        date,
        status,
        roomId: updatedRoom.id
      }
    });

  } catch (error: any) {
    console.error('❌ [PUT /api/classrooms/status] Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Prisma/PostgreSQL固有のエラーハンドリング
    if (error.code === 'P1001') {
      console.error('🔌 Database connection failed');
      return NextResponse.json(
        { 
          error: 'データベースに接続できません。環境変数を確認してください。',
          debug: process.env.NODE_ENV === 'development' ? {
            databaseUrl: process.env.DATABASE_URL ? 'SET' : 'NOT_SET',
            directUrl: process.env.DIRECT_URL ? 'SET' : 'NOT_SET'
          } : undefined
        },
        { status: 503 }
      );
    }

    if (error.code === 'P2002') {
      console.error('🔄 Unique constraint violation');
      return NextResponse.json(
        { error: 'データの重複が発生しました。' },
        { status: 409 }
      );
    }

    if (error.code === 'P2025') {
      console.error('🔍 Record not found');
      return NextResponse.json(
        { error: '指定された教室が見つかりません。' },
        { status: 404 }
      );
    }

    // 一般的なデータベースエラー
    if (error.message?.includes('timeout')) {
      console.error('⏰ Database timeout');
      return NextResponse.json(
        { error: 'データベース接続がタイムアウトしました。しばらく待ってから再試行してください。' },
        { status: 503 }
      );
    }

    // その他のエラー
    console.error('🚨 Unexpected error in classroom status update');
    return NextResponse.json(
      { 
        error: 'データベースの更新に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 