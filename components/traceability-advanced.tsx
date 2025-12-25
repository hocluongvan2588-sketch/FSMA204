"use client"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface TraceabilityAdvancedProps {
  tlc: string
  forwardData: any
  backwardData: any
}

export function TraceabilityAdvanced({ tlc, forwardData, backwardData }: TraceabilityAdvancedProps) {
  return (
    <Tabs defaultValue="forward" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="forward">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          Truy xuất xuôi
        </TabsTrigger>
        <TabsTrigger value="backward">
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
          </svg>
          Truy xuất ngược
        </TabsTrigger>
      </TabsList>

      <TabsContent value="forward" className="space-y-4 mt-4">
        {forwardData ? (
          <div className="space-y-4">
            {/* Origin Lot */}
            <div className="border-l-4 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  Nguồn gốc
                </Badge>
                <span className="font-mono font-semibold">{forwardData.origin.tlc}</span>
              </div>
              <p className="text-sm text-slate-600">{forwardData.origin.product_name}</p>
              <p className="text-xs text-slate-500">
                {forwardData.origin.facility_name} •{" "}
                {new Date(forwardData.origin.production_date).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {forwardData.origin.quantity} {forwardData.origin.unit}
              </p>
            </div>

            {/* Transformation Inputs */}
            {forwardData.transformation_inputs && forwardData.transformation_inputs.length > 0 && (
              <div className="ml-8 space-y-3">
                <p className="text-sm font-medium text-slate-700">Nguyên liệu đầu vào:</p>
                {forwardData.transformation_inputs.map((input: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 bg-slate-50">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-sm">{input.input_tlc}</span>
                      <span className="text-sm text-slate-600">
                        {input.quantity_used} {input.unit}
                      </span>
                    </div>
                    {input.waste_percentage > 0 && (
                      <p className="text-xs text-slate-500 mt-1">Hao hụt: {input.waste_percentage}%</p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CTE Chain */}
            {forwardData.cte_chain && forwardData.cte_chain.length > 0 && (
              <div className="ml-8 space-y-3">
                <p className="text-sm font-medium text-slate-700">Chuỗi sự kiện CTE:</p>
                {forwardData.cte_chain.map((cte: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-teal-700">{idx + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="secondary" className="capitalize">
                          {cte.event_type === "harvest"
                            ? "Thu hoạch"
                            : cte.event_type === "cooling"
                              ? "Làm lạnh"
                              : cte.event_type === "packing"
                                ? "Đóng gói"
                                : cte.event_type === "receiving"
                                  ? "Tiếp nhận"
                                  : cte.event_type === "transformation"
                                    ? "Chế biến"
                                    : "Vận chuyển"}
                        </Badge>
                        <span className="text-sm text-slate-500">
                          {new Date(cte.event_date).toLocaleDateString("vi-VN")}
                        </span>
                      </div>
                      <p className="text-sm font-medium">{cte.facility_name}</p>
                      {cte.description && <p className="text-xs text-slate-500 mt-1">{cte.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Downstream Products */}
            {forwardData.downstream_products && forwardData.downstream_products.length > 0 && (
              <div className="ml-8 space-y-3">
                <p className="text-sm font-medium text-slate-700">Sản phẩm đầu ra:</p>
                {forwardData.downstream_products.map((product: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-green-500 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-green-50 text-green-700 border-green-200">Sản phẩm</Badge>
                      <span className="font-mono text-sm font-semibold">{product.output_tlc}</span>
                    </div>
                    <p className="text-sm text-slate-600">{product.product_name}</p>
                    <p className="text-xs text-slate-500">
                      {product.quantity} {product.unit}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Shipments */}
            {forwardData.shipments && forwardData.shipments.length > 0 && (
              <div className="ml-8 space-y-3">
                <p className="text-sm font-medium text-slate-700">Vận chuyển:</p>
                {forwardData.shipments.map((shipment: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 bg-indigo-50">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm">{shipment.shipment_number}</span>
                      <Badge variant={shipment.status === "delivered" ? "default" : "secondary"}>
                        {shipment.status === "delivered"
                          ? "Đã giao"
                          : shipment.status === "in_transit"
                            ? "Đang vận chuyển"
                            : "Chờ xử lý"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">{shipment.from_facility}</span>
                      <svg className="h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 8l4 4m0 0l-4 4m4-4H3"
                        />
                      </svg>
                      <span className="text-slate-600">{shipment.to_facility}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(shipment.shipment_date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>Không có dữ liệu truy xuất xuôi</p>
          </div>
        )}
      </TabsContent>

      <TabsContent value="backward" className="space-y-4 mt-4">
        {backwardData ? (
          <div className="space-y-4">
            {/* Current Lot */}
            <div className="border-l-4 border-indigo-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                  Điểm hiện tại
                </Badge>
                <span className="font-mono font-semibold">{backwardData.current.tlc}</span>
              </div>
              <p className="text-sm text-slate-600">{backwardData.current.product_name}</p>
              <p className="text-xs text-slate-500">
                {backwardData.current.facility_name} •{" "}
                {new Date(backwardData.current.production_date).toLocaleDateString("vi-VN")}
              </p>
            </div>

            {/* Reference Documents */}
            {backwardData.reference_documents && backwardData.reference_documents.length > 0 && (
              <div className="ml-8 space-y-3">
                <p className="text-sm font-medium text-slate-700">Tài liệu tham chiếu:</p>
                {backwardData.reference_documents.map((doc: any, idx: number) => (
                  <div key={idx} className="border rounded-lg p-3 bg-amber-50">
                    <div className="flex items-center justify-between mb-1">
                      <Badge variant="outline" className="capitalize">
                        {doc.document_type === "invoice"
                          ? "Hóa đơn"
                          : doc.document_type === "bol"
                            ? "Vận đơn"
                            : doc.document_type === "packing_slip"
                              ? "Phiếu đóng gói"
                              : "Giấy tờ"}
                      </Badge>
                      <span className="font-mono text-sm">{doc.document_number}</span>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(doc.issue_date).toLocaleDateString("vi-VN")}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Source Lots */}
            {backwardData.source_lots && backwardData.source_lots.length > 0 && (
              <div className="ml-8 space-y-3">
                <p className="text-sm font-medium text-slate-700">Nguồn gốc:</p>
                {backwardData.source_lots.map((source: any, idx: number) => (
                  <div key={idx} className="border-l-4 border-orange-500 pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-orange-50 text-orange-700 border-orange-200">Nguồn</Badge>
                      <span className="font-mono text-sm font-semibold">{source.source_tlc}</span>
                    </div>
                    <p className="text-sm text-slate-600">{source.source_facility}</p>
                    <p className="text-xs text-slate-500">
                      {source.source_location} • {new Date(source.received_date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Upstream Chain */}
            {backwardData.upstream_chain && backwardData.upstream_chain.length > 0 && (
              <div className="ml-8 space-y-3">
                <p className="text-sm font-medium text-slate-700">Chuỗi ngược:</p>
                {backwardData.upstream_chain.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-start gap-3">
                    <div className="mt-1 h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                      <span className="text-xs font-semibold text-purple-700">{idx + 1}</span>
                    </div>
                    <div className="flex-1 border rounded-lg p-3 bg-purple-50">
                      <span className="font-mono text-sm font-semibold">{item.tlc}</span>
                      <p className="text-sm text-slate-600 mt-1">{item.facility_name}</p>
                      <p className="text-xs text-slate-500">{new Date(item.date).toLocaleDateString("vi-VN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            <p>Không có dữ liệu truy xuất ngược</p>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
