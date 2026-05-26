import { useState, useCallback } from 'react'
import { generateAllData } from './generators'
import type { AllData } from './types'

type TableId =
  | 'cap_customers' | 'cap_accounts' | 'cap_transactions'
  | 'cap_device_sessions' | 'cap_disputes' | 'cap_commercial'
  | 'disc_customers' | 'disc_accounts' | 'disc_cardholder_txns'
  | 'disc_merchants' | 'disc_terminals' | 'disc_network_txns'
  | 'disc_settlements' | 'disc_chargebacks' | 'disc_bin_table' | 'disc_fraud_patterns'

export function getTableRows(data: AllData, tableId: TableId): Record<string, unknown>[] {
  const map: Record<TableId, unknown[]> = {
    cap_customers:       data.capone.customers,
    cap_accounts:        data.capone.accounts,
    cap_transactions:    data.capone.transactions,
    cap_device_sessions: data.capone.deviceSessions,
    cap_disputes:        data.capone.disputes,
    cap_commercial:      data.capone.commercial,
    disc_customers:      data.discover.customers,
    disc_accounts:       data.discover.accounts,
    disc_cardholder_txns:data.discover.cardholderTxns,
    disc_merchants:      data.discover.merchants,
    disc_terminals:      data.discover.terminals,
    disc_network_txns:   data.discover.networkTxns,
    disc_settlements:    data.discover.settlements,
    disc_chargebacks:    data.discover.chargebacks,
    disc_bin_table:      data.discover.binTable,
    disc_fraud_patterns: data.discover.fraudPatterns,
  }
  return map[tableId] as Record<string, unknown>[]
}

export function useGeneratedData() {
  const [data, setData] = useState<AllData | null>(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(() => {
    if (data || loading) return
    setLoading(true)
    // Defer off the render cycle so loading state shows first
    setTimeout(() => {
      setData(generateAllData())
      setLoading(false)
    }, 20)
  }, [data, loading])

  return { data, loading, load }
}
