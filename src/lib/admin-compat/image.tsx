import type { ImgHTMLAttributes } from 'react';

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string; fill?: boolean; priority?: boolean; unoptimized?: boolean; quality?: number };

export default function Image({ fill, priority, unoptimized, quality, style, alt, ...props }: Props) {
  // 相容原有呼叫介面，圖片由原始網址提供，不經 Next 圖片服務。
  void unoptimized;
  void quality;
  return <img {...props} alt={alt ?? ''} loading={priority ? 'eager' : props.loading ?? 'lazy'} style={fill ? { position: 'absolute', inset: 0, width: '100%', height: '100%', ...style } : style} />;
}
