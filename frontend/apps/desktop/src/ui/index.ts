// shadcn/ui primitives (low-level, re-exported for direct use)
export { Input } from "./components/ui/input";
export { FloatingLabelInput } from "./FloatingLabelInput/FloatingLabelInput";
export {
  Dialog,
  DialogPortal,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";
export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "./components/ui/select";
export {
  Table as ShadcnTable,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./components/ui/table";
export { cn } from "./lib/utils";

// Custom components (use shadcn/ui internally)
export { Button } from "./Button/Button";
export { Badge } from "./Badge/Badge";
export { Table } from "./Table/Table";
export { LucideInput } from "./Input/LucideInput";
export { PinInput } from "./PinInput/PinInput";
export { CustomizablePin } from "./PinInput/CustomizablePin";
export { Modal } from "./Modal/Modal";
export { Loader } from "./Loader/Loader";
export { FullLogo } from "./FullLogo/FullLogo";
export { PhotoCapture, usePhotoCapture } from "./PhotoCapture/PhotoCapture";
export { Pagination } from "./Pagination/Pagination";
