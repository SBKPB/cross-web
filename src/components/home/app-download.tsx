import Image from "next/image";

// ⚠️ App 上架後填入連結；留空該按鈕不顯示，兩者皆空則顯示「即將推出」
const APP_STORE_URL = "https://apps.apple.com/tw/app/cross/id6762545417";
const GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.twinhao.cross";

export function AppDownload() {
  const hasAny = Boolean(APP_STORE_URL || GOOGLE_PLAY_URL);

  return (
    <section className="container mx-auto px-4 py-20">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[2rem] bg-secondary/60 p-8 text-center ring-1 ring-foreground/5 sm:p-12">
        <p className="text-sm font-semibold text-primary">行動版</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          把預約放進口袋
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          下載 Cross App，隨時查詢、預約、管理你的看診與療程。
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {APP_STORE_URL && (
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="從 App Store 下載"
              className="transition hover:opacity-80"
            >
              <Image
                src="/badge-app-store.svg"
                alt="下載於 App Store"
                width={109}
                height={40}
                unoptimized
                className="h-12 w-auto"
              />
            </a>
          )}
          {GOOGLE_PLAY_URL && (
            <a
              href={GOOGLE_PLAY_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="從 Google Play 下載"
              className="transition hover:opacity-80"
            >
              <Image
                src="/badge-google-play.png"
                alt="在 Google Play 取得"
                width={646}
                height={250}
                className="h-[58px] w-auto"
              />
            </a>
          )}
          {!hasAny && (
            <p className="text-xs text-muted-foreground">
              App 即將推出，敬請期待
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
