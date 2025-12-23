"use client"

import { Bar, BarChart as RechartsBarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface BarChartProps {
  title: string
  data: Array<{ name: string; value: number }>
  color?: string
  valueLabel?: string
}

export function BarChart({ title, data, color = "#2563eb", valueLabel }: BarChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <RechartsBarChart data={data}>
            <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="rounded-lg border bg-white p-3 shadow-lg">
                      <div className="text-sm font-medium">{payload[0].payload.name}</div>
                      <div className="text-lg font-bold" style={{ color }}>
                        {payload[0].value}
                        {valueLabel && <span className="text-sm font-normal ml-1">{valueLabel}</span>}
                      </div>
                    </div>
                  )
                }
                return null
              }}
            />
            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
          </RechartsBarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
