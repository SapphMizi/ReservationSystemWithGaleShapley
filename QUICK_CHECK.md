# 🚀 プレビュー環境クイックチェック

## ⚡ 3分で完了する検証手順

### ステップ1: ヘルスチェック（30秒）
```bash
curl https://your-preview-url.vercel.app/api/health
```

**期待する結果:**
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "provider": "postgresql"
  }
}
```

❌ **エラーの場合**: [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md) のトラブルシューティング参照

---

### ステップ2: 管理画面ログイン（30秒）
1. `https://your-preview-url.vercel.app/admin` にアクセス
2. パスワード: `admin` でログイン
3. 「接続確認」ボタンをクリック

**期待する結果:**
```
✅ 接続正常 (postgresql, XXXms, 教室XX件)
```

---

### ステップ3: 教室利用可否変更テスト（60秒）
1. 任意の教室（例：C101）の利用可否を変更
   - 「使用可」→「使用不可」に変更
2. 「変更を保存」をクリック

**期待する結果:**
```
✅ 保存しました（学生画面に反映されます）
```

---

### ステップ4: 別端末での反映確認（60秒）
1. **新しいブラウザ/シークレットモード**で学生画面を開く
   - `https://your-preview-url.vercel.app/student`
2. 部活でログイン（例：野球部 / baseball）
3. **30秒以内**に変更が反映されているか確認

**期待する結果:**
- C101が「使用不可」として表示される
- 選択肢から除外される または 「※使用不可」と表示される

---

## ✅ 全て成功の場合

**🎉 問題解決完了！**

プレビュー環境での教室利用可否変更エラーが修正されました：

- ✅ データベース接続正常
- ✅ 管理画面での変更保存成功  
- ✅ 端末間でのリアルタイム同期動作
- ✅ PostgreSQL（Supabase）対応完了

---

## ❌ 問題が残っている場合

### よくあるエラーと解決法

| エラーメッセージ | 解決方法 |
|---|---|
| `"status": "unhealthy"` | 環境変数未設定 → Vercelで DATABASE_URL, DIRECT_URL を設定 |
| `"教室が見つかりません"` | データベース未初期化 → [DEPLOY_GUIDE.md](./DEPLOY_GUIDE.md)の手動テーブル作成実行 |
| `❌ 保存に失敗しました` | API接続エラー → Vercel Function Logs を確認 |
| 変更が反映されない | ポーリング未動作 → ブラウザコンソールでエラー確認 |

### 詳細トラブルシューティング
👉 [完全なデプロイガイド](./DEPLOY_GUIDE.md) を参照

---

## 🔧 追加の診断コマンド

```bash
# API直接テスト
curl -X PUT https://your-preview-url.vercel.app/api/classrooms/status \
  -H "Content-Type: application/json" \
  -d '{"classroom_name":"C101","date":"7/25","status":"テスト"}'

# 教室データ取得
curl https://your-preview-url.vercel.app/api/classrooms

# Vercelログリアルタイム確認
vercel logs --app=your-app-name --follow
``` 