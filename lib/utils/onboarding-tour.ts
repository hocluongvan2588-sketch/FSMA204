import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface TourStep {
  id: string
  target: string
  title: string
  description: string
  position: "top" | "bottom" | "left" | "right"
  spotlightPadding?: number
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: "step-1-tlc",
    target: '[data-tour="create-lot"]',
    title: "Bước 1: Tạo mã TLC",
    description:
      "Đây là bước đầu tiên - tạo Traceability Lot Code để gán cho sản phẩm của bạn. TLC là định danh duy nhất theo quy định FSMA 204.",
    position: "bottom",
    spotlightPadding: 10,
  },
  {
    id: "step-2-quota",
    target: '[data-tour="quota-tracker"]',
    title: "Bước 2: Theo dõi hạn mức",
    description:
      "Hệ thống theo dõi số lượng sự kiện CTE bạn có thể tạo mỗi tháng dựa trên gói dịch vụ. Hãy chú ý thanh tiến trình này.",
    position: "left",
    spotlightPadding: 15,
  },
  {
    id: "step-3-compliance",
    target: '[data-tour="compliance-status"]',
    title: "Bước 3: Kiểm tra tuân thủ",
    description:
      "Khu vực này hiển thị trạng thái tuân thủ FSMA 204 của bạn, bao gồm các KDE (Key Data Elements) còn thiếu.",
    position: "top",
    spotlightPadding: 15,
  },
]

interface TourStore {
  isActive: boolean
  currentStep: number
  hasSeenTour: boolean
  startTour: () => void
  nextStep: () => void
  prevStep: () => void
  skipTour: () => void
  completeTour: () => void
}

export const useTourStore = create<TourStore>()(
  persist(
    (set, get) => ({
      isActive: false,
      currentStep: 0,
      hasSeenTour: false,
      startTour: () => set({ isActive: true, currentStep: 0 }),
      nextStep: () => {
        const { currentStep } = get()
        if (currentStep < TOUR_STEPS.length - 1) {
          set({ currentStep: currentStep + 1 })
        } else {
          get().completeTour()
        }
      },
      prevStep: () => {
        const { currentStep } = get()
        if (currentStep > 0) {
          set({ currentStep: currentStep - 1 })
        }
      },
      skipTour: () => set({ isActive: false, hasSeenTour: true }),
      completeTour: () => set({ isActive: false, hasSeenTour: true, currentStep: 0 }),
    }),
    {
      name: "fsma-tour-storage",
    },
  ),
)
