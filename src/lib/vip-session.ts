export function formatCheckInTime(timestamp: number) {
  const date = new Date(timestamp);
  const day = new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
  const time = new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return `${day} kl: ${time}`;
}
