"use client"

import Link from "next/link"
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface BatchRecord {
  id: string
  recipients: number
  amount: string
  status: "Completed" | "Processing" | "Failed"
  timestamp: string
}

const defaultBatches: BatchRecord[] = [
  {
    id: "#BP-2024-001",
    recipients: 147,
    amount: "$12,450.00",
    status: "Completed",
    timestamp: "2 hours ago",
  },
  {
    id: "#BP-2024-002",
    recipients: 89,
    amount: "$8,920.50",
    status: "Processing",
    timestamp: "4 hours ago",
  },
  {
    id: "#BP-2024-003",
    recipients: 203,
    amount: "$15,780.25",
    status: "Completed",
    timestamp: "1 day ago",
  },
  {
    id: "#BP-2024-004",
    recipients: 156,
    amount: "$22,340.75",
    status: "Failed",
    timestamp: "2 days ago",
  },
]

interface RecentBatchesTableProps {
  batches?: BatchRecord[]
  className?: string
}

export function RecentBatchesTable({
  batches = defaultBatches,
  className,
}: RecentBatchesTableProps) {
  return (
    <Card className={cn("border-[#1F2937] bg-[#121827] shadow-lg", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Recent Batches</h2>
          <Button asChild variant="link" className="text-[#00D98B] hover:text-[#00D98B]/80 text-sm p-0">
            <Link href="/dashboard/history">View All</Link>
          </Button>
        </div>
        
        <div className="hidden md:block overflow-x-auto overflow-y-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-bold text-gray-500 border-b border-[#1F2937]/50">
                <th className="pb-4 uppercase tracking-widest">Batch ID</th>
                <th className="pb-4 uppercase tracking-widest">Recipients</th>
                <th className="pb-4 uppercase tracking-widest">Amount</th>
                <th className="pb-4 uppercase tracking-widest text-center">Status</th>
                <th className="pb-4 uppercase tracking-widest text-right">Created</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {batches.map((batch) => (
                <tr 
                  key={batch.id} 
                  className="group border-b border-[#1F2937]/30 hover:bg-white/[0.01] transition-all duration-300"
                >
                  <td className="py-5 font-mono text-xs text-gray-400 group-hover:text-gray-200 transition-colors">
                    {batch.id}
                  </td>
                  <td className="py-5 text-gray-300 font-medium">{batch.recipients}</td>
                  <td className="py-5">
                    <span className="text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                      {batch.amount}
                    </span>
                  </td>
                  <td className="py-5">
                    <div className="flex justify-center">
                      <StatusBadge status={batch.status} />
                    </div>
                  </td>
                  <td className="py-5 text-right text-gray-500 font-medium tabular-nums">
                    {batch.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View - Premium Card List */}
        <div className="flex flex-col gap-5 md:hidden">
          {batches.map((batch) => (
            <div 
              key={batch.id} 
              className="group relative overflow-hidden flex flex-col p-5 rounded-2xl border border-[#1F2937] bg-gradient-to-b from-[#1F2937]/40 to-transparent hover:border-[#00D98B]/30 transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#00D98B]/5 blur-3xl rounded-full -mr-12 -mt-12 transition-all duration-500 group-hover:bg-[#00D98B]/10" />
              
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="font-mono text-xs text-gray-500 uppercase tracking-tighter bg-[#1F2937]/50 px-2 py-0.5 rounded">
                  {batch.id}
                </span>
                <StatusBadge status={batch.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4 relative z-10">
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Recipients</span>
                  <span className="text-white font-semibold text-lg">{batch.recipients}</span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">Total Amount</span>
                  <span className="text-white font-black text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">
                    {batch.amount}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-[#1F2937]/50 relative z-10">
                <span className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                  Submitted {batch.timestamp}
                </span>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] text-[#00D98B] hover:text-[#00D98B] hover:bg-[#00D98B]/10 rounded-full font-bold uppercase tracking-wider">
                  Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ status }: { status: BatchRecord["status"] }) {
  const configs = {
    Completed: {
      color: "bg-green-500/10 text-green-400 border-green-500/20",
      icon: CheckCircle2,
      label: "Completed"
    },
    Processing: {
      color: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      icon: Clock,
      label: "Processing"
    },
    Failed: {
      color: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: AlertTriangle,
      label: "Failed"
    }
  }

  const config = configs[status]
  const Icon = config.icon

  return (
    <Badge 
      variant="outline" 
      className={cn(
        "px-2.5 py-1 rounded-full text-[11px] font-medium flex items-center gap-1.5 border w-fit",
        config.color
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </Badge>
  )
}
