import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  console.log('🏥 [GET /api/health] Health check requested');
  
  const startTime = Date.now();
  const healthCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      connected: false,
      provider: 'unknown',
      responseTime: 0,
      error: null as string | null
    },
    environment_variables: {
      DATABASE_URL: !!process.env.DATABASE_URL,
      DIRECT_URL: !!process.env.DIRECT_URL,
      NODE_ENV: process.env.NODE_ENV
    }
  };

  // データベース接続テスト
  try {
    console.log('🔍 Testing database connection...');
    
    // 簡単なクエリでデータベース接続をテスト
    await prisma.$queryRaw`SELECT 1`;
    
    healthCheck.database.connected = true;
    healthCheck.database.responseTime = Date.now() - startTime;
    
    // データベースプロバイダーを検出
    const databaseUrl = process.env.DATABASE_URL || '';
    // 以降は常にSupabase(PostgreSQL)を想定
    healthCheck.database.provider = databaseUrl.includes('postgresql://') ? 'postgresql' : 'postgresql';
    
    console.log('✅ Database connection successful');
    
    // 教室データの存在確認
    const classroomCount = await prisma.classroom.count();
    console.log(`📊 Found ${classroomCount} classrooms in database`);
    
    return NextResponse.json({
      status: 'healthy',
      ...healthCheck,
      database: {
        ...healthCheck.database,
        classroomCount
      }
    });
    
  } catch (error: any) {
    console.error('❌ Database health check failed:', error);
    
    healthCheck.database.connected = false;
    healthCheck.database.responseTime = Date.now() - startTime;
    healthCheck.database.error = error.message;
    
    // Prismaエラーコードに基づく詳細な診断
    let diagnosis = 'Unknown database error';
    
    if (error.code === 'P1001') {
      diagnosis = 'Cannot connect to database. Check DATABASE_URL and DIRECT_URL.';
    } else if (error.code === 'P1008') {
      diagnosis = 'Database connection timeout. Database may be slow or unavailable.';
    } else if (error.code === 'P1017') {
      diagnosis = 'Database server has closed the connection.';
    } else if (error.message.includes('getaddrinfo ENOTFOUND')) {
      diagnosis = 'Database host not found. Check DATABASE_URL hostname.';
    } else if (error.message.includes('connect ECONNREFUSED')) {
      diagnosis = 'Connection refused. Database server may be down.';
    } else if (error.message.includes('SASL authentication failed')) {
      diagnosis = 'Authentication failed. Check database credentials.';
    }
    
    return NextResponse.json({
      status: 'unhealthy',
      ...healthCheck,
      diagnosis
    }, { status: 503 });
  }
} 