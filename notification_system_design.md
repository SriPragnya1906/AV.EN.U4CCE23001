# Stage 1

## REST API Design & Contract

### Core Actions
1. Fetch notifications (with pagination and filtering)
2. Get details of a single notification
3. Mark a specific notification as read
4. Mark all notifications as read
5. Real-time updates for new notifications

### Base URL
`/api/v1`

### Endpoints

#### 1. Fetch Notifications
- **Method:** GET
- **Endpoint:** `/notifications`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Query Parameters:**
  - `page` (optional, default 1)
  - `limit` (optional, default 10)
  - `type` (optional, enum: Event, Result, Placement)
- **Response (200 OK):**
```json
{
  "notifications": [
    {
      "id": "uuid",
      "type": "Placement",
      "message": "Placement drive tomorrow",
      "isRead": false,
      "createdAt": "2026-05-06T10:00:00Z"
    }
  ],
  "meta": {
    "currentPage": 1,
    "totalPages": 5,
    "totalCount": 50
  }
}
```

#### 2. Get Single Notification
- **Method:** GET
- **Endpoint:** `/notifications/{id}`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "id": "uuid",
  "type": "Placement",
  "message": "Placement drive tomorrow",
  "isRead": false,
  "createdAt": "2026-05-06T10:00:00Z"
}
```

#### 3. Mark Notification as Read
- **Method:** PATCH
- **Endpoint:** `/notifications/{id}/read`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "id": "uuid",
  "isRead": true
}
```

#### 4. Mark All as Read
- **Method:** PATCH
- **Endpoint:** `/notifications/read-all`
- **Headers:**
  - `Authorization: Bearer <token>`
- **Response (200 OK):**
```json
{
  "success": true,
  "updatedCount": 5
}
```

### Real-Time Mechanism

For real-time notifications, I recommend **Server-Sent Events (SSE)**.
- **Why?** Notifications are a unidirectional flow (server to client). WebSockets are bidirectional and add unnecessary overhead for this use case. SSE is natively supported by browsers via the `EventSource` API, works well over standard HTTP/HTTPS, and automatically handles reconnections.

# Stage 2

### Persistent Storage Choice

I suggest using a **Relational Database** like **PostgreSQL**.
- **Reasoning:** The data is structured. Notifications belong to students, and there are clear relationships. We need ACID compliance to ensure data integrity (e.g., when marking notifications as read). PostgreSQL also supports JSONB if we ever need unstructured metadata, providing flexibility.

### DB Schema (SQL)

```sql
CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');

CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL
);

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id INT REFERENCES students(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Scalability Problems & Solutions
- **Problem:** As data volume grows (millions of notifications), basic queries will slow down due to sequential scanning.
- **Solution:** Add indexes on heavily queried columns (e.g., `student_id`, `created_at`).
- **Problem:** The table size becomes too large to fit in memory, slowing down inserts and updates.
- **Solution:** Table partitioning by date (e.g., partitioning `notifications` by month/year) so old notifications can be archived or dropped efficiently.

### Sample Queries

```sql
-- Fetch unread notifications for a student
SELECT * FROM notifications 
WHERE student_id = 101 AND is_read = FALSE 
ORDER BY created_at DESC 
LIMIT 10 OFFSET 0;

-- Mark notification as read
UPDATE notifications 
SET is_read = TRUE 
WHERE id = 'some-uuid' AND student_id = 101;
```

# Stage 3

### Query Analysis

```sql
SELECT * FROM notifications
WHERE studentID = 1042 AND isRead = false
ORDER BY createdAt ASC;
```

- **Is it accurate?** It's functionally accurate, but `ORDER BY createdAt ASC` shows the *oldest* unread notifications first, which is usually poor UX (users want the newest first).
- **Why is it slow?** With 5 million rows, if there's no index covering `(studentID, isRead)`, the DB has to perform a full table scan or index scan on `studentID` and then filter for `isRead=false`, followed by a sort operation on `createdAt`.
- **What to change:**
  1. Change `ASC` to `DESC` to show newest first.
  2. Create a composite index: `CREATE INDEX idx_student_unread_date ON notifications (studentID, isRead, createdAt DESC);`
  3. Avoid `SELECT *`. Only select needed columns to reduce memory overhead.
- **Indexing every column?** This is bad advice. Indexes speed up reads but slow down writes (INSERT/UPDATE/DELETE). They also consume disk space and RAM. Only index columns used frequently in WHERE clauses, JOINs, and ORDER BY.

### Query: Placement notifications in the last 7 days

```sql
SELECT DISTINCT s.id, s.name, s.email
FROM students s
JOIN notifications n ON s.id = n.student_id
WHERE n.type = 'Placement' 
  AND n.created_at >= NOW() - INTERVAL '7 days';
