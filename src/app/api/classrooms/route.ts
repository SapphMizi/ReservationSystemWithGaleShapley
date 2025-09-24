import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const sampleRooms = [
  { name: 'C101', capacity: 105, status: '固定' },
  { name: 'C104', capacity: 52, status: 'セパ' },
  { name: 'C105', capacity: 68, status: 'セパ' },
  { name: 'C106', capacity: 102, status: 'セパ' },
  { name: 'C202', capacity: 156, status: '固定' },
  { name: 'C203', capacity: 73, status: '固定' },
  { name: 'C204', capacity: 44, status: 'セパ' },
  { name: 'C205', capacity: 60, status: '固定' },
  { name: 'C206', capacity: 106, status: '固定' },
  { name: 'C301', capacity: 105, status: '固定' },
  { name: 'C302', capacity: 156, status: '固定' },
  { name: 'C303', capacity: 72, status: '固定' },
  { name: 'C304', capacity: 51, status: 'セパ' },
  { name: 'C305', capacity: 54, status: '固定' },
  { name: 'C306', capacity: 106, status: '固定' },
  { name: 'C307', capacity: 72, status: '固定' },
  { name: 'C308', capacity: 72, status: '固定' },
  { name: 'C401', capacity: 105, status: '固定' },
  { name: 'C402', capacity: 156, status: '固定' },
  { name: 'C403', capacity: 72, status: '固定' },
  { name: 'C404', capacity: 53, status: 'セパ' },
  { name: 'C405', capacity: 54, status: '固定' },
  { name: 'C406', capacity: 106, status: '固定' },
  { name: 'C407', capacity: 36, status: 'セパ' },
  { name: 'C408', capacity: 36, status: 'セパ' },
  { name: 'C409', capacity: 36, status: 'セパ' },
  { name: '講義室', capacity: 309, status: '固定' },
];

async function ensureSeed() {
  const count = await prisma.classroom.count();
  if (count === 0) {
    await prisma.classroom.createMany({ data: sampleRooms });
  }
}

export async function GET() {
  try {
    await ensureSeed();
    const allRooms = await prisma.classroom.findMany();
    return NextResponse.json(allRooms);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: '教室データの取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { classroom_name, date, available, status } = body;
    
    // 新しい形式（status）と古い形式（available）の両方に対応
    const statusValue = status || (available ? '使用可' : '使用不可');

    const room = await prisma.classroom.findUnique({ where: { name: classroom_name } });
    if (!room) {
      return NextResponse.json({ error: '教室が見つかりません' }, { status: 404 });
    }

    const current: Record<string, any> = (room.availablePerDay as Record<string, any> | null) ?? {};
    current[date] = statusValue;

    await prisma.classroom.update({
      where: { id: room.id },
      data: { availablePerDay: current },
    });

    return NextResponse.json({ message: '更新しました' });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: '教室データの更新に失敗しました' },
      { status: 500 }
    );
  }
} 