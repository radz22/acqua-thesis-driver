export function formatWhen(timestamp: number) {
  return new Date(timestamp).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
