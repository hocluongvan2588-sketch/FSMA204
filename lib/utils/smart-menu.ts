import { create } from "zustand"

interface SmartMenuStore {
  highlightedItems: string[]
  setHighlighted: (items: string[]) => void
  clearHighlights: () => void
  addHighlight: (item: string) => void
  removeHighlight: (item: string) => void
}

export const useSmartMenu = create<SmartMenuStore>((set) => ({
  highlightedItems: [],
  setHighlighted: (items) => set({ highlightedItems: items }),
  clearHighlights: () => set({ highlightedItems: [] }),
  addHighlight: (item) =>
    set((state) => ({
      highlightedItems: [...state.highlightedItems, item],
    })),
  removeHighlight: (item) =>
    set((state) => ({
      highlightedItems: state.highlightedItems.filter((i) => i !== item),
    })),
}))

export function getMenuItemsByRole(role: string) {
  const baseItems = [
    { id: "dashboard", label: "Tổng quan", href: "/dashboard", roles: ["all"] },
    { id: "notifications", label: "Thông báo", href: "/dashboard/notifications", roles: ["all"] },
  ]

  const operatorItems = [
    { id: "cte", label: "Sự kiện CTE", href: "/dashboard/cte", roles: ["operator", "manager", "admin"] },
    { id: "lots", label: "Lô hàng", href: "/dashboard/lots", roles: ["operator", "manager", "admin"] },
    { id: "shipments", label: "Vận chuyển", href: "/dashboard/shipments", roles: ["operator", "manager", "admin"] },
  ]

  const managerItems = [
    { id: "facilities", label: "Cơ sở", href: "/dashboard/facilities", roles: ["manager", "admin"] },
    { id: "products", label: "Sản phẩm", href: "/dashboard/products", roles: ["manager", "admin"] },
    { id: "reports", label: "Báo cáo", href: "/dashboard/reports", roles: ["manager", "admin"] },
    { id: "analytics", label: "Phân tích", href: "/dashboard/analytics", roles: ["manager", "admin"] },
  ]

  const adminItems = [
    { id: "users", label: "Người dùng", href: "/admin/users", roles: ["admin", "system_admin"] },
    { id: "audit", label: "Kiểm toán", href: "/dashboard/audit-trail", roles: ["admin", "system_admin"] },
  ]

  const allItems = [...baseItems, ...operatorItems, ...managerItems, ...adminItems]

  return allItems.filter((item) => item.roles.includes("all") || item.roles.includes(role))
}
