"use client"

import { useEffect, useState } from "react"
import { getNegativeStockTLCs } from "@/lib/utils/calculate-current-stock"

const ComplianceAlertWidget = ({ companyId }) => {
  const [violations, setViolations] = useState([])

  useEffect(() => {
    const checkNegativeStock = async () => {
      try {
        const negativeStockTLCs = await getNegativeStockTLCs(companyId)

        if (negativeStockTLCs.length > 0) {
          // Add to violations
          const negativeViolations = negativeStockTLCs.map((tlc) => ({
            tlc_code: tlc.tlc_code,
            error_type: "negative_stock",
            description: `Tồn kho âm: ${tlc.current_stock.toFixed(2)} kg (Sản xuất: ${tlc.total_production} + Tiếp nhận: ${tlc.total_receiving} - Vận chuyển: ${tlc.total_shipping} - Chế biến: ${tlc.total_transformation_input})`,
            severity: "critical",
            action_url: `/dashboard/traceability/${tlc.tlc_code}/edit`,
          }))

          setViolations((prev) => [...prev, ...negativeViolations])
        }
      } catch (error) {
        console.error("[v0] Error checking negative stock:", error)
      }
    }

    checkNegativeStock()
  }, [companyId])

  // ... rest of component ...
  return (
    <div>
      {violations.map((violation) => (
        <div key={violation.tlc_code}>
          <h3>{violation.tlc_code}</h3>
          <p>{violation.description}</p>
          <p>Severity: {violation.severity}</p>
          <a href={violation.action_url}>Edit</a>
        </div>
      ))}
    </div>
  )
}

export default ComplianceAlertWidget
