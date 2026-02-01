import { Box, Divider, Paper, Stack, Typography } from "@mui/material";
import type { ReactNode } from "react";

type TableCardProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
};

const TableCard = ({ title, subtitle, action, children }: TableCardProps) => {
  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box>
            <Typography variant="h6">{title}</Typography>
            {subtitle ? <Typography color="text.secondary">{subtitle}</Typography> : null}
          </Box>
          {action}
        </Box>
        <Divider />
        {children}
      </Stack>
    </Paper>
  );
};

export default TableCard;
