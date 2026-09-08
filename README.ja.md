# Lumen カウントダウンモジュール

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Lumen API](https://img.shields.io/badge/Lumen_API-%5E0.1.0-blue.svg)](https://lumen.media)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![pnpm](https://img.shields.io/badge/pnpm-9.x-orange.svg)](https://pnpm.io/)

**モジュール ID:** `com.example.countdown-module` ｜ **バージョン:** 1.3.1 ｜ **Lumen API:** ^0.1.0 ｜ **ライセンス:** MIT

プレゼンター/オーバーレイ出力、ライブスタイルプレビュー、タイムトリガー、バンドル＆ライブラリ音声、キュー連携、コーナー/全画面モード、タイマープリセット、Commander クイックコントロールを備えた Lumen 用カウントダウンタイマーモジュールです。

## 概要

**Lumen カウントダウンモジュール**は、ライブ制作、礼拝サービス、イベント、放送ワークフロー向けに設計されたフル機能のタイマーソリューションです。Lumen プラットフォームと深く統合し、以下を提供します:

### 主な機能

- **精密タイマーエンジン** — `animejs` ベースのドリフト補正アニメーション。カウントダウン、カウントアップ、マイナス超過モードに対応
- **デュアル出力** — プレゼンター（メディア/歌詞の全画面またはコーナーオーバーレイ）および専用オーバーレイウィンドウに同時にレンダリング
- **ライブスタイルプレビュー** — 設定ダイアログで出力時のタイマー表示をリアルタイムでプレビュー
- **タイムトリガー** — 特定の時刻にアクションを設定: テキスト変更、サウンド再生、キューの進行、スライド操作、Webhook 送信
- **オーディオシステム** — バンドルされた完了/警告音に加え、カスタム音声用の Lumen メディアライブラリ連携
- **キュー連携** — 自動ショー進行制御のための `countdown.wait` トリガープロバイダーとして登録
- **Commander クイックコントロール** — Lumen の Commander パレットからプリセットを起動し、タイマーを直接操作
- **永続化** — Lumen のデータストアを介してセッション間で設定とユーザープリセットを自動保存
- **国際化** — ロケール検出による英語とポルトガル語（pt-BR）対応

### ユースケース

| シナリオ | 使用機能 |
|---|---|
| 礼拝サービスのトランジション | カウントダウン、歌詞上のコーナーモード、キューの自動進行、完了音 |
| ライブイベントのセグメント計時 | カウントアップモード、警告用タイムトリガー、ステージ表示用オーバーレイウィンドウ |
| 放送のコマーシャル休止 | マイナス超過の追跡、Webhook 連携、プレゼンター全画面表示 |
| カンファレンスのセッション管理 | タイマープリセット、クイックホットキー、ヘッダーステータスピル、キュー トリガー |

## できること

- ツールメニューまたは Commander から開く
- `presenter.content` に設定可能なカウントダウンをレンダリング
- プレゼンター出力または専用オーバーレイウィンドウに対応
- アプリのヘッダーにコンパクトな実行中ステータスコントロールを表示
- セッション間でモジュール設定とタイマープリセットを保存

## スクリーンショット

<!-- TODO: 実際のスクリーンショットを追加 -->
| 設定タブ | 外観タブ | アクションタブ |
|---|---|---|
| <img width="321" height="789" alt="image" src="https://github.com/user-attachments/assets/992215b0-7c74-4860-8353-d763f41185c7" /> | <img width="316" height="787" alt="image" src="https://github.com/user-attachments/assets/d34d4e8f-46a9-4307-a6c9-b37e3e7a3c45" /> | <img width="317" height="789" alt="image" src="https://github.com/user-attachments/assets/dca5a985-df1f-4f27-b958-bb0059b577de" /> |

<img width="1322" height="830" alt="image" src="https://github.com/user-attachments/assets/322ce122-56bc-4d37-a535-d94cb8a34dc2" />

## 機能一覧

### 設定
- 分・秒の入力
- クイック調整: `+10s`、`-10s`、`リセット`
- クイック時間プリセット: `5`、`10`、`15`、`30` 分
- 前テキストと後テキスト（ロケールごとの翻訳デフォルト）
- タイマープリセット: 名前付き設定の保存、読み込み、削除
- 開始、一時停止、リセット、+10s、-10s のホットキー録音
- 背景プリセット:
  - `デフォルト`（プロフィール背景）
  - `ダークミニマル`
  - `ライトクリーン`
  - `カスタム`

### 外観
- ローカル/システムフォントの選択
- フォントの太さとサイズ
- タイマーと前/後テキストの色
- 前/後の不透明度
- 背景レイヤーの編集:
  - `ソリッド`
  - `グラデーション`
- グロウ強度
- 数字のアニメーション:
  - `なし`
  - `フリップ`（CSS フリップクロックスタイル）
  - `ブラー`
- オプションのパルス効果（最後の 60 秒）
- オプションのプログレスバー + カラーピッカー
- 表示モード:
  - `全画面`
  - `コーナー`（既存のメディア/歌詞にオーバーレイ）
  - コーナー位置: 上/下 + 左/右

### アクションと動作
- 設定可能な終了アクション付き自動進行トグル
- タイムトリガー: 有効/無効、並べ替え、複製、削除
- トリガータイプ:
  - `テキスト変更`
  - `サウンド再生`（バンドルまたはライブラリ音声）
  - `キューの次へ`
  - `キューの前へ`
  - `次のスライド`
  - `特定のメディアを再生`
- 終了アクションタイプ:
  - `queue.next`
  - `queue.previous`
  - `player.next-slide`
  - `player.play`
  - `change-scene`
  - `open-overlay`
  - `send-webhook`（オプションのカスタムペイロード付き）
- バンドル音声による完了音
- サウンドトリガー用のオプションのライブラリ音声
- 完了時に非表示（マイナス許可時に自動無効）
- マイナス時間を許可（超過。カウントアップと完了時非表示と相互排他）
- カウントアップモード（マイナス許可と相互排他）
- タイマーイベント用の Webhook URL

### 実行時 / 出力
- タイマーエンジンは Zustand ストアから分離された専用クラス（`TimerEngine`）で実行
- プレゼンター表示は ErrorBoundary 保護付きの Tauri イベントで同期
- オーバーレイウィンドウはプレゼンター出力とは独立して開くことが可能
- カウントダウンがアクティブなときはヘッダースロットにコンパクトな実行中タイマーステータスを表示
- キュー トリガープロバイダーは `countdown.wait` として登録

## プロジェクト構造

```
src/
├── main.ts                          # モジュール登録、ホスト連携、永続化
├── store.ts                         # Zustand 状態、設定、API 連携
├── types.ts                         # 共有型定義
├── i18n.ts                          # 翻訳ヘルパー
├── i18n/
│   ├── en.ts                        # 英語の翻訳
│   └── pt-BR.ts                     # ポルトガル語の翻訳
├── lib/
│   ├── timer-engine.ts              # タイマーエンジン（アニメーション、サウンド、イベント）
│   ├── format-time.ts               # 時刻フォーマットユーティリティ
│   ├── display-mode.ts              # コーナー/全画面モードのヘルパー
│   ├── adaptive-text.ts             # 適応テキストの色と影
│   ├── sounds.ts                    # 音声再生、バンドルサウンド管理
│   └── utils.ts                     # cn() ユーティリティ（clsx + tailwind-merge）
├── hooks/
│   ├── useLocalFonts.ts             # システムフォントの列挙
│   └── useContrastColor.ts          # 読みやすい色のコントラスト
└── components/
    ├── CountdownDialog.tsx          # メインダイアログのシェル
    ├── CountdownHeaderStatus.tsx    # コンパクトなヘッダータイマーインジケーター
    ├── CountdownCommanderApp.tsx    # Commander クイックコントロール
    ├── DigitDisplay.tsx             # アニメーション付き数字トランジション
    ├── FlipClockDigit.tsx           # CSS フリップクロック数字コンポーネント
    ├── CircularProgress.tsx         # SVG プログレスリング
    ├── TextCarousel.tsx             # 回転テキストカルーセル
    ├── QueueTriggerConfig.tsx       # キュー待機トリガー設定
    ├── presenter/
    │   ├── CountdownDisplay.tsx     # プレゼンター/オーバーレイのカウントダウンレンダラー
    │   └── ErrorBoundary.tsx        # プレゼンターのクラッシュ保護
    ├── right/
    │   ├── RightPanel.tsx           # プレビューステージパネル
    │   └── CountdownPreview.tsx     # カウントダウンのライブプレビュー
    └── left/
        ├── PanelFooter.tsx          # ダイアログフッター（コントロール、映写）
        ├── TimerSettings.tsx        # プリセット、ホットキー、Webhook 設定
        └── tabs/
            ├── ConfigureTab.tsx     # 時間、テキスト、背景プリセット
            ├── AppearanceTab.tsx    # フォント、色、アニメーション、表示モード
            └── ActionsTab.tsx       # 終了アクション、タイムトリガー、動作
```

## 開発

```bash
pnpm install
pnpm build
pnpm pack
pnpm validate
```

## 補足

- このモジュールは、プレゼンター出力、オーバーレイ制御、ライブラリ検索、キュー操作、背景選択など、Lumen が公開するホスト機能に依存しています。
- プレゼンターウィンドウでは Tailwind CSS が利用できないため、`CountdownDisplay.tsx` と `FlipClockDigit.tsx` はインラインスタイルのみを使用します。
- タイマーエンジンのロジック（`start`、`pause`、`reset`、アニメーション、サウンド、イベント）は Zustand ストアから分離され、`lib/timer-engine.ts` にあります。

## クイックスタート

```bash
# 依存関係のインストール
pnpm install

# 開発（ウォッチモード）
pnpm dev

# 本番ビルド
pnpm build

# 配布用 .lumenpack の作成
pnpm pack

# マニフェストとパッケージの検証
pnpm validate
```

## Lumen へのインストール

1. `pnpm pack` を実行して `com.example.countdown-module-X.Y.Z.lumenpack` を生成
2. Lumen で: **設定 → モジュール → モジュールをインストール** → `.lumenpack` ファイルを選択
3. モジュールを有効にして、**ツール → カウントダウンタイマー** または Commander（`Ctrl+Shift+P` → "Countdown: コントロール"）から開く

## ライセンス

MIT