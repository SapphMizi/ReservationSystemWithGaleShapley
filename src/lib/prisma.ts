import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Supabase用の接続プール最適化
export async function connectPrisma() {
  try {
    await prisma.$connect();
    console.log('✅ Prisma connected to Supabase');
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error);
    throw error;
  }
}

// アプリケーション終了時のクリーンアップ
export async function disconnectPrisma() {
  await prisma.$disconnect();
  console.log('🔌 Prisma disconnected');
} 