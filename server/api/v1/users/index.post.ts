import { z } from 'zod'

const createUserSchema = z.object({
  email: z.email(),
  name: z.string().min(2),
  role: z.enum(['viewer', 'admin', 'super_admin']).default('viewer'),
  organizationId: z.string().optional()
})

export default defineEventHandler(async (event) => {
  // Ensure the user is a super_admin
  await requireUserSession(event, {
    user: { role: 'super_admin' }
  })

  const body = await readBody(event)
  const validatedBody = await createUserSchema.parseAsync(body)

  const auth = serverAuth(event)

  try {
    // We use admin.createUser to programmatically create the user
    // bypassing self-registration role restrictions.
    const result = await auth.api.createUser({
      body: {
        email: validatedBody.email,
        name: validatedBody.name,
        password: 'kompas2026',
        role: validatedBody.role,
        data: {
          organizationId: validatedBody.organizationId
        }
      }
    })

    if (result.user && validatedBody.organizationId) {
      // Add as member (mandatory for the organization plugin to handle access/roles)
      await auth.api.addMember({
        body: {
          organizationId: validatedBody.organizationId,
          userId: result.user.id,
          role: ['admin', 'super_admin'].includes(validatedBody.role) ? 'admin' : 'member'
        }
      })
    }

    return {
      success: true,
      user: result.user
    }
  } catch (err: unknown) {
    const error = err as { status?: number, message?: string }
    throw createError({
      statusCode: error.status || 500,
      statusMessage: error.message || 'Failed to create user'
    })
  }
})