```

# Stage 4

### Performance Improvements for High Load

Fetching notifications on every page load overwhelms the DB.

#### 1. Caching Layer (Redis)
Store the top N unread notifications for active students in Redis (e.g., a Redis List or Sorted Set).
- **Pros:** Blazing fast reads. Reduces DB load significantly.
- **Tradeoffs:** Adds complexity (cache invalidation). If a notification is marked read in DB, the cache must be updated simultaneously (cache staleness).

#### 2. Pagination / Lazy Loading
Don't load all notifications. Load the first 10, then use cursor-based pagination as the user scrolls.
- **Pros:** Reduces data transfer and DB query time.
- **Tradeoffs:** Requires slight changes to API contract to support cursors instead of offset pagination.

#### 3. Connection Pooling (PgBouncer)
If the DB is overwhelmed by connections, use a connection pooler.
- **Pros:** Prevents DB from running out of connections and crashing.
- **Tradeoffs:** Slight overhead per connection.

#### 4. Client-side Caching
Cache the notifications in the browser (e.g., `localStorage` or session storage) and only fetch delta updates.
- **Pros:** Zero DB calls on page navigation.
- **Tradeoffs:** User might see stale data if real-time mechanism fails.

# Stage 5

### Shortcomings of the Pseudocode

```python
function notify_all(student_ids: array, message: string):
    for student_id in student_ids:
        send_email(student_id, message) # calls Email API
        save_to_db(student_id, message) # DB insert
        push_to_app(student_id, message) # SSE push
```

1. **Synchronous Loop:** Processing 50,000 users sequentially will take hours.
2. **No Fault Tolerance:** If `send_email` fails at student 200, the loop might crash, leaving 49,800 students without notifications. There's no retry mechanism.
3. **Tight Coupling:** DB inserts and emails are tied together. If the email API is down, we can't even save the notification to the DB.

### Redesign Approach

Use an asynchronous **Message Queue** (like RabbitMQ or Redis/Celery) with worker nodes.
- Do not process saving to DB and sending email synchronously together. They have different failure rates and latency. Saving to DB is fast; email APIs are slow and prone to rate limits.
- **Solution:** Enqueue a "send_notification" job for each student. Workers pick up jobs independently.

### Revised Pseudocode

```python
function notify_all(student_ids: array, message: string):
    # Fast, batched DB insert (fail fast if DB is down)
    batch_save_to_db(student_ids, message)
    
    # Enqueue jobs to a message broker
    for student_id in student_ids:
        enqueue_job("email_queue", student_id, message)
        enqueue_job("push_queue", student_id, message)

# Worker function (running in background, multiple instances)
function process_email_job(job):
    try:
        send_email(job.student_id, job.message)
    except EmailAPIError:
        if job.retry_count < 3:
            requeue_job_with_delay(job)
        else:
            send_to_dead_letter_queue(job)
```

# Stage 6

### Priority Inbox Approach

To maintain the top 10 most important unread notifications efficiently:
1. **Weighting:** Placement (3), Result (2), Event (1).
2. **Recency:** Newer notifications should rank higher within the same weight class. I'll use timestamp parsing to generate a score.
3. **Data Structure:** A **Min-Heap** (Priority Queue) of size 10 is the most efficient way.
   - When a new notification arrives, if the heap has < 10 items, just insert it.
   - If the heap has 10 items, compare the new notification with the root of the min-heap (the *least* important of the top 10). If it's more important, pop the root and insert the new one.
   - Time Complexity: O(N log k) where N is total notifications and k is 10. Since k=10, it's effectively O(N) to process all, and O(log 10) = O(1) for each new incoming notification.

(See `priority_inbox.js` for the implementation)
