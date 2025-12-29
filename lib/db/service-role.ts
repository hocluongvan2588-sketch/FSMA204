import { prisma } from "@/lib/prisma"

export function createServiceRoleClient() {
  return {
    from: (table: string) => ({
      select: async (columns = "*") => {
        const tableName = table as any
        const data = await (prisma[tableName] as any).findMany()
        return { data, error: null }
      },
      insert: async (values: any) => {
        const tableName = table as any
        try {
          const data = await (prisma[tableName] as any).create({ data: values })
          return { data, error: null }
        } catch (error: any) {
          return { data: null, error: error.message }
        }
      },
      update: async (values: any) => ({
        eq: async (column: string, value: any) => {
          const tableName = table as any
          try {
            const data = await (prisma[tableName] as any).update({
              where: { [column]: value },
              data: values,
            })
            return { data, error: null }
          } catch (error: any) {
            return { data: null, error: error.message }
          }
        },
      }),
      delete: () => ({
        eq: async (column: string, value: any) => {
          const tableName = table as any
          try {
            await (prisma[tableName] as any).delete({
              where: { [column]: value },
            })
            return { error: null }
          } catch (error: any) {
            return { error: error.message }
          }
        },
      }),
    }),
    auth: {
      admin: {
        listUsers: async () => {
          const users = await prisma.profiles.findMany()
          return { data: { users }, error: null }
        },
        createUser: async (userData: any) => {
          try {
            const user = await prisma.profiles.create({ data: userData })
            return { data: { user }, error: null }
          } catch (error: any) {
            return { data: null, error: error.message }
          }
        },
        deleteUser: async (id: string) => {
          try {
            await prisma.profiles.delete({ where: { profile_id: id } })
            return { error: null }
          } catch (error: any) {
            return { error: error.message }
          }
        },
      },
    },
  }
}

export function createAdminClient() {
  return createServiceRoleClient()
}
