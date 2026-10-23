/** 將新錯誤捲入所在表單的可視範圍，保留表單輸入。 */
export function revealError(node: HTMLElement, message: string) {
 let frame = 0;
 const reveal = (value: string) => {
  cancelAnimationFrame(frame);
  if (value) frame = requestAnimationFrame(() => {
   node.scrollIntoView({ block: 'nearest' });
   node.focus({ preventScroll: true });
  });
 };
 reveal(message);
 return { update: reveal, destroy() { cancelAnimationFrame(frame); } };
}
