import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@platform/design-system";
import { formatTokenCount, type AccountView } from "@platform/snapshot-data";

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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>account</TableHead>
          <TableHead>machines</TableHead>
          <TableHead>window</TableHead>
          <TableHead>cache-read</TableHead>
          <TableHead>output</TableHead>
          <TableHead>cost (notional)</TableHead>
          <TableHead>recalls suppressed</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {buildAccountRows(accounts).map((row) => (
          <TableRow key={row.account_label}>
            <TableCell>
              <code>{row.account_label}</code>
            </TableCell>
            <TableCell>{row.machine_count}</TableCell>
            <TableCell>{row.window}</TableCell>
            <TableCell>{row.cache_read}</TableCell>
            <TableCell>{row.output}</TableCell>
            <TableCell>{row.cost}</TableCell>
            <TableCell>{row.recalls_suppressed}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
