# 教室予約システム

`reservation_with_results.html`を参考にして作成された、部活動の教室予約を管理するWebアプリケーションです。

## 🚀 Quick Start (Supabase)

### 1. Supabaseプロジェクトを作成
1. [Supabase](https://supabase.com) でアカウント作成
2. 「New Project」でプロジェクト作成
3. データベースパスワードを設定

### 2. 環境変数を設定
プロジェクトルートに `.env.local` を作成：

```env
# Supabaseの設定値をコピー（Settings > Database > Connection string）
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### 3. セットアップ実行
```bash
npm install
npm run supabase:deploy
npm run dev
```

### 4. 本番デプロイ（Vercel）
```bash
# Vercelで環境変数を設定後
npm run build:vercel
```

## 機能

### 学生機能
- 部活動ログイン（部活名とパスワード）
- 教室予約申請フォーム
- 抽選結果の表示（当選/落選）
- 申請データのJSON出力
- 抽選履歴の閲覧

### 教務機能
- 教務ログイン（パスワード認証）
- 教室一覧表示
- **リアルタイム教室利用可否変更** 🆕
- 予約申請の承認/却下
- システム設定（注意事項、抽選設定）
- 抽選実行・履歴の確認
- ポイント管理

## 技術スタック

- **フロントエンド**: Next.js 15.3.3 (最新) + App Router, TypeScript, Tailwind CSS v4
- **バックエンド**: Next.js API Routes + Prisma ORM 6.11.1
- **データベース**: **Supabase (PostgreSQL)** 🆕 / SQLite (開発環境)
- **UI Framework**: Radix UI, Lucide React Icons
- **スタイリング**: Tailwind CSS v4 (最新) + Tailwind Animate
- **開発環境**: Turbopack対応, TypeScript 5, React 19.0.0

## 🔧 開発環境のセットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### インストール

1. プロジェクトディレクトリに移動
```bash
cd pbl_sample/webapp/frontend
```

2. 依存関係をインストール
```bash
npm install
```

### データベース設定

#### Option 1: Supabase使用（推奨）
```bash
# 1. Supabaseプロジェクト作成
# 2. .env.localに接続情報設定
# 3. データベースセットアップ
npm run supabase:deploy
npm run dev:supabase
```

#### Option 2: SQLite使用（ローカル開発）
```bash
# 環境設定
echo 'DATABASE_URL="file:./dev.db"' > .env.local

# セットアップ
npm run dev:sqlite
```

## 🆕 新機能：リアルタイムデータ同期

### 解決した問題
- ✅ **端末間でのデータ同期**: 管理画面での変更が他の端末に自動反映
- ✅ **リアルタイム更新**: 30秒ごとの自動ポーリング
- ✅ **データベース中心管理**: ローカルストレージからの脱却
- ✅ **エラーハンドリング強化**: Supabase接続エラーへの対応

### 技術実装
- **個別更新API**: `/api/classrooms/status`
- **一括更新API**: `/api/classrooms/status/bulk`
- **自動ポーリング**: 学生画面で30秒間隔更新
- **トランザクション**: データ整合性保証

## 📱 使用方法

### 学生としてログイン
1. http://localhost:3000/student にアクセス
2. 部活名とパスワードでログイン
   - 例: 野球部 / baseball
3. 教室を選択して予約申請
4. 抽選結果を確認

### 教務としてログイン
1. http://localhost:3000/admin にアクセス
2. パスワード：`admin`
3. 教室利用可否を変更
4. **他の端末で即座に反映確認** 🆕

## 🔄 利用可能なコマンド

```bash
# 開発
npm run dev              # Turbopack開発サーバー
npm run dev:sqlite       # SQLiteで開発
npm run dev:supabase     # Supabaseで開発

# データベース
npm run db:push          # スキーマ適用
npm run db:studio        # Prisma Studio起動
npm run db:reset         # データベースリセット

# Supabase
npm run supabase:setup   # 設定手順表示
npm run supabase:deploy  # Supabaseデプロイ

# 本番ビルド
npm run build            # 通常ビルド
npm run build:vercel     # Vercel用ビルド
```

## 🏗️ デプロイメント

### Vercel + Supabase
1. Vercelプロジェクト作成
2. 環境変数設定：
   - `DATABASE_URL`
   - `DIRECT_URL`
3. 自動デプロイ

## 📚 技術詳細

### フロントエンド
- **Next.js**: 15.3.3 (React 19対応、Turbopack安定版)
- **React**: 19.0.0 (最新安定版)
- **TypeScript**: 5.x (型安全性)
- **Tailwind CSS**: v4 (最新、改良されたパフォーマンス)

### UI コンポーネント
- **Radix UI**: モダンなUIプリミティブ
- **Lucide React**: アイコンライブラリ
- **class-variance-authority**: CSS-in-JSユーティリティ
- **next-themes**: ダークモードサポート

### データベース・バックエンド
- **Prisma**: 6.11.1 (最新ORM)
- **Supabase**: PostgreSQL (本番環境)
- **SQLite**: 開発環境用DB

## 🔍 トラブルシューティング

### プレビュー環境での教室利用可否変更エラー

**1. ヘルスチェック実行**
```bash
# プレビュー環境のURLで確認
curl https://your-preview-url.vercel.app/api/health
```

**2. 環境変数の確認**
- Vercelダッシュボードで以下が設定されているか確認：
  - `DATABASE_URL` (Supabase接続URL)
  - `DIRECT_URL` (Supabase直接接続URL)

**3. データベース接続確認**
```bash
# ローカルでSupabase接続テスト
npm run setup:postgres
npx prisma db push
```

**4. ログの確認**
- Vercelダッシュボード → Functions → View Function Logs
- エラーコード別対応：
  - `P1001`: データベース接続失敗 → 環境変数確認
  - `P2025`: レコードが見つからない → データベース初期化
  - `Timeout`: 接続タイムアウト → Supabaseプロジェクト確認

### Supabase接続エラー
```bash
# 接続確認
npx prisma db push

# エラー対応
1. 環境変数の確認
2. Supabaseプロジェクトの状態確認
3. パスワードの特殊文字URLエンコード
```

### データベース同期問題
```bash
# スキーマリセット
npm run db:reset

# 強制同期
npx prisma db push --force-reset
```

### プレビュー環境特有の問題

**エラー: "教室が見つかりません"**
```bash
# データベース初期化
1. Supabaseダッシュボードでテーブル確認
2. prisma/migrations/ から手動でテーブル作成
3. npm run supabase:deploy
```

**エラー: "環境変数が設定されていません"**
```bash
# Vercelで環境変数設定
1. PROJECT_SETTINGS → Environment Variables
2. DATABASE_URL と DIRECT_URL を追加
3. 全環境（Production, Preview, Development）に適用
```

**デバッグ用エンドポイント**
- `/api/health` - データベース接続診断
- ブラウザコンソール - フロントエンドエラー確認
- Vercel Function Logs - サーバーサイドエラー確認

## 最新機能

### Next.js 15の新機能
- **React 19サポート**: 最新のReact機能を活用
- **Turbopack安定版**: 高速な開発体験
- **改善されたキャッシュ戦略**: より柔軟なデータ管理
- **Error UIの改善**: 開発時のデバッグ体験向上

### Tailwind CSS v4の新機能
- **ゼロランタイム**: CSS-in-JSからの移行
- **改善されたパフォーマンス**: より高速なビルド
- **新しいカラーパレット**: モダンなデザインシステム

## ライセンス

このプロジェクトは教育目的で作成されています。
