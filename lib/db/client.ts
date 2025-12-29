import { prisma } from "@/lib/prisma"
import { getSession } from "@/lib/simple-auth"

export async function createClient() {
  const session = await getSession()

  return {
    from: (table: string) => ({
      select: async (columns = "*") => {
        const tableName = table as any
        const data = await (prisma[tableName] as any).findMany({
          where: session?.company_id ? { company_id: session.company_id } : {},
        })
        return { data, error: null }
      },
      insert: async (values: any) => {
        const tableName = table as any
        try {
          const data = await (prisma[tableName] as any).create({
            data: { ...values, company_id: session?.company_id },
          })
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
              where: { [column]: value, company_id: session?.company_id },
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
              where: { [column]: value, company_id: session?.company_id },
            })
            return { error: null }
          } catch (error: any) {
            return { error: error.message }
          }
        },
      }),
    }),
    auth: {
      getSession: async () => {
        const user = await getSession()
        return { data: { session: user ? { user } : null }, error: null }
      },
      signOut: async () => {
        const { destroySession } = await import("@/lib/simple-auth")
        await destroySession()
        return { error: null }
      },
    },
  }
}
