# Stage 1: API Design & Planning

So, I'm thinking about how students should get their notifications once they log in. The system needs to be simple but reliable. I've mapped out a few core actions: listing all notifications, grabbing a single one to read the full message, and marking them as read so they don't clutter the inbox.

For the endpoints, I'll go with something like:
- `GET /notifications` - This is the main one. It'll support pagination (using `page` and `limit`) and filtering by type (like `Placement` or `Result`).
- `GET /notifications/:id` - To see the specific details.
- `PATCH /notifications/:id/read` - Just to flip that `isRead` flag.

As for real-time updates, I was considering WebSockets, but honestly, for a notification system where the data mostly flows one way (server to student), **SSE (Server-Sent Events)** feels like a better fit. It's lighter than WebSockets, handles reconnections natively, and is way easier to implement over standard HTTP.

# Stage 2: Figuring Out the Storage

For persistent storage, I'm leaning towards **PostgreSQL**. Since our data is fairly structured (students have notifications, types are limited), a relational DB makes a lot of sense. Plus, I want to make sure that when a student marks a notification as read, it actually stays read (ACD properties!).

Here's a rough schema I have in mind:
- A `students` table for names and emails.
- A `notifications` table with columns like `id`, `student_id`, `type`, `message`, `is_read`, and `created_at`.

As we get more students—like 50,000+—I know things might slow down. I'll definitely need to index the `student_id` and `is_read` columns. If it gets really massive, I'd look into table partitioning by date, maybe keeping only the last 6 months in the active table.

# Stage 3: Fixing the Slow Query

I saw this query earlier:
`SELECT * FROM notifications WHERE studentID = 1042 AND isRead = false ORDER BY createdAt ASC;`

It's definitely performing slowly because, with 5 million notifications, the database is likely doing a full scan for that student ID and then sorting in memory. To fix this, I'd add a composite index on `(studentID, isRead, createdAt)`. Also, I'd change the order to `DESC` because students usually want to see their *newest* notifications first, not the oldest ones from 3 months ago!

Also, a teammate suggested indexing every single column "to be safe." I don't think that's a good idea. Every index we add makes `INSERT` and `UPDATE` operations slower because the DB has to update all those index trees. It's a waste of space and performance.

# Stage 4: Boosting Performance

To take the load off the main DB, I'd suggest two things:
1. **Redis Caching:** We can cache the unread count or the first few notifications for each student in Redis. It's way faster than hitting the disk every page load.
2. **Pagination:** We shouldn't ever send all 500 notifications at once. Fetching 10-20 at a time is plenty.

# Stage 5: Scaling the Bulk Notifications

The original `notify_all` function is a bit of a nightmare for 50,000 students. Running a synchronous loop that calls an external Email API inside a DB transaction is asking for a timeout or a crash. If it fails halfway, we have no idea who got the email and who didn't.

My redesign would use a **Message Queue** (like RabbitMQ or even a simple Redis queue).
1. The main function just saves the notification to the DB and pushes the IDs into the queue.
2. Background workers pick up the jobs and handle the email sending. 
3. This way, if an email fails, we can just retry that specific job without affecting everyone else. 

Decoupling the DB save from the email send is crucial because the DB is fast and reliable, while external APIs are slow and can fail. We don't want a slow API to hang our database.
