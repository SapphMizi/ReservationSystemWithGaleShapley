import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 一括更新
export async function PUT(request: Request) {
  console.log('🔄 [PUT /api/classrooms/status/bulk] Request received');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Database URL exists:', !!process.env.DATABASE_URL);
  console.log('Direct URL exists:', !!process.env.DIRECT_URL);

  try {
    const body = await request.json();
    const { updates } = body;

    console.log('📝 Bulk update request:', { updatesCount: updates?.length });

    if (!Array.isArray(updates) || updates.length === 0) {
      console.log('❌ Invalid updates array');
      return NextResponse.json({ 
        error: 'updates配列が必要です（空でない配列）' 
      }, { status: 400 });
    }

    // バリデーション
    const invalidUpdates = updates.filter(update => 
      !update.classroom_name || !update.date || !update.status
    );

    if (invalidUpdates.length > 0) {
      console.log('❌ Invalid update data found:', invalidUpdates.length);
      return NextResponse.json({ 
        error: '無効な更新データが含まれています',
        invalidUpdates: invalidUpdates.length
      }, { status: 400 });
    }

    console.log(`🔄 ${updates.length}件の教室利用可否を一括更新開始`);

    // 教室ごとにグループ化
    const roomUpdates: Record<string, Record<string, string>> = {};
    
    for (const update of updates) {
      const { classroom_name, date, status } = update;
      if (!roomUpdates[classroom_name]) {
        roomUpdates[classroom_name] = {};
      }
      roomUpdates[classroom_name][date] = status;
    }

    console.log('📊 Grouped updates by classroom:', Object.keys(roomUpdates));

    const updateResults: Array<{
      classroom: string;
      success: boolean;
      error?: string;
      updatedDates?: string[];
    }> = [];

    // 各教室のデータを更新（トランザクション使用）
    await prisma.$transaction(async (tx) => {
      console.log('🔄 Starting transaction');
      
      for (const [roomName, dateStatuses] of Object.entries(roomUpdates)) {
        try {
          console.log(`🔍 Processing classroom: ${roomName}`);
          
          const room = await tx.classroom.findUnique({ 
            where: { name: roomName } 
          });
          
          if (!room) {
            console.log(`❌ Classroom not found: ${roomName}`);
            updateResults.push({
              classroom: roomName,
              success: false,
              error: `教室 '${roomName}' が見つかりません`
            });
            continue;
          }

          const current: Record<string, any> = (room.availablePerDay as Record<string, any> | null) ?? {};
          
          // 既存データに新しいデータを追加/更新
          Object.assign(current, dateStatuses);

          await tx.classroom.update({
            where: { id: room.id },
            data: { availablePerDay: current },
          });

          updateResults.push({
            classroom: roomName,
            success: true,
            updatedDates: Object.keys(dateStatuses)
          });

          console.log(`✅ ${roomName}: ${Object.keys(dateStatuses).join(', ')} を更新`);
        } catch (error: any) {
          console.error(`❌ ${roomName} の更新に失敗:`, error);
          updateResults.push({
            classroom: roomName,
            success: false,
            error: error.message
          });
        }
      }
    });

    const successCount = updateResults.filter(r => r.success).length;
    const failureCount = updateResults.filter(r => !r.success).length;

    console.log(`📊 一括更新結果: 成功 ${successCount}件、失敗 ${failureCount}件`);

    return NextResponse.json({ 
      message: `一括更新完了: 成功 ${successCount}件、失敗 ${failureCount}件`,
      results: updateResults,
      summary: {
        total: updateResults.length,
        success: successCount,
        failure: failureCount
      }
    });

  } catch (error: any) {
    console.error('❌ [PUT /api/classrooms/status/bulk] Error:', error);
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

    if (error.code === 'P2034') {
      console.error('🔄 Transaction conflict');
      return NextResponse.json(
        { error: 'トランザクションが競合しました。しばらく待ってから再試行してください。' },
        { status: 503 }
      );
    }

    // タイムアウトエラー
    if (error.message?.includes('timeout')) {
      console.error('⏰ Database timeout');
      return NextResponse.json(
        { error: 'データベース接続がタイムアウトしました。データ量を減らして再試行してください。' },
        { status: 503 }
      );
    }

    // その他のエラー
    console.error('🚨 Unexpected error in bulk classroom status update');
    return NextResponse.json(
      { 
        error: 'データベースの一括更新に失敗しました',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
} 