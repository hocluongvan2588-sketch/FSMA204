"use client"

import { Cell, Pie, PieChart as RechartsPieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PieChartProps {
  title: string
  data: Array<{ name: string; value: number }>
  colors?: string[]
}

const DEFAULT_COLORS = ["#22c55e", "#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6"]

export function PieChart({ title, data, colors = DEFAULT_COLORS }: PieChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6">
          <ResponsiveContainer width={200} height={200}>
            <RechartsPieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80}>
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {data.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: colors[index % colors.length] }} />
                  <span className="text-slate-600">{item.name}</span>
                </div>
                <span className="font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
