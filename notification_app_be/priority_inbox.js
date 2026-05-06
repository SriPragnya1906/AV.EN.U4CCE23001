// Stage 6: Priority Inbox Implementation
// Need to find top 10 most important unread notifications

const API_URL = "http://20.207.122.201/evaluation-service/notifications";

// Weights based on product manager requirement
const getTypeWeight = (type) => {
    if (type === "Placement") return 3;
    if (type === "Result") return 2;
    if (type === "Event") return 1;
    return 0; // fallback
};

// Calculate priority score: weight + recency factor
// Newer notifications should have a slightly higher score to break ties
const calculateScore = (notification) => {
    const weight = getTypeWeight(notification.Type);
    
    // convert timestamp to a unix epoch and normalize it so it acts as a tiebreaker
    // divide by a large number so it doesn't override the primary weight
    const timeValue = new Date(notification.Timestamp).getTime() / 10000000000;
    
    return weight + timeValue;
};

// Helper to keep top N using a simple sort since N is small
// If N was huge, we'd use a Min Heap, but for n=10 array sort is fine
const getTopN = (notifications, n = 10) => {
    // Add scores to all
    const scoredList = notifications.map(notif => {
        return {
            ...notif,
            score: calculateScore(notif)
        };
    });

    // Sort descending by score
    scoredList.sort((a, b) => b.score - a.score);

    return scoredList.slice(0, n);
};

// Main function to fetch and process
async function runPriorityInbox() {
    try {
        console.log("Fetching notifications...");
        // I don't have the auth token, so this fetch will fail with 401 right now.
        // We need to add the auth header once we get it.
        const response = await fetch(API_URL);
        
        let notifications = [];
        
        if (!response.ok) {
            console.log("Fetch failed (probably 401). Using sample data for demonstration.");
            // Sample data from the instructions
            notifications = [
                { "ID": "d146095a-0d86-4a34-9e69-3900a14576bc", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-04-22 17:51:30" },
                { "ID": "b283218f-ea5a-4b7c-93a9-1f2f240d64be", "Type": "Placement", "Message": "CSX Corporation hiring", "Timestamp": "2026-04-22 17:51:18" },
                { "ID": "81589ada-0ad3-4f77-9554-f52fb558e09d", "Type": "Event", "Message": "farewell", "Timestamp": "2026-04-22 17:51:06" },
                { "ID": "0005513a-142b-4bbc-8678-eefec65e1ede", "Type": "Result", "Message": "mid-sem", "Timestamp": "2026-04-22 17:50:54" },
                { "ID": "ea836726-c25e-4f21-a72f-544a6af8a37f", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:50:42" },
                { "ID": "0e3cb427-8fc6-47f7-bb00-be228f6bed2c", "Type": "Result", "Message": "external", "Timestamp": "2026-04-22 17:50:30" },
                { "ID": "e5c4ff20-31bf-4d40-8f02-72fda59e8918", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:50:18" },
                { "ID": "1cfce5ee-ad37-4894-8946-d707627176a5", "Type": "Event", "Message": "tech-fest", "Timestamp": "2026-04-22 17:50:06" },
                { "ID": "cf2885a6-45ac-4ba0-b548-6e9e9d4c52c8", "Type": "Result", "Message": "project-review", "Timestamp": "2026-04-22 17:49:54" },
                { "ID": "8a7412bd-6065-4d09-8501-a37f11cc848b", "Type": "Placement", "Message": "Advanced Micro Devices Inc. hiring", "Timestamp": "2026-04-22 17:49:42" }
            ];
        } else {
            const data = await response.json();
            notifications = data.notifications || [];
        }

        const top10 = getTopN(notifications, 10);
        
        console.log("\n--- PRIORITY INBOX (Top 10) ---");
        top10.forEach((n, i) => {
            console.log(`${i+1}. [${n.Type}] ${n.Message} (Score: ${n.score.toFixed(4)}) - ${n.Timestamp}`);
        });

    } catch (err) {
        console.error("Error processing priority inbox:", err);
    }
}

// execute it
runPriorityInbox();
