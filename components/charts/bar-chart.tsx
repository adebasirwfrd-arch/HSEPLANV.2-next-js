"use client"

import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Cell } from "recharts"

interface BarChartProps {
    data: Array<{
        name: string
        value: number
        color?: string
    }>
    barColor?: string
    height?: number
    gradientColors?: [string, string]
}

export function BarChartComponent({
    data,
    barColor = "#74B9FF",
    height = 200,
    gradientColors
}: BarChartProps) {
    const gradientId = `bar-gradient-${barColor.replace("#", "")}`

    return (
        <ResponsiveContainer width="100%" height={height}>
            <RechartsBarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                {gradientColors && (
                    <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={gradientColors[0]} stopOpacity={1} />
                            <stop offset="100%" stopColor={gradientColors[1]} stopOpacity={0.8} />
                        </linearGradient>
                    </defs>
                )}
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
                <Bar
                    dataKey="value"
                    fill={gradientColors ? `url(#${gradientId})` : barColor}
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                    animationDuration={1200}
                    animationEasing="ease-out"
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={entry.color || (gradientColors ? `url(#${gradientId})` : barColor)}
                        />
                    ))}
                </Bar>
            </RechartsBarChart>
        </ResponsiveContainer>
    )
}
