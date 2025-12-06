/**
 * Migration Script: Videos
 * 
 * This script migrates video data from JSON files to PostgreSQL database using Prisma.
 * 
 * Usage:
 *   bun run scripts/migrate-videos.ts
 *   or
 *   npx tsx scripts/migrate-videos.ts
 * 
 * What it does:
 * 1. Reads videos from JSON file
 * 2. Creates/updates users (uploader + participants)
 * 3. Creates video records
 * 4. Creates participant relationships (junction table)
 * 5. Creates ratings
 */

import { PrismaClient } from '@prisma/client'
import videosData from '../src/app/current-storage/data/videos.json'

// Initialize Prisma Client
const prisma = new PrismaClient()

// Type definition matching your JSON structure
interface VideoJson {
  id: number
  title: string
  description?: string
  video: string
  thumbnail: string
  participants: Array<{
    id: number
    username: string
    password: string
    profilepicture: string
  }>
  uploadedBy: {
    id: number
    username: string
    password: string
    profilepicture: string
  }
  uploadedAt: string // ISO date string
  createdAt: string // ISO date string
  metadata: {
    views: number
    rating: Array<{
      user: number // user ID
      value: number // rating value
    }>
  }
}

/**
 * Helper function to create or update a user
 * Uses upsert to avoid duplicates (creates if doesn't exist, updates if exists)
 */
async function ensureUser(userData: {
  id: number
  username: string
  password: string
  profilepicture: string
}) {
  // Convert numeric ID to string (Prisma uses String IDs with cuid())
  const userId = String(userData.id)

  // Upsert: Update if exists, create if doesn't
  const user = await prisma.user.upsert({
    where: { id: userId },
    update: {
      // Update these fields if user already exists
      username: userData.username,
      profilePicture: userData.profilepicture,
      // Note: We're keeping the password from JSON for now (will be removed with Auth.js)
    },
    create: {
      id: userId,
      username: userData.username,
      password: userData.password, // Temporary - will be removed with Auth.js
      profilePicture: userData.profilepicture,
    },
  })

  return user
}

/**
 * Main migration function for a single video
 */
async function migrateVideo(video: VideoJson) {
  try {
    console.log(`\n📹 Migrating video: "${video.title}" (ID: ${video.id})`)

    // Step 1: Ensure uploader exists
    console.log(`  → Creating/updating uploader: ${video.uploadedBy.username}`)
    const uploader = await ensureUser(video.uploadedBy)

    // Step 2: Create the video record
    // Convert numeric ID to string for Prisma
    const videoId = String(video.id)

    console.log(`  → Creating video record...`)
    const createdVideo = await prisma.video.create({
      data: {
        id: videoId,
        title: video.title,
        description: video.description || null, // Handle optional description
        videoUrl: video.video, // Path to video file
        thumbnailUrl: video.thumbnail, // Path to thumbnail
        uploadedById: uploader.id, // Foreign key to User
        uploadedAt: new Date(video.uploadedAt), // Convert ISO string to Date
        createdAt: new Date(video.createdAt), // Original creation date from metadata
        views: video.metadata.views || 0, // Default to 0 if not provided
      },
    })

    console.log(`  ✅ Video created with ID: ${createdVideo.id}`)

    // Step 3: Create participant relationships
    console.log(`  → Creating ${video.participants.length} participant(s)...`)
    for (const participantData of video.participants) {
      // Ensure participant user exists
      const participantUser = await ensureUser(participantData)

      // Create participant relationship (junction table)
      await prisma.videoParticipant.create({
        data: {
          videoId: createdVideo.id,
          userId: participantUser.id,
        },
      })

      console.log(`    ✓ Added participant: ${participantUser.username}`)
    }

    // Step 4: Create ratings
    if (video.metadata.rating && video.metadata.rating.length > 0) {
      console.log(`  → Creating ${video.metadata.rating.length} rating(s)...`)
      for (const ratingData of video.metadata.rating) {
        // Ensure rating user exists (might not be a participant)
        // We need to get the user - check if they exist, if not, we'll need to handle it
        const ratingUserId = String(ratingData.user)

        // Check if user exists, if not, create a placeholder
        // (In real scenario, all users should exist, but we handle edge cases)
        let ratingUser
        try {
          ratingUser = await prisma.user.findUnique({
            where: { id: ratingUserId },
          })

          // If user doesn't exist, create a minimal user record
          if (!ratingUser) {
            console.log(`    ⚠️  Rating user ID ${ratingUserId} doesn't exist, creating placeholder...`)
            ratingUser = await prisma.user.create({
              data: {
                id: ratingUserId,
                username: `User_${ratingUserId}`, // Placeholder username
                profilePicture: null,
              },
            })
          }
        } catch (error) {
          console.error(`    ❌ Error handling rating user ${ratingUserId}:`, error)
          continue // Skip this rating if we can't create/find the user
        }

        // Create rating
        await prisma.rating.create({
          data: {
            userId: ratingUser.id,
            videoId: createdVideo.id,
            value: ratingData.value,
          },
        })

        console.log(`    ✓ Added rating: ${ratingData.value} by ${ratingUser.username}`)
      }
    }

    console.log(`  ✅ Successfully migrated video: "${video.title}"`)
    return createdVideo
  } catch (error) {
    console.error(`  ❌ Error migrating video "${video.title}":`, error)
    throw error // Re-throw to stop migration if needed, or remove to continue
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting video migration...')
  console.log(`📊 Found ${videosData.length} videos to migrate\n`)

  let successCount = 0
  let errorCount = 0

  // Migrate each video
  for (const video of videosData as VideoJson[]) {
    try {
      await migrateVideo(video)
      successCount++
    } catch (error) {
      errorCount++
      console.error(`Failed to migrate video ID ${video.id}:`, error)
      // Continue with next video even if one fails
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log(`  ✅ Successfully migrated: ${successCount} videos`)
  console.log(`  ❌ Failed: ${errorCount} videos`)
  console.log(`  📦 Total: ${videosData.length} videos`)
  console.log('='.repeat(50))
}

// Run the migration
main()
  .catch((error) => {
    console.error('💥 Fatal error during migration:', error)
    process.exit(1)
  })
  .finally(async () => {
    // Always disconnect Prisma Client
    await prisma.$disconnect()
    console.log('\n👋 Disconnected from database')
  })

