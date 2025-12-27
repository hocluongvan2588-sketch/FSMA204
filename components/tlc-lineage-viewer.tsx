"use client"

import { useEffect, useState } from "react"
import {
  getTLCParents,
  getTLCChildren,
  getTLCFullAncestry,
  getTLCFullDescendants,
  type TLCParent,
  type TLCChild,
  type TLCLineageNode,
} from "@/lib/utils/tlc-lineage-manager"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowRight, ArrowLeft, ArrowDown, ArrowUp } from "lucide-react"

interface TLCLineageViewerProps {
  tlcId: string
  tlcCode: string
}

export function TLCLineageViewer({ tlcId, tlcCode }: TLCLineageViewerProps) {
  const [parents, setParents] = useState<TLCParent[]>([])
  const [children, setChildren] = useState<TLCChild[]>([])
  const [ancestry, setAncestry] = useState<TLCLineageNode[]>([])
  const [descendants, setDescendants] = useState<TLCLineageNode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("parents")

  useEffect(() => {
    const loadLineageData = async () => {
      setIsLoading(true)
      try {
        const [parentsData, childrenData, ancestryData, descendantsData] = await Promise.all([
          getTLCParents(tlcId),
          getTLCChildren(tlcId),
          getTLCFullAncestry(tlcId),
          getTLCFullDescendants(tlcId),
        ])

        setParents(parentsData)
        setChildren(childrenData)
        setAncestry(ancestryData)
        setDescendants(descendantsData)
      } catch (error) {
        console.error("[v0] Error loading lineage data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadLineageData()
  }, [tlcId])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="parents" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Parents</span>
        </TabsTrigger>
        <TabsTrigger value="children" className="flex items-center gap-2">
          <ArrowRight className="h-4 w-4" />
          <span className="hidden sm:inline">Children</span>
        </TabsTrigger>
        <TabsTrigger value="ancestry" className="flex items-center gap-2">
          <ArrowUp className="h-4 w-4" />
          <span className="hidden sm:inline">Ancestry</span>
        </TabsTrigger>
        <TabsTrigger value="descendants" className="flex items-center gap-2">
          <ArrowDown className="h-4 w-4" />
          <span className="hidden sm:inline">Descendants</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="parents" className="space-y-3 mt-4">
        {parents.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Đây là lô hàng gốc - không có lô cha</p>
          </div>
        ) : (
          <div className="space-y-3">
            {parents.map((parent, idx) => (
              <Card key={idx} className="border-l-4 border-blue-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-blue-50">
                          Lô Cha
                        </Badge>
                        <span className="font-mono font-semibold text-sm">{parent.parent_tlc_code}</span>
                      </div>
                      <p className="text-sm text-slate-600">{parent.product_name}</p>
                      <p className="text-xs text-slate-500">{parent.facility_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Yield Ratio</p>
                      <p className="font-mono font-semibold">{(parent.yield_ratio * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Đầu vào</p>
                      <p className="font-medium">{parent.quantity_input}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Đầu ra</p>
                      <p className="font-medium">{parent.quantity_output}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Chế biến lúc</p>
                      <p className="text-xs font-medium">
                        {new Date(parent.transformation_date).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="children" className="space-y-3 mt-4">
        {children.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Lô này chưa được chế biến thành sản phẩm khác</p>
          </div>
        ) : (
          <div className="space-y-3">
            {children.map((child, idx) => (
              <Card key={idx} className="border-l-4 border-green-500">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="bg-green-50">
                          Lô Con
                        </Badge>
                        <span className="font-mono font-semibold text-sm">{child.child_tlc_code}</span>
                      </div>
                      <p className="text-sm text-slate-600">{child.product_name}</p>
                      <p className="text-xs text-slate-500">{child.facility_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500">Yield Ratio</p>
                      <p className="font-mono font-semibold">{(child.yield_ratio * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Đầu vào</p>
                      <p className="font-medium">{child.quantity_input}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Đầu ra</p>
                      <p className="font-medium">{child.quantity_output}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-slate-500">Chế biến lúc</p>
                      <p className="text-xs font-medium">
                        {new Date(child.transformation_date).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="ancestry" className="mt-4">
        {ancestry.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Không có dữ liệu tổ tiên</p>
          </div>
        ) : (
          <div className="space-y-2">
            {ancestry.map((node, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-blue-700">{node.depth}</span>
                </div>
                <Card className="flex-1">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-semibold text-sm">{node.tlc_code}</p>
                        <p className="text-xs text-slate-500">{node.product_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{node.quantity}</p>
                        <p className="text-xs text-slate-500">{node.path}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="descendants" className="mt-4">
        {descendants.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <p>Không có dữ liệu con cháu</p>
          </div>
        ) : (
          <div className="space-y-2">
            {descendants.map((node, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-green-700">{node.depth}</span>
                </div>
                <Card className="flex-1">
                  <CardContent className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-mono font-semibold text-sm">{node.tlc_code}</p>
                        <p className="text-xs text-slate-500">{node.product_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm">{node.quantity}</p>
                        <p className="text-xs text-slate-500">{node.path}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
