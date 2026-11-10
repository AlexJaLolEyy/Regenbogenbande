> **Note:** written for an earlier version of the project (before the 2026 audit); details may be outdated. See PROJECT.md for the current overview.

# Prisma Functions Explained - Storage.tsx Guide

This document explains all the Prisma concepts and functions used in `storage.tsx`.

---

## 📚 Table of Contents

1. [Basic Prisma Query Methods](#basic-prisma-query-methods)
2. [The `include` Option (Relations)](#the-include-option-relations)
3. [The `where` Clause (Filtering)](#the-where-clause-filtering)
4. [The `upsert` Operation](#the-upsert-operation)
5. [Transformation Functions](#transformation-functions)
6. [Data Flow Example](#data-flow-example)

---

## 🔍 Basic Prisma Query Methods

### 1. `findMany()` - Get Multiple Records

**What it does:** Fetches all records that match your criteria (or all records if no criteria).

```typescript
const videos = await prisma.video.findMany({
  orderBy: { createdAt: 'desc' }
});
```

**In our code:**
```typescript
// Line 75-92: getAllVideos()
const videos = await prisma.video.findMany({
  include: { /* relations */ },
  orderBy: { createdAt: 'desc' }
});
```

**Returns:** Array of video records
**When to use:** When you need multiple records (lists, grids, etc.)

---

### 2. `findUnique()` - Get One Record by Unique Field

**What it does:** Fetches exactly one record by its unique identifier (usually `id`).

```typescript
const video = await prisma.video.findUnique({
  where: { id: "clx123abc456" }
});
```

**In our code:**
```typescript
// Line 138-159: getVideoById()
const video = await prisma.video.findUnique({
  where: { id: String(id) }, // Convert number to string
  include: { /* relations */ }
});
```

**Returns:** Single video record or `null` if not found
**When to use:** When you need one specific record (detail pages, edit forms)

**Important:** `findUnique()` only works on fields marked with `@unique` or `@id` in your schema.

---

### 3. `create()` - Create New Record

**What it does:** Inserts a new record into the database.

```typescript
const newVideo = await prisma.video.create({
  data: {
    title: "My Video",
    videoUrl: "/videos/video1.mp4",
    // ... other fields
  }
});
```

**In our code:**
```typescript
// Line 273-286: addVideo()
const createdVideo = await prisma.video.create({
  data: {
    id: String(video.id),
    title: video.title,
    description: video.description || null,
    videoUrl: video.video,
    // ... etc
  }
});
```

**Returns:** The created record
**When to use:** When adding new data (upload forms, create actions)

**Note:** If a record with the same unique field exists, it will throw an error. Use `upsert()` if you want to create or update.

---

### 4. `update()` - Update Existing Record

**What it does:** Updates an existing record. You must provide a `where` clause to identify which record to update.

```typescript
const updatedVideo = await prisma.video.update({
  where: { id: "clx123abc456" },
  data: {
    title: "New Title",
    views: 100
  }
});
```

**In our code:**
```typescript
// Line 500-512: editVideo()
await prisma.video.update({
  where: { id: String(updatedVideo.id) },
  data: {
    title: updatedVideo.title,
    description: updatedVideo.description || null,
    // ... etc
  }
});
```

**Returns:** The updated record
**When to use:** When modifying existing data (edit forms, incrementing views)

**Note:** If the record doesn't exist, it throws an error. Use `upsert()` if you're not sure.

---

### 5. `delete()` - Delete Record

**What it does:** Removes a record from the database.

```typescript
await prisma.video.delete({
  where: { id: "clx123abc456" }
});
```

**In our code:**
```typescript
// Line 456-460: deleteVideo()
await prisma.video.delete({
  where: { id: String(videoId) }
});
```

**Returns:** The deleted record
**When to use:** When removing data (delete buttons, cleanup operations)

**Note:** If the record doesn't exist, it throws an error. Also, if you have `onDelete: Cascade` in your schema, related records will be automatically deleted.

---

### 6. `deleteMany()` - Delete Multiple Records

**What it does:** Deletes all records that match your criteria.

```typescript
await prisma.videoParticipant.deleteMany({
  where: { videoId: "clx123abc456" }
});
```

**In our code:**
```typescript
// Line 520-522: editVideo() - Remove old participants
await prisma.videoParticipant.deleteMany({
  where: { videoId: String(updatedVideo.id) }
});
```

**Returns:** Object with `count` property (number of deleted records)
**When to use:** When you need to delete multiple records at once (cleanup, resetting relationships)

---

## 🔗 The `include` Option (Relations)

**What it does:** Tells Prisma to also fetch related data (joins in SQL terms).

### Why We Need It

In your schema, `Video` has relationships:
- `uploadedBy` → User (one-to-many)
- `participants` → VideoParticipant[] (many-to-many via junction table)
- `ratings` → Rating[] (one-to-many)

By default, Prisma only fetches the video data, not the related data. You need `include` to get everything.

### Basic Include

```typescript
const video = await prisma.video.findUnique({
  where: { id: "123" },
  include: {
    uploadedBy: true  // Include the User who uploaded this
  }
});
```

**Result:**
```typescript
{
  id: "123",
  title: "My Video",
  uploadedBy: {  // ← This is included!
    id: "user1",
    username: "Alex"
  }
}
```

### Nested Include (Multiple Levels)

```typescript
const video = await prisma.video.findUnique({
  where: { id: "123" },
  include: {
    uploadedBy: true,
    participants: {  // This is an array (VideoParticipant[])
      include: {
        user: true  // Include the User inside each VideoParticipant
      }
    },
    ratings: {
      include: {
        user: true  // Include the User who gave each rating
      }
    }
  }
});
```

**Result:**
```typescript
{
  id: "123",
  title: "My Video",
  uploadedBy: { id: "user1", username: "Alex" },
  participants: [
    { videoId: "123", userId: "user2", user: { id: "user2", username: "Timo" } },
    { videoId: "123", userId: "user3", user: { id: "user3", username: "Michel" } }
  ],
  ratings: [
    { userId: "user1", value: 5, user: { id: "user1", username: "Alex" } }
  ]
}
```

**In our code:**
```typescript
// Line 75-92: getAllVideos()
const videos = await prisma.video.findMany({
  include: {
    uploadedBy: true,  // Get the uploader user
    participants: {
      include: {
        user: true  // Get the user inside each participant
      }
    },
    ratings: {
      include: {
        user: true  // Get the user who gave each rating
      }
    }
  }
});
```

---

## 🎯 The `where` Clause (Filtering)

**What it does:** Filters which records to fetch/update/delete.

### Basic Where

```typescript
const video = await prisma.video.findUnique({
  where: { id: "123" }
});
```

### Where with Multiple Conditions

```typescript
const videos = await prisma.video.findMany({
  where: {
    views: { gt: 100 },  // views > 100
    title: { contains: "Gaming" }  // title contains "Gaming"
  }
});
```

### Where with Relations

```typescript
const videos = await prisma.video.findMany({
  where: {
    uploadedBy: {
      username: "Alex"  // Videos uploaded by user with username "Alex"
    }
  }
});
```

**In our code:**
```typescript
// Line 138: getVideoById()
const video = await prisma.video.findUnique({
  where: { id: String(id) }  // Filter by ID
});
```

---

## 🔄 The `upsert` Operation

**What it does:** "Update or Insert" - If the record exists, update it. If it doesn't exist, create it.

**Syntax:**
```typescript
const user = await prisma.user.upsert({
  where: { id: "user1" },  // Try to find this
  update: {  // If found, update these fields
    username: "NewUsername"
  },
  create: {  // If not found, create with these fields
    id: "user1",
    username: "NewUsername",
    profilePicture: "/avatar.jpg"
  }
});
```

**In our code:**
```typescript
// Line 250-260: addVideo()
const uploader = await prisma.user.upsert({
  where: { id: String(video.uploadedBy.id) },
  update: {
    username: video.uploadedBy.username,
    profilePicture: video.uploadedBy.profilepicture,
  },
  create: {
    id: String(video.uploadedBy.id),
    username: video.uploadedBy.username,
    password: video.uploadedBy.password,
    profilePicture: video.uploadedBy.profilepicture,
  },
});
```

**Why we use it:** When we're not sure if a user exists. Instead of checking first, we just upsert - it handles both cases!

---

## 🔄 Transformation Functions

**Why we need them:** Prisma returns data in one format, but your TypeScript interfaces expect a different format.

### The Problem

1. **ID Types:** Prisma uses `String` IDs, but your interfaces use `number` IDs
2. **Field Names:** Prisma uses `videoUrl`, but your interface uses `video`
3. **Nested Structure:** Prisma returns `participants: [{ user: {...} }]`, but you need `participants: [User]`

### The Solution

We transform Prisma data to match your interfaces:

```typescript
// Line 32-48: transformVideo()
function transformVideo(prismaVideo: any): Video {
  return {
    id: parseInt(prismaVideo.id) || 0,  // String → number
    title: prismaVideo.title,
    video: prismaVideo.videoUrl,  // videoUrl → video
    thumbnail: prismaVideo.thumbnailUrl,  // thumbnailUrl → thumbnail
    participants: prismaVideo.participants?.map((p: any) => 
      transformUser(p.user)  // Extract user from VideoParticipant
    ) || [],
    uploadedBy: transformUser(prismaVideo.uploadedBy),  // Transform nested user
    metadata: {
      views: prismaVideo.views || 0,
      rating: prismaVideo.ratings?.map((r: any) => 
        transformRating(r)  // Transform each rating
      ) || [],
    },
  };
}
```

**What it does:**
1. Converts String ID to number
2. Maps field names (`videoUrl` → `video`)
3. Flattens nested structures (`participants[].user` → `participants[]`)
4. Transforms nested objects (User, Rating)

---

## 📊 Data Flow Example

Let's trace how data flows from database to your components:

### Step 1: Component Calls Function
```typescript
// In your page component
const videos = await getAllVideos();
```

### Step 2: Prisma Fetches from Database
```typescript
// In storage.tsx
const videos = await prisma.video.findMany({
  include: {
    uploadedBy: true,
    participants: { include: { user: true } },
    ratings: { include: { user: true } }
  }
});
```

**Prisma returns:**
```typescript
[
  {
    id: "1",  // String
    title: "My Video",
    videoUrl: "/videos/video1.mp4",  // Different field name
    uploadedBy: { id: "1", username: "Alex" },
    participants: [
      { videoId: "1", userId: "2", user: { id: "2", username: "Timo" } }
    ],
    ratings: [
      { userId: "1", value: 5, user: { id: "1", username: "Alex" } }
    ]
  }
]
```

### Step 3: Transform to Match Interface
```typescript
return videos.map(transformVideo);
```

**After transformation:**
```typescript
[
  {
    id: 1,  // Number
    title: "My Video",
    video: "/videos/video1.mp4",  // Correct field name
    uploadedBy: { id: 1, username: "Alex" },
    participants: [
      { id: 2, username: "Timo" }  // Flattened structure
    ],
    metadata: {
      views: 0,
      rating: [
        { user: 1, value: 5 }
      ]
    }
  }
]
```

### Step 4: Component Receives Data
```typescript
// Your component gets the data in the format it expects!
<VideoList initialVideos={videos} />
```

---

## 🎓 Key Takeaways

1. **`findMany()`** = Get multiple records (lists)
2. **`findUnique()`** = Get one record by unique field (details)
3. **`create()`** = Insert new record
4. **`update()`** = Modify existing record
5. **`delete()`** = Remove record
6. **`upsert()`** = Create or update (handles both cases)
7. **`include`** = Fetch related data (joins)
8. **`where`** = Filter records
9. **`orderBy`** = Sort results
10. **Transformation** = Convert Prisma format to your interface format

---

## 💡 Common Patterns

### Pattern 1: Get All with Relations
```typescript
const items = await prisma.model.findMany({
  include: { relation: true },
  orderBy: { createdAt: 'desc' }
});
```

### Pattern 2: Get One with Relations
```typescript
const item = await prisma.model.findUnique({
  where: { id: "123" },
  include: { relation: true }
});
```

### Pattern 3: Create with Relations
```typescript
// First create the main record
const main = await prisma.model.create({ data: {...} });

// Then create related records
for (const relation of relations) {
  await prisma.relationModel.create({
    data: {
      mainId: main.id,
      relationId: relation.id
    }
  });
}
```

### Pattern 4: Update Relations (Replace All)
```typescript
// Delete old relations
await prisma.relationModel.deleteMany({
  where: { mainId: main.id }
});

// Create new relations
for (const relation of newRelations) {
  await prisma.relationModel.create({...});
}
```

---

## 🚀 Next Steps

Now that you understand Prisma:
1. Try modifying queries (add filters, change sorting)
2. Experiment with different `include` options
3. Add new query methods for specific use cases
4. Consider adding pagination with `skip` and `take`

Happy coding! 🎉

