"use client"

// Thin module that re-exports Recharts primitives so they can be dynamically imported
import * as RechartsPrimitive from 'recharts'

export const ResponsiveContainer = RechartsPrimitive.ResponsiveContainer
export const Tooltip = RechartsPrimitive.Tooltip
export const Legend = RechartsPrimitive.Legend

// also export other primitives if needed in the future
export default {
  ResponsiveContainer,
  Tooltip,
  Legend,
}
