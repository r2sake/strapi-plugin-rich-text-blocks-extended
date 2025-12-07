# 実装計画: PrismJS 初期化のリファクタリング

## 背景
現在、`auth` 画面やコンテンツ管理画面のロード時に PrismJS の言語定義読み込み順序や競合によりエラーが発生している可能性がある。また、`Code.tsx` と `index.ts` 両方で初期化関数を呼んでいるため、予期せぬ挙動を引き起こすリスクがある。

## 変更内容

### 1. `admin/src/utils/prism-init.ts`
- `initPrism` 関数内に初期化済みフラグ (`isInitialized`) を追加。
- 既に初期化済みの場合は即座に return するように変更。
- エラーハンドリングとログ出力を保持・改善。

### 2. `admin/src/index.ts`
- `bootstrap(app)` メソッドを追加。
- `initPrism()` の呼び出しを `register` から `bootstrap` に移動し、`await` する。これにより、プラグインの準備が整うまで Strapi の起動フローと同期をとる（可能な範囲で）。

### 3. `admin/src/components/BlocksInput/Blocks/Code.tsx`
- ファイルトップレベルでの `initPrism()` 呼び出しを削除。
- `decorateCode` 関数内で `Prism.languages[decorateKey]` が存在しない場合のフォールバック（`plaintext` への切り替えなど）を強化し、クラッシュを防ぐ。

## 検証方法
- ビルド (`npm run build`) が成功すること。
- Strapi を起動し、Admin パネルがエラーなくロードされること。
- リッチテキストエディタでコードブロックを追加し、シンタックスハイライトが機能すること。
