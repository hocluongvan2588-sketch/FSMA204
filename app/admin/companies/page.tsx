"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/contexts/language-context"
import { Building2, Users } from "lucide-react"

interface Company {
  id: string
  name: string
  tax_id: string
  email: string
  phone: string
  created_at: string
  _count?: {
    facilities: number
    users: number
  }
}

export default function AdminCompaniesPage() {
  const { language } = useLanguage()
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = async () => {
    setIsLoading(true)
    const supabase = createClient()

    try {
      const { data: companiesData } = await supabase
        .from("companies")
        .select("*")
        .order("created_at", { ascending: false })

      if (companiesData) {
        // Load counts for each company
        const companiesWithCounts = await Promise.all(
          companiesData.map(async (company) => {
            const [facilitiesCount, usersCount] = await Promise.all([
              supabase.from("facilities").select("id", { count: "exact", head: true }).eq("company_id", company.id),
              supabase.from("profiles").select("id", { count: "exact", head: true }).eq("company_id", company.id),
            ])

            return {
              ...company,
              _count: {
                facilities: facilitiesCount.count || 0,
                users: usersCount.count || 0,
              },
            }
          }),
        )

        setCompanies(companiesWithCounts)
      }
    } catch (error) {
      console.error("Error loading companies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">{language === "vi" ? "Đang tải..." : "Loading..."}</div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{language === "vi" ? "Quản lý công ty" : "Company Management"}</h1>
          <p className="text-muted-foreground mt-1">
            {language === "vi"
              ? "Xem và quản lý tất cả các công ty trong hệ thống"
              : "View and manage all companies in the system"}
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "vi" ? "Tổng công ty" : "Total Companies"}
            </CardTitle>
            <Building2 className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{companies.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "vi" ? "Tổng cơ sở" : "Total Facilities"}
            </CardTitle>
            <Building2 className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {companies.reduce((sum, c) => sum + (c._count?.facilities || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {language === "vi" ? "Tổng người dùng" : "Total Users"}
            </CardTitle>
            <Users className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{companies.reduce((sum, c) => sum + (c._count?.users || 0), 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Companies Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "vi" ? "Danh sách công ty" : "Company List"}</CardTitle>
          <CardDescription>
            {language === "vi"
              ? `${companies.length} công ty đang hoạt động trong hệ thống`
              : `${companies.length} companies in the system`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {companies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {language === "vi" ? "Chưa có công ty nào" : "No companies yet"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "vi" ? "Tên công ty" : "Company Name"}</TableHead>
                  <TableHead>{language === "vi" ? "Mã số thuế" : "Tax ID"}</TableHead>
                  <TableHead>{language === "vi" ? "Liên hệ" : "Contact"}</TableHead>
                  <TableHead>{language === "vi" ? "Cơ sở" : "Facilities"}</TableHead>
                  <TableHead>{language === "vi" ? "Người dùng" : "Users"}</TableHead>
                  <TableHead>{language === "vi" ? "Ngày tạo" : "Created"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => (
                  <TableRow key={company.id}>
                    <TableCell className="font-medium">{company.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.tax_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{company.email}</div>
                        <div className="text-muted-foreground">{company.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-blue-100 text-blue-700">{company._count?.facilities || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">{company._count?.users || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(company.created_at).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
