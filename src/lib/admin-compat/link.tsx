import type { AnchorHTMLAttributes } from 'react';
import { useRouter } from './navigation';

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; prefetch?: boolean; replace?: boolean; scroll?: boolean };

/** 使用普通連結交給 SvelteKit 導航，保留新分頁及鍵盤操作。 */
export default function Link({ href, prefetch, replace, scroll, onClick, ...props }: Props) {
  const router = useRouter();
  return <a {...props} href={href} data-sveltekit-preload-data={prefetch === false ? 'off' : undefined} data-sveltekit-noscroll={scroll === false || undefined} onClick={event => {
    onClick?.(event);
    if (replace && !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey && (!props.target || props.target === '_self')) {
      event.preventDefault();
      router.replace(href);
    }
  }} />;
}
