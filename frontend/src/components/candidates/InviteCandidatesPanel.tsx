import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography
} from "@mui/material";
type CsvRow = {
  name: string;
  email: string;
  error?: string;
};

type InviteCandidatesPanelProps = {
  jobId?: string;
  canInvite: boolean;
  onCreateCandidate: (payload: { name: string; email: string }) => Promise<void>;
  onError: (message: string | null) => void;
  candidateNameRef?: React.MutableRefObject<HTMLInputElement | null>;
};

const parseCsv = (text: string) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [] as CsvRow[];

  const [header, ...rows] = lines;
  const headerCells = header.split(",").map((cell) => cell.trim().toLowerCase());
  const nameIdx = headerCells.findIndex((cell) => cell === "name");
  const emailIdx = headerCells.findIndex((cell) => cell === "email");
  const startIndex = nameIdx === -1 || emailIdx === -1 ? 0 : 1;

  const dataLines = startIndex === 0 ? lines : rows;
  return dataLines.map((line) => {
    const cells = line.split(",").map((cell) => cell.trim());
    const name = nameIdx === -1 ? cells[0] || "" : cells[nameIdx] || "";
    const email = emailIdx === -1 ? cells[1] || "" : cells[emailIdx] || "";
    return { name, email };
  });
};

const validateRow = (row: CsvRow) => {
  if (!row.name.trim()) return "Missing name";
  if (!row.email.trim()) return "Missing email";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) return "Invalid email";
  return "";
};

const InviteCandidatesPanel = ({
  jobId,
  canInvite,
  onCreateCandidate,
  onError,
  candidateNameRef
}: InviteCandidatesPanelProps) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [csvRows, setCsvRows] = useState<CsvRow[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const validRows = useMemo(() => {
    return csvRows.map((row) => ({ ...row, error: validateRow(row) }));
  }, [csvRows]);

  const hasValidRows = useMemo(() => validRows.some((row) => !row.error), [validRows]);

  const handleManualSubmit = async () => {
    onError(null);
    if (!jobId) return;
    if (!canInvite) {
      onError("Add interview questions before inviting candidates.");
      return;
    }
    if (!name.trim() || !email.trim()) {
      onError("Add a candidate name and email.");
      return;
    }
    if (validateRow({ name, email })) {
      onError("Enter a valid email address.");
      return;
    }
    try {
      await onCreateCandidate({ name: name.trim(), email: email.trim() });
      setName("");
      setEmail("");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not add candidate.");
    }
  };

  const handleCsvUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    onError(null);
    setCsvError(null);
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const rows = parseCsv(text);
      if (!rows.length) {
        setCsvError("CSV is empty.");
        setCsvRows([]);
        return;
      }
      setCsvRows(rows);
    } catch (err) {
      setCsvError("Failed to read CSV file.");
      setCsvRows([]);
    }
  };

  const handleBulkInvite = async () => {
    onError(null);
    if (!jobId) return;
    if (!canInvite) {
      onError("Add interview questions before inviting candidates.");
      return;
    }
    if (!hasValidRows) {
      setCsvError("No valid rows to invite.");
      return;
    }

    setSubmitting(true);
    try {
      for (const row of validRows) {
        if (row.error) continue;
        await onCreateCandidate({ name: row.name.trim(), email: row.email.trim() });
      }
      setCsvRows([]);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Could not invite candidates.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h6">Invite candidates</Typography>
        <Typography color="text.secondary">
          You have two options. Add one candidate manually or upload a CSV to invite many at once.
        </Typography>
      </Box>

      <Stack spacing={2}>
        <Typography variant="subtitle2">Option 1 — Manual entry</Typography>
        <TextField
          label="Candidate name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          inputRef={candidateNameRef}
          fullWidth
        />
        <TextField
          label="Candidate email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={handleManualSubmit} disabled={submitting}>
          Create link
        </Button>
      </Stack>

      <Divider />

      <Stack spacing={2}>
        <Typography variant="subtitle2">Option 2 — CSV upload</Typography>
        {csvError ? <Alert severity="error">{csvError}</Alert> : null}
        <Button variant="outlined" component="label">
          Upload CSV
          <input type="file" accept=".csv,text/csv" hidden onChange={handleCsvUpload} />
        </Button>
        {validRows.length ? (
          <>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {validRows.map((row, index) => (
                    <TableRow key={`${row.email}-${index}`}>
                      <TableCell>{row.name || "—"}</TableCell>
                      <TableCell>{row.email || "—"}</TableCell>
                      <TableCell>{row.error ? row.error : "Ready"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Button variant="contained" onClick={handleBulkInvite} disabled={!hasValidRows || submitting}>
              {submitting ? "Inviting..." : "Invite candidates"}
            </Button>
          </>
        ) : (
          <Typography color="text.secondary">No CSV rows loaded.</Typography>
        )}
      </Stack>
    </Stack>
  );
};

export default InviteCandidatesPanel;
