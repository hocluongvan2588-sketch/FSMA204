"use client"

import { Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LineChartProps {
  title: string
  data: Array<{ date: string; count: number }>
  color?: string
}

export function LineChart({ title, data, color = "#2563eb" }: LineChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsLineChart data={data}>
            <XAxis
              dataKey="date"
              tickFormatter={(value) => new Date(value).toLocaleDateString("vi-VN", { month: "short", day: "numeric" })}
              stroke="#94a3b8"
              fontSize={12}
            />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-white p-3 shadow-lg">
                      <div className="text-sm font-medium">
                        {new Date(payload[0].payload.date).toLocaleDateString("vi-VN")}
                      </div>
                      <div className="text-lg font-bold" style={{ color }}>
                        {payload[0].value}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Line type="monotone" dataKey="count" stroke={color} strokeWidth={2} dot={false} />
          </RechartsLineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
