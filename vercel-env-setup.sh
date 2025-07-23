#!/bin/bash
# Vercel環境変数設定スクリプト

echo "🔧 Vercel環境変数を設定中..."

# NEXTAUTH_SECRET（32文字のランダム文字列を生成）
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "📝 NEXTAUTH_SECRET を設定..."
echo $NEXTAUTH_SECRET | vercel env add NEXTAUTH_SECRET production
echo $NEXTAUTH_SECRET | vercel env add NEXTAUTH_SECRET preview  
echo $NEXTAUTH_SECRET | vercel env add NEXTAUTH_SECRET development

# NEXTAUTH_URL（実際のURLに要変更）
echo "📝 NEXTAUTH_URL を設定..."
echo "https://classroom-reservation-system.vercel.app" | vercel env add NEXTAUTH_URL production
echo "https://classroom-reservation-system.vercel.app" | vercel env add NEXTAUTH_URL preview
echo "http://localhost:3000" | vercel env add NEXTAUTH_URL development

echo "✅ 環境変数設定完了！"
echo "🚀 再デプロイを実行してください: vercel --prod" 