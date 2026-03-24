"use client"

import { Send, Coins, CheckCircle, Clock } from "lucide-react"
import { MetricCard, MetricCardProps } from "./metric-card"

const metricsData: Omit<MetricCardProps, "index">[] = [
  {
    title: "Total Payments",
    value: "24,567",
    change: "+12.5%",
    icon: Send,
    iconBg: "bg-teal-500/20",
    iconColor: "text-teal-500",
  },
  {
    title: "Total Amount Sent",
    value: "$1.2M",
    change: "+8.2%",
    icon: Coins,
    iconBg: "bg-blue-500/20",
    iconColor: "text-blue-500",
  },
  {
    title: "Success Rate",
    value: "98.7%",
    change: "+2.1%",
    icon: CheckCircle,
    iconBg: "bg-green-500/20",
    iconColor: "text-green-500",
  },
  {
    title: "Active Batches",
    value: "12",
    change: "Live",
    icon: Clock,
    iconBg: "bg-purple-500/20",
    iconColor: "text-purple-500",
  },
]

export function OverviewMetrics() {
  return (
    <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {metricsData.map((metric, index) => (
        <MetricCard key={metric.title} {...metric} index={index} />
      ))}
    </div>
  )
}
