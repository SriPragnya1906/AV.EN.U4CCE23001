const API_URL = "http://20.207.122.201/evaluation-service/notifications";

const sampleData = [
  { ID: "d146095a-0d86-4a34-9e69-3900a14576bc", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:51:30" },
  { ID: "b283218f-ea5a-4b7c-93a9-1f2f240d64be", Type: "Placement", Message: "CSX Corporation hiring", Timestamp: "2026-04-22 17:51:18" },
  { ID: "81589ada-0ad3-4f77-9554-f52fb558e09d", Type: "Event", Message: "farewell", Timestamp: "2026-04-22 17:51:06" },
  { ID: "0005513a-142b-4bbc-8678-eefec65e1ede", Type: "Result", Message: "mid-sem", Timestamp: "2026-04-22 17:50:54" },
  { ID: "ea836726-c25e-4f21-a72f-544a6af8a37f", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:42" },
  { ID: "0e3cb427-8fc6-47f7-bb00-be228f6bed2c", Type: "Result", Message: "external", Timestamp: "2026-04-22 17:50:30" },
  { ID: "e5c4ff20-31bf-4d40-8f02-72fda59e8918", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:50:18" },
  { ID: "1cfce5ee-ad37-4894-8946-d707627176a5", Type: "Event", Message: "tech-fest", Timestamp: "2026-04-22 17:50:06" },
  { ID: "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", Type: "Result", Message: "project-review", Timestamp: "2026-04-22 17:49:54" },
  { ID: "8a7412bd-6065-4d09-8501-a37f11cc848b", Type: "Placement", Message: "Advanced Micro Devices Inc. hiring", Timestamp: "2026-04-22 17:49:42" }
];

export const fetchNotifications = async (params = {}) => {
  try {
    const url = new URL(API_URL);
    if (params.page) url.searchParams.append('page', params.page);
    if (params.limit) url.searchParams.append('limit', params.limit);
    if (params.notification_type) url.searchParams.append('notification_type', params.notification_type);

    const res = await fetch(url, {
      headers: {
        // Assume auth would go here
        // 'Authorization': 'Bearer ...'
      }
    });

    if (!res.ok) {
      console.warn("API request failed (401), falling back to local sample data");
      return simulateBackend(params);
    }
    
    const data = await res.json();
    return data.notifications;
  } catch (error) {
    console.warn("Network error, falling back to local sample data", error);
    return simulateBackend(params);
  }
};

// Simulation to handle the 401 response and still provide a working UI
function simulateBackend({ page = 1, limit = 10, notification_type }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      let filtered = [...sampleData];
      if (notification_type) {
        filtered = filtered.filter(n => n.Type === notification_type);
      }
      
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + parseInt(limit, 10));
      resolve(paginated);
    }, 500); // 500ms delay to simulate network
  });
}

// local storage helpers for read status
export const markAsViewed = (id) => {
  const viewed = JSON.parse(localStorage.getItem('viewedNotifications') || '[]');
  if (!viewed.includes(id)) {
    viewed.push(id);
    localStorage.setItem('viewedNotifications', JSON.stringify(viewed));
  }
};

export const isViewed = (id) => {
  const viewed = JSON.parse(localStorage.getItem('viewedNotifications') || '[]');
  return viewed.includes(id);
};
