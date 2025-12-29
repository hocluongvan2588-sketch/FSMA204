import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import OnboardingWizard from "@/components/onboarding/onboarding-wizard"

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  // Check if user already has company setup
  const { data: profile } = await supabase.from("profiles").select("*, companies(id, name)").eq("id", user.id).single()

  // If user already has company with facilities and products, skip onboarding
  if (profile?.company_id) {
    const { count: facilitiesCount } = await supabase
      .from("facilities")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)

    const { count: productsCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .eq("company_id", profile.company_id)

    // If they have at least 1 facility and 1 product, consider onboarding complete
    if (facilitiesCount && facilitiesCount > 0 && productsCount && productsCount > 0) {
      redirect("/dashboard")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <OnboardingWizard profile={profile} />
    </div>
  )
}
