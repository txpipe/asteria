export function reduceString(str: string, start = 10, end = 10): string {
  if (str.length <= start + end) {
    return str;
  }
  return `${str.slice(0, start)}...${str.slice(-end)}`;
}
