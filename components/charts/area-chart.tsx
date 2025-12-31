"use client"

import {
    AreaChart as RechartsAreaChart,
    Area,
    XAxis,
    YAxis,
    ResponsiveContainer,
    Tooltip,
    CartesianGrid,
} from "recharts"

interface AreaChartProps {
    data: Array<{
        name: string
        value: number
    }>
    color?: string
    height?: number
}

export function AreaChartComponent({ data, color = "#74B9FF", height = 200 }: AreaChartProps) {
    const gradientId = `gradient-${color.replace("#", "")}`

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsAreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                        <stop offset="95%" stopColor={color} stopOpacity={0.05} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                />
                <Tooltip
                    content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                            return (
                                <div className="px-3 py-2 rounded-lg shadow-lg border border-white/20" style={{ background: 'var(--glass-white)' }}>
                                    <p className="text-sm font-medium text-[var(--text-primary)]">{label}</p>
                                    <p className="text-sm text-[var(--accent-blue)]">{payload[0].value}</p>
                                </div>
                            )
                        }
                        return null
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={3}
                    fill={`url(#${gradientId})`}
                    animationDuration={1500}
                    animationEasing="ease-out"
                />
            </RechartsAreaChart>
        </ResponsiveContainer>
    )
}
