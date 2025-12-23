"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Edit, Trash2, Building2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage } from "@/contexts/language-context"
import { adminDeleteFacility } from "@/app/actions/admin-facilities"

interface Facility {
  id: string
  company_id: string
  name: string
  location_code: string
  facility_type: string
  address: string
  gps_coordinates: string | null
  certification_status: string
  created_at: string
  fda_facility_number: string | null
  us_agent_id: string | null
  fda_registration_date: string | null
  agent_registration_date: string | null
  fda_expiry_date: string | null
  agent_expiry_date: string | null
  registration_email: string | null
  duns_number: string | null
  email: string | null
  phone: string | null
  fda_registration_status: string | null
  companies: {
    name: string
  }
  us_agents?: {
    agent_name: string
    email: string
  } | null
}

interface Company {
  id: string
  name: string
}

interface USAgent {
  id: string
  agent_name: string
  agent_company_name: string
  email: string
}

export default function AdminFacilitiesPage() {
  const { toast } = useToast()
  const { locale, t } = useLanguage()
  const [facilities, setFacilities] = useState<Facility[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [usAgents, setUsAgents] = useState<USAgent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showDialog, setShowDialog] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [currentStep, setCurrentStep] = useState(1)

  const [companyId, setCompanyId] = useState("")
  const [name, setName] = useState("")
  const [locationCode, setLocationCode] = useState("")
  const [facilityType, setFacilityType] = useState("production")
  const [address, setAddress] = useState("")
  const [gpsCoordinates, setGpsCoordinates] = useState("")
  const [certificationStatus, setCertificationStatus] = useState("pending")
  const [fdaFacilityNumber, setFdaFacilityNumber] = useState("")
  const [usAgentId, setUsAgentId] = useState("")
  const [fdaRegistrationDate, setFdaRegistrationDate] = useState("")
  const [agentRegistrationDate, setAgentRegistrationDate] = useState("")
  const [agentRegistrationYears, setAgentRegistrationYears] = useState("1")
  const [fdaExpiryDate, setFdaExpiryDate] = useState("")
  const [agentExpiryDate, setAgentExpiryDate] = useState("")
  const [registrationEmail, setRegistrationEmail] = useState("")
  const [dunsNumber, setDunsNumber] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [fdaRegistrationStatus, setFdaRegistrationStatus] = useState("pending")

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (fdaRegistrationDate) {
      const expiry = calculateFdaExpiryDate(fdaRegistrationDate)
      setFdaExpiryDate(expiry)
    }
  }, [fdaRegistrationDate])

  useEffect(() => {
    if (agentRegistrationDate && agentRegistrationYears) {
      const expiry = calculateAgentExpiryDate(agentRegistrationDate, agentRegistrationYears)
      setAgentExpiryDate(expiry)
    }
  }, [agentRegistrationDate, agentRegistrationYears])

  const loadData = async () => {
    setIsLoading(true)
    const supabase = createClient()

    const [facilitiesResult, companiesResult, agentsResult] = await Promise.all([
      supabase
        .from("facilities")
        .select("*, companies(name), us_agents(agent_name, email)")
        .order("created_at", { ascending: false }),
      supabase.from("companies").select("id, name").order("name"),
      supabase.from("us_agents").select("id, agent_name, agent_company_name, email").order("agent_name"),
    ])

    if (facilitiesResult.data) setFacilities(facilitiesResult.data)
    if (companiesResult.data) setCompanies(companiesResult.data)
    if (agentsResult.data) setUsAgents(agentsResult.data)
    setIsLoading(false)
  }

  const resetForm = () => {
    setCompanyId("")
    setName("")
    setLocationCode("")
    setFacilityType("production")
    setAddress("")
    setGpsCoordinates("")
    setCertificationStatus("pending")
    setFdaFacilityNumber("")
    setUsAgentId("")
    setFdaRegistrationDate("")
    setAgentRegistrationDate("")
    setAgentRegistrationYears("1")
    setFdaExpiryDate("")
    setAgentExpiryDate("")
    setRegistrationEmail("")
    setDunsNumber("")
    setEmail("")
    setPhone("")
    setFdaRegistrationStatus("pending")
    setEditingId(null)
    setCurrentStep(1)
  }

  const handleOpenDialog = (facility?: Facility) => {
    if (facility) {
      setEditingId(facility.id)
      setCompanyId(facility.company_id)
      setName(facility.name)
      setLocationCode(facility.location_code)
      setFacilityType(facility.facility_type)
      setAddress(facility.address)
      setGpsCoordinates(facility.gps_coordinates || "")
      setCertificationStatus(facility.certification_status)
      setFdaFacilityNumber(facility.fda_facility_number || "")
      setUsAgentId(facility.us_agent_id || "")
      setFdaRegistrationDate(facility.fda_registration_date || "")
      setAgentRegistrationDate(facility.agent_registration_date || "")
      setAgentRegistrationYears(
        facility.agent_expiry_date
          ? calculateAgentRegistrationYears(facility.agent_registration_date, facility.agent_expiry_date)
          : "1",
      )
      setFdaExpiryDate(facility.fda_expiry_date || "")
      setAgentExpiryDate(facility.agent_expiry_date || "")
      setRegistrationEmail(facility.registration_email || "")
      setDunsNumber(facility.duns_number || "")
      setEmail(facility.email || "")
      setPhone(facility.phone || "")
      setFdaRegistrationStatus(facility.fda_registration_status || "pending")
    } else {
      resetForm()
    }
    setShowDialog(true)
  }

  const handleSave = async () => {
    if (!companyId || !name || !locationCode || !facilityType || !address) {
      toast({
        variant: "destructive",
        title: t("common.error"),
        description: t("admin.facilities.alerts.requiredFields"),
      })
      return
    }

    setIsSaving(true)
    const supabase = createClient()

    const data = {
      company_id: companyId,
      name,
      location_code: locationCode,
      address,
      gps_coordinates: gpsCoordinates || undefined,
      certification_status: certificationStatus,
      fda_facility_number: fdaFacilityNumber || undefined,
      us_agent_id: usAgentId || undefined,
      fda_registration_date: fdaRegistrationDate || undefined,
      agent_registration_date: agentRegistrationDate || undefined,
      fda_expiry_date: fdaExpiryDate || undefined,
      agent_expiry_date: agentExpiryDate || undefined,
      registration_email: registrationEmail || undefined,
      duns_number: dunsNumber || undefined,
      email: email || undefined,
      phone: phone || undefined,
      fda_registration_status: fdaRegistrationStatus,
    }

    let result

    if (editingId) {
      result = await supabase.from("facilities").update(data).eq("id", editingId)
    } else {
      result = await supabase.from("facilities").insert([data])
    }

    if (result.error) {
      toast({
        variant: "destructive",
        title: t("admin.common.saveError"),
        description: result.error.message,
      })
      setIsSaving(false)
      return
    }

    toast({
      title: editingId ? t("admin.common.updateSuccess") : t("admin.common.addSuccess"),
      description: editingId ? `${name} ${t("admin.common.updated")}` : `${name} ${t("admin.common.added")}`,
    })

    setShowDialog(false)
    resetForm()
    loadData()
    setIsSaving(false)
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`${t("admin.facilities.confirmDelete")} ${name}?`)) {
      return
    }

    const result = await adminDeleteFacility(id)

    if (result.error) {
      toast({
        variant: "destructive",
        title: t("admin.common.deleteError"),
        description: result.error,
      })
      return
    }

    toast({
      title: t("admin.common.deleteSuccess"),
      description: `${name} ${t("admin.common.deleted")}`,
    })

    loadData()
  }

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      certified: { label: t("admin.facilities.status.certified"), className: "bg-green-100 text-green-700" },
      pending: { label: t("admin.facilities.status.pending"), className: "bg-yellow-100 text-yellow-700" },
      expired: { label: t("admin.facilities.status.expired"), className: "bg-red-100 text-red-700" },
      cancelled: { label: t("admin.facilities.status.cancelled"), className: "bg-red-100 text-red-700" },
    }
    return config[status] || config.pending
  }

  const calculateFdaExpiryDate = (registrationDate: string) => {
    if (!registrationDate) return ""
    const date = new Date(registrationDate)
    const year = date.getFullYear()
    const nextEvenYear = year % 2 === 0 ? year : year + 1
    const expiryDate = new Date(nextEvenYear, 11, 31)
    return expiryDate.toISOString().split("T")[0]
  }

  const calculateAgentExpiryDate = (registrationDate: string, years: string) => {
    if (!registrationDate || !years) return ""
    const date = new Date(registrationDate)
    const numYears = Number.parseInt(years, 10)
    date.setFullYear(date.getFullYear() + numYears)
    return date.toISOString().split("T")[0]
  }

  const calculateAgentRegistrationYears = (registrationDate: string, expiryDate: string) => {
    const startDate = new Date(registrationDate)
    const endDate = new Date(expiryDate)
    const years = endDate.getFullYear() - startDate.getFullYear()
    return years.toString()
  }

  const handleFdaRegistrationDateChange = (value: string) => {
    setFdaRegistrationDate(value)
  }

  const handleAgentDateChange = () => {
    const expiry = calculateAgentExpiryDate(agentRegistrationDate, agentRegistrationYears)
    setAgentExpiryDate(expiry)
  }

  const handleNextStep = () => {
    if (currentStep === 1 && isStep1Valid()) {
      setCurrentStep(2)
    } else if (currentStep === 2 && isStep2Valid()) {
      setCurrentStep(3)
    }
  }

  const handlePreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const isStep1Valid = () => {
    return companyId && name && locationCode && address && gpsCoordinates && facilityType
  }

  const isStep2Valid = () => {
    return fdaFacilityNumber && fdaRegistrationDate && usAgentId && agentRegistrationDate && agentRegistrationYears
  }

  const isStep3Valid = () => {
    return registrationEmail && dunsNumber && email
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t("admin.facilities.title")}</h1>
          <p className="text-muted-foreground mt-1">{t("admin.facilities.subtitle")}</p>
        </div>
        <Button onClick={() => handleOpenDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          {t("admin.facilities.add")}
        </Button>
      </div>

      <div className="bg-purple-50 border border-purple-200 text-purple-800 px-4 py-3 rounded-lg flex items-start gap-3">
        <svg className="h-5 w-5 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <div>
          <p className="font-semibold">{t("admin.common.systemAdminModeTitle")}</p>
          <p className="text-sm">{t("admin.systemAdminDesc")}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {t("admin.facilities.list")} ({facilities.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facilities.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t("admin.facilities.empty")}</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("admin.facilities.fields.company")}</TableHead>
                  <TableHead>{t("admin.facilities.fields.name")}</TableHead>
                  <TableHead>{t("admin.facilities.fields.locationCode")}</TableHead>
                  <TableHead>{t("admin.facilities.fields.facilityType")}</TableHead>
                  <TableHead>{t("admin.facilities.fields.address")}</TableHead>
                  <TableHead>{t("admin.facilities.fields.certificationStatus")}</TableHead>
                  <TableHead>{t("admin.common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {facilities.map((facility) => (
                  <TableRow key={facility.id}>
                    <TableCell>
                      <div className="font-medium">{facility.companies.name}</div>
                    </TableCell>
                    <TableCell>{facility.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{facility.location_code}</Badge>
                    </TableCell>
                    <TableCell className="capitalize">{facility.facility_type}</TableCell>
                    <TableCell className="max-w-xs truncate">{facility.address}</TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(facility.certification_status).className}>
                        {getStatusBadge(facility.certification_status).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDialog(facility)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDelete(facility.id, facility.name)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t("admin.facilities.edit") : t("admin.facilities.add")}</DialogTitle>
            <DialogDescription>
              {editingId ? t("admin.facilities.subtitle") : t("admin.facilities.subtitle")}
            </DialogDescription>
          </DialogHeader>

          {/* Step Indicator */}
          <div className="mb-6 flex justify-between items-center">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                    step <= currentStep ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
                  }`}
                >
                  {step}
                </div>
                {step < 3 && (
                  <div className={`flex-1 h-1 mx-2 ${step < currentStep ? "bg-green-600" : "bg-gray-300"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t("facilities.sections.basic")}</h3>
              <div className="space-y-2">
                <Label htmlFor="company">{t("admin.facilities.fields.company")} *</Label>
                <Select value={companyId} onValueChange={setCompanyId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("admin.common.selectCompany")} />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map((company) => (
                      <SelectItem key={company.id} value={company.id}>
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("admin.facilities.fields.name")} *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("admin.facilities.placeholders.name")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationCode">{t("admin.facilities.fields.locationCode")} *</Label>
                  <Input
                    id="locationCode"
                    value={locationCode}
                    onChange={(e) => setLocationCode(e.target.value)}
                    placeholder={t("admin.facilities.placeholders.locationCode")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facilityType">{t("admin.facilities.fields.facilityType")} *</Label>
                  <Select value={facilityType} onValueChange={setFacilityType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">{t("admin.facilities.types.production")}</SelectItem>
                      <SelectItem value="processing">{t("admin.facilities.types.processing")}</SelectItem>
                      <SelectItem value="storage">{t("admin.facilities.types.storage")}</SelectItem>
                      <SelectItem value="distribution">{t("admin.facilities.types.distribution")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="certificationStatus">{t("admin.facilities.fields.certificationStatus")} *</Label>
                  <Select value={certificationStatus} onValueChange={setCertificationStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certified">{t("admin.facilities.status.certified")}</SelectItem>
                      <SelectItem value="pending">{t("admin.facilities.status.pending")}</SelectItem>
                      <SelectItem value="expired">{t("admin.facilities.status.expired")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("admin.facilities.fields.address")} *</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("admin.facilities.placeholders.address")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gpsCoordinates">{t("admin.facilities.fields.gpsCoordinates")}</Label>
                <Input
                  id="gpsCoordinates"
                  value={gpsCoordinates}
                  onChange={(e) => setGpsCoordinates(e.target.value)}
                  placeholder={t("admin.facilities.placeholders.gps")}
                />
              </div>
            </div>
          )}

          {/* Step 2: FDA Registration Information */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t("facilities.sections.fda")}</h3>
              <div className="space-y-2">
                <Label htmlFor="fdaFacilityNumber">{t("admin.facilities.fields.fdaFacilityNumber")}</Label>
                <Input
                  id="fdaFacilityNumber"
                  value={fdaFacilityNumber}
                  onChange={(e) => setFdaFacilityNumber(e.target.value)}
                  placeholder="e.g., 3002718960"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dunsNumber">{t("admin.facilities.fields.dunsNumber")}</Label>
                <Input
                  id="dunsNumber"
                  value={dunsNumber}
                  onChange={(e) => setDunsNumber(e.target.value)}
                  placeholder="DUNS Number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fdaRegistrationDate">{t("admin.facilities.fields.fdaRegistrationDate")}</Label>
                <Input
                  id="fdaRegistrationDate"
                  type="date"
                  value={fdaRegistrationDate}
                  onChange={(e) => setFdaRegistrationDate(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">{t("admin.facilities.alerts.fdaAutoCalculate")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fdaExpiryDate">{t("admin.facilities.fields.fdaExpiryDate")}</Label>
                <Input
                  id="fdaExpiryDate"
                  type="date"
                  value={fdaExpiryDate}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">{t("admin.facilities.alerts.expiryAutoCalculated")}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fdaRegistrationStatus">{t("admin.facilities.fields.fdaRegistrationStatus")}</Label>
                <Select value={fdaRegistrationStatus} onValueChange={setFdaRegistrationStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">{t("admin.facilities.status.pending")}</SelectItem>
                    <SelectItem value="active">{t("admin.facilities.status.active")}</SelectItem>
                    <SelectItem value="expired">{t("admin.facilities.status.expired")}</SelectItem>
                    <SelectItem value="cancelled">{t("admin.facilities.status.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Contact Information */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">{t("facilities.sections.contact")}</h3>
              <div className="space-y-2">
                <Label htmlFor="usAgentId">{t("admin.facilities.fields.usAgent")}</Label>
                <Select value={usAgentId} onValueChange={setUsAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t("common.selectPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {usAgents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.agent_name} ({agent.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentRegistrationDate">{t("admin.facilities.fields.agentRegistrationDate")}</Label>
                <Input
                  id="agentRegistrationDate"
                  type="date"
                  value={agentRegistrationDate}
                  onChange={(e) => setAgentRegistrationDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentRegistrationYears">{t("admin.facilities.fields.agentRegistrationYears")}</Label>
                <Select value={agentRegistrationYears} onValueChange={(value) => setAgentRegistrationYears(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 năm</SelectItem>
                    <SelectItem value="2">2 năm</SelectItem>
                    <SelectItem value="3">3 năm</SelectItem>
                    <SelectItem value="4">4 năm</SelectItem>
                    <SelectItem value="5">5 năm</SelectItem>
                    <SelectItem value="10">10 năm</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="agentExpiryDate">{t("admin.facilities.fields.agentExpiryDate")}</Label>
                <Input
                  id="agentExpiryDate"
                  type="date"
                  value={agentExpiryDate}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">
                  {t("admin.facilities.alerts.agentExpiryAutoCalculated")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationEmail">{t("admin.facilities.fields.registrationEmail")}</Label>
                <Input
                  id="registrationEmail"
                  type="email"
                  value={registrationEmail}
                  onChange={(e) => setRegistrationEmail(e.target.value)}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6 gap-2">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              {t("common.cancel")}
            </Button>

            {currentStep > 1 && (
              <Button variant="outline" onClick={handlePreviousStep}>
                {t("common.previous")} {/* or "Quay lại" */}
              </Button>
            )}

            {currentStep < 3 ? (
              <Button
                onClick={handleNextStep}
                disabled={(currentStep === 1 && !isStep1Valid()) || (currentStep === 2 && !isStep2Valid())}
              >
                {t("common.next")} {/* or "Tiếp theo" */}
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={isSaving || !isStep3Valid()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isSaving ? t("common.saving") : t("common.save")}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
