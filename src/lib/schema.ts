import { z } from 'zod';

export const Status = z.enum(['low', 'normal', 'high', 'abnormal', 'unknown']);
export type Status = z.infer<typeof Status>;

export const Priority = z.enum(['high', 'medium', 'low']);
export type Priority = z.infer<typeof Priority>;

export const TestFinding = z.object({
  name: z.string().min(1),
  value: z.string(),
  range: z.string().nullable().optional(),
  units: z.string().nullable().optional(),
  status: Status.catch('unknown'),
  priority: Priority.catch('low'),
  finding: z.string(),
  explanation: z.string(),
  source_snippet: z.string().min(1),
});
export type TestFinding = z.infer<typeof TestFinding>;

export const ReportAnalysis = z.object({
  tests: z.array(TestFinding),
  summary: z.string(),
  confidence: z.number().min(0).max(1).catch(0.5),
});
export type ReportAnalysis = z.infer<typeof ReportAnalysis>;

export const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
