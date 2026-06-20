import {
  formatTokenCount,
  type AccountView,
} from "@lucaszanoni-web/snapshot-data";

export interface AccountTableProps {
  accounts: AccountView[];
}

interface AccountRow {
  account_label: string;
  machine_count: number;
  window: string;
  cache_read: string;
  output: string;
  cost: string;
  recalls_suppressed: number;
}

function buildAccountRows(accounts: AccountView[]): AccountRow[] {
  return accounts.map((accountView) => {
    const tokenTotals = accountView.token_totals;
    const firstDate = accountView.first_session_date ?? "-";
    const lastDate = accountView.last_computed_date ?? "-";
    return {
      account_label: accountView.account_label,
      machine_count: accountView.machine_count,
      window: `${firstDate} to ${lastDate}`,
      cache_read: formatTokenCount(tokenTotals.cache_read_input_tokens),
      output: formatTokenCount(tokenTotals.output_tokens),
      cost: `$${Math.round(tokenTotals.cost_usd).toLocaleString("en-US")}`,
      recalls_suppressed:
        accountView.memory_recall_savings.suppressed_recall_event_total,
    };
  });
}

export function AccountTable({ accounts }: AccountTableProps) {
  return (
    <table>
      <thead>
        <tr>
          <th>account</th>
          <th>machines</th>
          <th>window</th>
          <th>cache-read</th>
          <th>output</th>
          <th>cost (notional)</th>
          <th>recalls suppressed</th>
        </tr>
      </thead>
      <tbody>
        {buildAccountRows(accounts).map((row) => (
          <tr key={row.account_label}>
            <td>
              <code>{row.account_label}</code>
            </td>
            <td>{row.machine_count}</td>
            <td>{row.window}</td>
            <td>{row.cache_read}</td>
            <td>{row.output}</td>
            <td>{row.cost}</td>
            <td>{row.recalls_suppressed}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
