# プレビュー環境デプロイガイド

## 🚨 必須設定：環境変数

### Vercelダッシュボードでの設定

1. **プロジェクト設定**
   - Vercelダッシュボード → プロジェクト選択
   - Settings → Environment Variables

2. **必須環境変数**
```env
# Supabase接続情報（必須）
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres

# すべての環境に適用
✅ Production
✅ Preview 
✅ Development
```

### Supabase設定値の取得方法

1. [Supabase Dashboard](https://supabase.com) にログイン
2. プロジェクト選択 → Settings → Database
3. Connection string セクションから以下をコピー：
   - **Connection pooling**: DATABASE_URL用
   - **Direct connection**: DIRECT_URL用
4. `[YOUR-PASSWORD]` と `[PROJECT-REF]` を実際の値に置換

## 🔧 デプロイ後の確認手順

### 1. ヘルスチェック実行
```bash
# プレビューURLで接続確認
curl https://your-preview-url.vercel.app/api/health

# 正常な場合のレスポンス例
{
  "status": "healthy",
  "database": {
    "connected": true,
    "provider": "postgresql",
    "responseTime": 150,
    "classroomCount": 27
  }
}
```

### 2. 管理画面での動作確認

1. **ログイン**
   - URL: `https://your-preview-url.vercel.app/admin`
   - パスワード: `admin`

2. **接続確認**
   - 「接続確認」ボタンをクリック
   - 正常時: `✅ 接続正常 (postgresql, XXXms, 教室XX件)`

3. **教室利用可否変更テスト**
   - 任意の教室の利用可否を変更
   - 「変更を保存」をクリック
   - 成功時: `✅ 保存しました（学生画面に反映されます）`

### 3. 学生画面での反映確認

1. **別ブラウザ/タブで学生画面を開く**
   - URL: `https://your-preview-url.vercel.app/student`

2. **データ同期確認**
   - 管理画面での変更が30秒以内に反映されることを確認

## 🐛 トラブルシューティング

### エラー: "データベースに接続できません"

**原因**: 環境変数が設定されていない
```bash
# 確認方法
curl https://your-preview-url.vercel.app/api/health

# エラーレスポンス例
{
  "status": "unhealthy",
  "diagnosis": "Cannot connect to database. Check DATABASE_URL and DIRECT_URL."
}
```

**解決方法**:
1. Vercel環境変数設定を再確認
2. DATABASE_URL, DIRECT_URLが全環境（Production, Preview, Development）に設定されているか確認
3. 再デプロイ実行

### エラー: "教室が見つかりません"

**原因**: データベースが初期化されていない
```bash
# 確認方法
curl https://your-preview-url.vercel.app/api/health
# classroomCount が 0 の場合
```

**解決方法**:
1. **Supabaseダッシュボードでテーブル確認**
2. **手動でテーブル作成**（以下のSQLを実行）:

```sql
-- Clubテーブル
CREATE TABLE "Club" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Classroomテーブル
CREATE TABLE "Classroom" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(50) UNIQUE NOT NULL,
    "capacity" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "availablePerDay" JSONB
);

-- 他のテーブルも同様に作成（SQLiteは使用しません）
```

3. **サンプルデータ投入**:
```sql
INSERT INTO "Classroom" ("name", "capacity", "status") VALUES
('C101', 105, '固定'),
('C104', 52, 'セパ'),
('C105', 68, 'セパ'),
-- ... 他の教室データ
;

INSERT INTO "Club" ("name", "password") VALUES
('野球部', 'baseball'),
('サッカー部', 'soccer'),
('軽音学部', 'lightmusic');
```

### エラー: "認証失敗"

**原因**: データベース認証情報が間違っている
**解決方法**:
1. Supabaseのパスワードを確認
2. 特殊文字がある場合はURLエンコード
3. DATABASE_URLの形式を再確認

### エラー: "プロジェクトが停止中"

**原因**: Supabaseプロジェクトの自動一時停止
**解決方法**:
1. Supabaseダッシュボードでプロジェクトを確認
2. 必要に応じて手動で再開
3. プロジェクト設定で自動停止を無効化（有料プラン）

## 📊 成功時の動作フロー

### 正常なデプロイフロー
```
1. Git push → Vercelでビルド開始
2. npm run build:vercel 実行
3. PostgreSQL用スキーマに自動切り替え
4. prisma generate 実行
5. Next.js ビルド完了
6. デプロイ成功
```

### 正常な動作フロー
```
1. 管理画面で教室利用可否変更
2. /api/classrooms/status へPUTリクエスト
3. PostgreSQLデータベース更新
4. 学生画面で30秒以内に反映
5. 他の端末でも同期確認
```

## 🛠️ 緊急時の対応

### 完全リセット手順
```bash
# 1. ローカルでスキーマ再生成
npm run setup:postgres
npx prisma generate

# 2. Supabaseでテーブル削除・再作成
# SQL Editor で DROP TABLE を実行後、上記のCREATE TABLE実行

# 3. 再デプロイ
git commit -m "Fix database schema"
git push
```

### サポート情報
- **Vercelログ**: Function タブで詳細ログ確認
- **Supabaseログ**: ダッシュボードのLogsセクション  
- **ヘルスチェック**: `/api/health` で診断情報取得 