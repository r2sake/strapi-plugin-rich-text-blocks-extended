# タスク: ストラピプラグインのリファクタリング

## 目的
`strapi-plugin-rich-text-blocks-extended` プラグインにおける PrismJS の初期化処理を改善し、管理画面での "Cannot set properties of undefined" エラーや競合状態を防ぐ。

## アクションアイテム
1. `admin/src/utils/prism-init.ts`: シングルトンパターンを導入し、多重実行を防止する。
2. `admin/src/index.ts`: `initPrism` の呼び出しを `register` から非同期の `bootstrap` へ移動し、初期化の完了を待機する。
3. `admin/src/components/BlocksInput/Blocks/Code.tsx`: コンポーネントレベルでの `initPrism` 呼び出しを削除し、レンダリング時の言語定義存在チェックを追加する。
