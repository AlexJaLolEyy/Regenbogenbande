> **Note:** written for an earlier version of the project (before the 2026 audit); details may be outdated. See PROJECT.md for the current overview.

# Prisma Schema - Design Decisions Explained

This document explains **WHY** the schema is designed this way, so you understand the reasoning behind each choice.

---

## 🎯 Overall Design Philosophy

### **Relational vs. JSON Structure**

**Your JSON structure:**
```json
{
  "participants": [User, User, User],  // Array of full objects
  "metadata": {
    "rating": [Rating, Rating]         // Nested array
  }
}
```

**Database structure:**
- Separate tables for each entity
- Junction tables for many-to-many relationships
- Foreign keys to link related data

**Why?**
- ✅ No data duplication (user info stored once)
- ✅ Efficient queries (can index and filter)
- ✅ Data integrity (can't have invalid references)
- ✅ Scalable (works with millions of records)

---

## 📊 Model-by-Model Breakdown

### **1. User Model**

```prisma
model User {
  id            String   @id @default(cuid())
  username      String   @unique
  email         String?  @unique
  password      String?  // Will be removed with Auth.js
  profilePicture   String?
  
  uploadedVideos    Video[]
  uploadedPictures  Picture[]
  // ... relationships
}
```

**Key Decisions:**
- **`String` ID with `cuid()`**: Better than auto-increment numbers for distributed systems
- **`@unique` on username/email**: Prevents duplicates at database level
- **`password` is optional**: Will be removed when Auth.js handles authentication
- **Relationships**: `uploadedVideos Video[]` means "one user has many videos"

---

### **2. Video Model**

```prisma
model Video {
  id          String   @id @default(cuid())
  title       String
  videoUrl    String   // URL, not file stored in DB
  thumbnailUrl String
  
  uploadedById String  // Foreign key
  uploadedBy   User    // Relation to User
  
  participants VideoParticipant[]  // Many-to-many
  ratings      Rating[]
}
```

**Key Decisions:**
- **`videoUrl` instead of storing file**: Videos are 100-200MB, databases aren't for that
- **`uploadedById` + `uploadedBy`**: Foreign key relationship
- **`participants` is a relation**: Not an array, but a separate table
- **`views` stored directly**: Simple counter, no need for separate table

---

### **3. VideoParticipant (Junction Table)**

```prisma
model VideoParticipant {
  videoId String
  video   Video  @relation(...)
  
  userId  String
  user    User   @relation(...)
  
  @@unique([videoId, userId])  // One user per video, once
}
```

**Why a separate table?**
- **Many-to-Many relationship**: One video has many participants, one user can be in many videos
- **Can't store arrays in relational DB**: Need a junction table
- **`@@unique([videoId, userId])`**: Prevents duplicate entries (same user twice in same video)

**Example:**
- Video 1: Alex, Timo, Michel
- Video 2: Alex, Jesse
- Video 3: Timo, Michel

Stored as:
```
VideoParticipant:
- videoId: 1, userId: Alex
- videoId: 1, userId: Timo
- videoId: 1, userId: Michel
- videoId: 2, userId: Alex
- videoId: 2, userId: Jesse
- videoId: 3, userId: Timo
- videoId: 3, userId: Michel
```

---

### **4. Rating Model**

```prisma
model Rating {
  value     Float
  
  userId    String
  user      User   @relation(...)
  
  videoId   String?
  video     Video? @relation(...)
  
  pictureId String?
  picture   Picture? @relation(...)
  
  quoteId   String?
  quote     Quote? @relation(...)
  
  @@unique([userId, videoId])
  @@unique([userId, pictureId])
  @@unique([userId, quoteId])
}
```

**Key Decisions:**
- **Polymorphic relation**: One rating table for videos, pictures, AND quotes
- **Optional foreign keys**: `videoId?` means it's optional (only one will be set)
- **`@@unique` constraints**: One rating per user per item (can't rate twice)

**Alternative approach (not chosen):**
- Separate `VideoRating`, `PictureRating`, `QuoteRating` tables
- More tables, but clearer structure
- We chose single table for simplicity

---

### **5. Quote & QuoteMessage**

```prisma
model Quote {
  messages     QuoteMessage[]  // One-to-many
}

model QuoteMessage {
  message   String
  quoteId   String
  quote     Quote  @relation(...)
  userId    String
  user      User   @relation(...)
}
```

**Why separate QuoteMessage?**
- Your JSON had `fullQuote: [singleQuote, singleQuote]`
- Each message is a separate record
- Can query individual messages
- Can add metadata per message (timestamp, etc.)

**Example:**
Quote 1:
- Message 1: "Hello There!" (by Alex)
- Message 2: "General Kenobi!" (by Timo)

Stored as:
```
Quote: { id: 1, ... }
QuoteMessage: 
  - { quoteId: 1, message: "Hello There!", userId: Alex }
  - { quoteId: 1, message: "General Kenobi!", userId: Timo }
```

---

## 🔗 Relationship Types Explained

### **One-to-Many**
```prisma
model User {
  uploadedVideos Video[]  // One user → Many videos
}

model Video {
  uploadedBy User  // Many videos → One user
}
```
**Translation**: "One user can upload many videos, but each video has one uploader"

### **Many-to-Many**
```prisma
model Video {
  participants VideoParticipant[]
}

model User {
  videoParticipants VideoParticipant[]
}

model VideoParticipant {
  video Video
  user  User
}
```
**Translation**: "Many users can participate in many videos"

### **One-to-Many (with separate table)**
```prisma
model Quote {
  messages QuoteMessage[]
}

model QuoteMessage {
  quote Quote
}
```
**Translation**: "One quote has many messages"

---

## 🎨 Indexes - Why They Matter

```prisma
@@index([uploadedById])
@@index([createdAt])
```

**What are indexes?**
- Like a book index: helps find data faster
- Without index: Database scans every row (slow)
- With index: Database jumps directly to data (fast)

**When to index:**
- ✅ Foreign keys (`uploadedById`) - you'll query "all videos by user X"
- ✅ Sortable fields (`createdAt`) - you'll sort by date
- ✅ Searchable fields (if you add search later)

**Trade-off:**
- Indexes make queries faster
- Indexes make writes slightly slower (must update index)
- Worth it for read-heavy apps

---

## 🔒 Constraints - Data Integrity

### **Unique Constraints**
```prisma
@@unique([videoId, userId])  // VideoParticipant
@@unique([userId, videoId])   // Rating
```

**What they do:**
- Prevents duplicate data
- Example: Can't add Alex as participant to Video 1 twice
- Example: Can't rate Video 1 twice as the same user

### **Required vs. Optional**
```prisma
title       String   // Required - must have a title
description String?  // Optional - can be null
```

**Why?**
- `title` is always needed
- `description` might be empty (user didn't write one)

---

## 🚀 Performance Considerations

### **1. Eager Loading vs. Lazy Loading**

**Eager (include everything):**
```typescript
const video = await prisma.video.findUnique({
  include: {
    uploadedBy: true,
    participants: { include: { user: true } },
    ratings: { include: { user: true } }
  }
})
```
- Gets all data in one query
- Good for: Detail pages where you need everything
- Bad for: Lists where you don't need all data

**Lazy (load on demand):**
```typescript
const video = await prisma.video.findUnique({ where: { id } })
const participants = await prisma.videoParticipant.findMany({
  where: { videoId: id },
  include: { user: true }
})
```
- Multiple queries
- Good for: Only loading what you need
- Bad for: N+1 query problem (many small queries)

### **2. Pagination**
```typescript
const videos = await prisma.video.findMany({
  take: 20,        // Limit to 20
  skip: 0,         // Skip first 0 (page 1)
  orderBy: { createdAt: 'desc' }
})
```

**Why important:**
- Don't load 1000 videos at once
- Load 20, then "Load More" loads next 20

---

## 🔄 Migration Strategy

### **From JSON to Database**

**Step 1: Create Users First**
- Users are referenced by videos/pictures/quotes
- Must exist before creating those

**Step 2: Create Main Records**
- Videos, Pictures, Quotes
- Link to users via `uploadedById`

**Step 3: Create Relations**
- Participants (junction tables)
- Ratings
- QuoteMessages

**Step 4: Verify**
- Count records match
- Spot-check a few records
- Test queries

---

## 🎓 Key Takeaways

1. **Relational databases separate data into tables** - no nested arrays
2. **Junction tables handle many-to-many** - can't store arrays directly
3. **Foreign keys link related data** - `uploadedById` → `User.id`
4. **Indexes make queries fast** - especially for common queries
5. **Constraints prevent bad data** - unique, required, etc.
6. **Files don't go in database** - store URLs, files go in object storage

---

## ❓ Common Questions

**Q: Why not use MongoDB (NoSQL)?**
- MongoDB can store nested arrays directly
- But: Less structured, harder to query relationships
- PostgreSQL + Prisma gives you type safety and relationships

**Q: Can I change `cuid()` to auto-increment numbers?**
- Yes! Change to `@id @default(autoincrement())` and `Int` type
- But `cuid()` is better for distributed systems

**Q: What if I want to add tags/categories later?**
- Create `Tag` model
- Create `VideoTag` junction table (many-to-many)
- Same pattern as participants

**Q: How do I handle soft deletes?**
- Add `deletedAt DateTime?` field
- Filter with `where: { deletedAt: null }`
- Or use a library like `prisma-soft-delete`

---

This schema is designed to be:
- ✅ **Scalable**: Works with thousands of records
- ✅ **Type-safe**: Prisma generates TypeScript types
- ✅ **Flexible**: Easy to add new fields/relations
- ✅ **Performant**: Indexes on common queries
- ✅ **Maintainable**: Clear structure, well-documented

Good luck implementing it! 🚀

