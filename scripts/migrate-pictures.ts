/**
 * Migration Script: Pictures
 * 
 * This script migrates picture data from JSON files to PostgreSQL database using Prisma.
 * 
 * Usage:
 *   bun run scripts/migrate-pictures.ts
 *   or
 *   npx tsx scripts/migrate-pictures.ts
 * 
 * What it does:
 * 1. Reads pictures from JSON file
 * 2. Creates/updates users (uploader + participants)
 * 3. Creates picture records
 * 4. Creates participant relationships (junction table)
 * 5. Creates ratings
 */

import { PrismaClient } from '@prisma/client'
import picturesData from '../src/app/current-storage/data/pictures.json'

// Initialize Prisma Client
const prisma = new PrismaClient()

interface PictureJson {
    id: number
    title: string
    description?: string
    img: string
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
    uploadedAt: string
    createdAt: string 
    metadata: {
        views: number
        rating: Array<{
          user: number
          value: number
        }>
      }
}


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
 * Main migration function for a single picture
 */
async function migratePicture(picture: PictureJson) {
  try {
    console.log(`\n🖼️  Migrating picture: "${picture.title}" (ID: ${picture.id})`)

    // Step 1: Ensure uploader exists
    console.log(`  → Creating/updating uploader: ${picture.uploadedBy.username}`)
    const uploader = await ensureUser(picture.uploadedBy)

    // Step 2: Create the picture record
    // Convert numeric ID to string for Prisma
    const pictureId = String(picture.id)

    console.log(`  → Creating picture record...`)
    const createdPicture = await prisma.picture.create({
      data: {
        id: pictureId,
        title: picture.title,
        description: picture.description || null, // Handle optional description
        imageUrl: picture.img, // Path to picture file
        uploadedById: uploader.id, // Foreign key to User
        uploadedAt: new Date(picture.uploadedAt), // Convert ISO string to Date
        createdAt: new Date(picture.createdAt), // Original creation date from metadata
        views: picture.metadata.views || 0, // Default to 0 if not provided
      },
    })

    console.log(`  ✅ Picture created with ID: ${createdPicture.id}`)

    // Step 3: Create participant relationships
    console.log(`  → Creating ${picture.participants.length} participant(s)...`)
    for (const participantData of picture.participants) {
      // Ensure participant user exists
      const participantUser = await ensureUser(participantData)

      // Create participant relationship (junction table)
      await prisma.pictureParticipant.create({
        data: {
          pictureId: createdPicture.id,
          userId: participantUser.id,
        },
      })

      console.log(`    ✓ Added participant: ${participantUser.username}`)
    }

    // Step 4: Create ratings
    if (picture.metadata.rating && picture.metadata.rating.length > 0) {
      console.log(`  → Creating ${picture.metadata.rating.length} rating(s)...`)
      for (const ratingData of picture.metadata.rating) {
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
            pictureId: createdPicture.id,
            value: ratingData.value,
          },
        })

        console.log(`    ✓ Added rating: ${ratingData.value} by ${ratingUser.username}`)
      }
    }

    console.log(`  ✅ Successfully migrated picture: "${picture.title}"`)
    return createdPicture
  } catch (error) {
    console.error(`  ❌ Error migrating picture "${picture.title}":`, error)
    throw error // Re-throw to stop migration if needed, or remove to continue
  }
}


/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting picture migration...')
  console.log(`📊 Found ${picturesData.length} pictures to migrate\n`)

  let successCount = 0
  let errorCount = 0

  // Migrate each picture
  for (const picture of picturesData as PictureJson[]) {
    try {
      await migratePicture(picture)
      successCount++
    } catch (error) {
      errorCount++
      console.error(`Failed to migrate picture ID ${picture.id}:`, error)
      // Continue with next picture even if one fails
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 Migration Summary:')
  console.log(`  ✅ Successfully migrated: ${successCount} pictures`)
  console.log(`  ❌ Failed: ${errorCount} pictures`)
  console.log(`  📦 Total: ${picturesData.length} pictures`)
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
