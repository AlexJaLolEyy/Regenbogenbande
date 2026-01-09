export function debounce<T extends (...args: unknown[]) => void>(func: T, delay: number) {
  let timeout: NodeJS.Timeout;

  return function(this: ThisParameterType<T>, ...args: Parameters<T>) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
}
