import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { anonymous } from "better-auth/plugins"
import { prisma } from "./prisma"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  // Use database sessions for better security and revocation
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minute cache
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // Update session every 24 hours
  },

  // Discord OAuth as the sole provider
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
    },
  },

  // Enable anonymous guest sessions
  plugins: [
    anonymous({
      emailDomainName: "guest.regenbogenbande.local",
    }),
  ],

  // Expose custom user fields in session
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "member", // Only invited users get DB records
        input: false, // Cannot be set by user during registration
      },
      discordId: {
        type: "string",
        required: false,
        input: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "INVITED",
        input: false,
      },
      isAnonymous: {
        type: "boolean",
        required: false,
        defaultValue: false,
        input: false,
      },
    },
  },

  // Invite-only enforcement via database hooks
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Anonymous users bypass invite check and don't get stored with a role
          // (guest is runtime-only, determined by isAnonymous flag)
          if (user.email?.endsWith("@guest.regenbogenbande.local")) {
            return {
              data: {
                ...user,
                isAnonymous: true,
              },
            }
          }

          // For OAuth users, check if they're invited
          // The Discord ID comes from the account, not directly on user creation
          // We'll handle this in the account creation hook instead
          return { data: user }
        },
      },
    },
    account: {
      create: {
        before: async (account) => {
          // Only check invites for Discord accounts
          if (account.providerId !== "discord") {
            return { data: account }
          }

          const discordId = account.accountId

          // Check if this Discord user is invited
          const invite = await prisma.invite.findUnique({
            where: { discordId },
          })

          if (!invite) {
            throw new Error("NOT_INVITED")
          }

          // Update the user with the invited role and discordId
          await prisma.user.update({
            where: { id: account.userId },
            data: {
              role: invite.role,
              discordId: discordId,
              status: "ACTIVE",
            },
          })

          // Mark the invite as used
          if (!invite.usedAt) {
            await prisma.invite.update({
              where: { id: invite.id },
              data: { usedAt: new Date() },
            })
          }

          // Claim any placeholders with matching discordId
          await prisma.participantPlaceholder.updateMany({
            where: {
              discordId: discordId,
              claimedById: null,
            },
            data: {
              claimedById: account.userId,
            },
          })

          return { data: account }
        },
      },
    },
  },

  // Base URL for callbacks
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",

  // Secret for signing tokens
  secret: process.env.BETTER_AUTH_SECRET,
})

// Export type for session
export type Session = typeof auth.$Infer.Session
export type User = typeof auth.$Infer.Session.user
