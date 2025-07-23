# データベースセットアップガイド

## Supabase対応（本番環境推奨）

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 「New Project」でプロジェクト作成
3. プロジェクト名、データベースパスワードを設定
4. リージョンを選択（日本の場合は Singapore または Tokyo）

### 2. 環境変数の設定

プロジェクトルートに `.env.local`（開発用）または `.env`（本番用）を作成：

```env
# Supabase PostgreSQL Database URL (Connection Pooling)
DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"

# Direct connection to the database (for migrations)
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres"

# 開発環境でSQLiteを使用する場合（コメントアウト）
# DATABASE_URL="file:./dev.db"
# DIRECT_URL="file:./dev.db"
```

**設定値の取得方法:**
1. Supabaseダッシュボード → 「Settings」→ 「Database」
2. 「Connection string」セクションから以下をコピー：
   - `DATABASE_URL`: Connection pooling の URI
   - `DIRECT_URL`: Direct connection の URI
3. `[YOUR-PASSWORD]` を実際のパスワードに置換
4. `[YOUR-PROJECT-REF]` をプロジェクトIDに置換

### 3. データベーススキーマの適用

```bash
# Prismaクライアント生成
npx prisma generate

# データベースにスキーマを適用
npx prisma db push

# または、マイグレーションファイルを作成して適用
npx prisma migrate dev --name init
```

### 4. Vercelでのデプロイ設定

Vercelダッシュボードで環境変数を設定：

1. プロジェクト → 「Settings」→ 「Environment Variables」
2. 以下の環境変数を追加：
   - `DATABASE_URL`
   - `DIRECT_URL`

### 5. 本番デプロイ時の自動設定

```bash
# 本番ビルド時に自動でPostgreSQLに切り替え
npm run build:vercel
```

## ローカル開発環境の設定

### Option 1: Supabaseを使用（推奨）

上記の Supabase 設定を使用して開発環境でも本番と同じデータベースを利用

### Option 2: SQLiteをローカルで使用（簡易）

1. `.env.local` ファイルを作成：
```env
DATABASE_URL="file:./dev.db"
DIRECT_URL="file:./dev.db"
```

2. スキーマ適用：
```bash
npm run db:push
```

## データベース操作コマンド

```bash
# スキーマをデータベースに反映
npm run db:push

# マイグレーション作成・適用
npx prisma migrate dev

# Prisma Studio起動（データベース管理GUI）
npx prisma studio

# データベースリセット
npx prisma migrate reset
```

## トラブルシューティング

### エラー: 接続タイムアウト
- Supabaseプロジェクトが一時停止状態の可能性
- ダッシュボードでプロジェクトを再開

### エラー: 認証失敗
- DATABASE_URLのパスワードが正しいか確認
- 特殊文字はURLエンコードが必要

### エラー: テーブルが存在しない
```bash
npx prisma db push --force-reset
```

### 開発環境と本番環境でのデータベース切り替え
- 開発: `.env.local` でSQLiteまたはSupabase
- 本番: Vercelの環境変数でSupabase 