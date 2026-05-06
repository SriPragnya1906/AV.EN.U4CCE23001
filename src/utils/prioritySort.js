export const getTypeWeight = (type) => {
  if (type === "Placement") return 3;
  if (type === "Result") return 2;
  if (type === "Event") return 1;
  return 0;
};

export const calculateScore = (notification) => {
  const weight = getTypeWeight(notification.Type);
  const timeValue = new Date(notification.Timestamp).getTime() / 10000000000;
  return weight + timeValue;
};

export const getTopN = (notifications, n = 10) => {
  const scoredList = notifications.map(notif => ({
      ...notif,
      score: calculateScore(notif)
  }));

  scoredList.sort((a, b) => b.score - a.score);

  return scoredList.slice(0, n);
};
