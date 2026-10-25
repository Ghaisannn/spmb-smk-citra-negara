import {
  BedDouble,
  Building2,
  Network,
  Palette,
  SquareTerminal,
  Store,
  type LucideIcon,
} from "lucide-react";
import type { ProgramKode } from "@/lib/program-data";

export const PROGRAM_ICON: Record<ProgramKode, LucideIcon> = {
  PPLG: SquareTerminal,
  DKV: Palette,
  TJKT: Network,
  MPLB: Building2,
  PEMASARAN: Store,
  PERHOTELAN: BedDouble,
};