import { ClassValue } from 'clsx';
import * as react_jsx_runtime from 'react/jsx-runtime';
import * as class_variance_authority_types from 'class-variance-authority/types';
import { ButtonHTMLAttributes, ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TableHTMLAttributes, HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes } from 'react';
import { VariantProps } from 'class-variance-authority';
import * as zustand from 'zustand';

declare function cn(...inputs: ClassValue[]): string;

interface PaginatedResponse<T> {
    results: T[];
    count: number;
    page: number;
    num_pages: number;
    has_next: boolean;
    has_previous: boolean;
}
interface ApiError {
    error: string;
}
interface Message {
    message: string;
    tags: "success" | "error" | "warning" | "info";
}

type ConnectionType = "L" | "W";
interface Camera {
    id: number;
    name: string;
    location: string;
    status: boolean;
    connection_type: ConnectionType;
    connection_info: Record<string, unknown> | null;
    video_source: string | number | null;
    face_recognition: boolean;
    created_at: string;
    updated_at: string;
    get_name: string;
}
interface CameraFormData {
    name: string;
    location: string;
    connection_type: ConnectionType;
    connection_info: Record<string, unknown>;
    face_recognition?: boolean;
}

interface RoleField {
    id: number;
    label: string;
    field_type: "text" | "number" | "select" | "boolean" | "date";
    required: boolean;
    options: string[] | null;
    sort_order: number;
}
interface Role {
    id: number;
    name: string;
    description: string | null;
    fields: RoleField[];
    created_at: string;
}
interface Person {
    id: number;
    first_name: string;
    last_name: string;
    full_name: string;
    banned: boolean;
    photo?: string;
    added_at: string;
    updated_at: string;
    roles?: PersonRole[];
}
interface PersonRole {
    id: number;
    role_id: number;
    role_name: string;
    field_values: Record<string, unknown> | null;
}
interface PersonFormData {
    first_name: string;
    last_name: string;
    photo_base64: string;
    banned?: boolean;
    roles: {
        role_id: number;
        field_values?: Record<string, unknown>;
    }[];
}

interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    totpEnabled: boolean;
    isActive: boolean;
    createdAt: string;
}
interface SignupFormData {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    password: string;
}
interface LoginData {
    email: string;
    password: string;
}
interface EmailCodeData {
    email: string;
    code: string;
}
interface TOTPVerifyData {
    code: string;
}
interface AuthResponse {
    user: User;
}
interface SignupRequest {
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    password: string;
}
interface LoginRequest {
    email: string;
    password: string;
}
interface ReAuthData {
    email: string;
    password: string;
}

type NotificationLevel = "I" | "E" | "S" | "P";
interface Notification {
    id: number;
    title: string;
    description: string;
    level: NotificationLevel;
    photo?: string;
    camera: number;
    camera_name: string;
    read: boolean;
    created_at: string;
}
interface NotificationFilter {
    search_query: "A" | "NR" | "R";
}

interface Settings {
    fps: number;
    monitoring_start_time: string;
    monitoring_end_time: string;
    alert_cooldown: number;
    detect_every: number;
    allow_draw: boolean;
}
interface SettingsFormData {
    fps: number;
    mst: string;
    met: string;
    alert_cooldown: number;
    detect_every: number;
    allow_draw: boolean;
}

declare const colors: {
    readonly primary: "#2C9ED5";
    readonly "primary-hover": "#2586B5";
    readonly background: {
        readonly dark: "#101922";
        readonly light: "#ffffff";
    };
    readonly surface: {
        readonly dark: "#1c2127";
        readonly hover: "#283039";
    };
    readonly border: {
        readonly dark: "#3b4754";
    };
    readonly text: {
        readonly muted: "#9dabb9";
        readonly secondary: "#9dabb9";
    };
    readonly success: "#22c55e";
    readonly error: "#ef4444";
    readonly warning: "#f59e0b";
    readonly info: "#3b82f6";
};

declare const typography: {
    readonly fontFamily: {
        readonly display: "'Poppins', sans-serif";
        readonly body: "'Noto Sans', sans-serif";
    };
};

declare const buttonVariants: (props?: ({
    variant?: "primary" | "secondary" | "danger" | "ghost" | "outline" | null | undefined;
    size?: "sm" | "md" | "lg" | "icon" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    icon?: ReactNode;
}
declare function Button({ variant, size, icon, children, className, ...props }: ButtonProps): react_jsx_runtime.JSX.Element;

declare const badgeVariants: (props?: ({
    variant?: "success" | "warning" | "info" | "primary" | "danger" | "outline" | null | undefined;
} & class_variance_authority_types.ClassProp) | undefined) => string;
type BadgeVariant = "success" | "error" | "danger" | "warning" | "info" | "primary" | "outline";
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    children: ReactNode;
}
declare function Badge({ variant, children, className }: BadgeProps): react_jsx_runtime.JSX.Element;

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
}
declare function Input({ className, type, ...props }: InputProps): react_jsx_runtime.JSX.Element;

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
    options: {
        value: string;
        label: string;
    }[];
}
declare function Select({ options, className, ...props }: SelectProps): react_jsx_runtime.JSX.Element;

declare const ShadcnTable: ({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) => react_jsx_runtime.JSX.Element;
declare const TableHeader: ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => react_jsx_runtime.JSX.Element;
declare const TableBody: ({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) => react_jsx_runtime.JSX.Element;
declare const TableRow: ({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) => react_jsx_runtime.JSX.Element;
declare const TableHead: ({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) => react_jsx_runtime.JSX.Element;
declare const TableCell: ({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) => react_jsx_runtime.JSX.Element;
interface Column {
    key: string;
    header: string;
    render?: (item: Record<string, unknown>) => ReactNode;
    className?: string;
}
interface TableProps {
    columns: Column[];
    data: Record<string, unknown>[];
}
declare function Table({ columns, data }: TableProps): react_jsx_runtime.JSX.Element;

interface ModalProps {
    open: boolean;
    onClose?: () => void;
    children: ReactNode;
    className?: string;
}
declare function Modal({ open, onClose, children, className }: ModalProps): react_jsx_runtime.JSX.Element | null;

interface LoaderProps {
    w?: number;
}
declare function Loader({ w }: LoaderProps): react_jsx_runtime.JSX.Element;

interface PaginationProps {
    page: number;
    numPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
    onPageChange: (page: number) => void;
}
declare function Pagination({ page, numPages, hasNext, hasPrevious, onPageChange, }: PaginationProps): react_jsx_runtime.JSX.Element;

type ToastType = "success" | "error" | "warning" | "info";
interface Toast {
    id: string;
    type: ToastType;
    message: string;
    onClick?: () => void;
}
interface ToastState {
    toasts: Toast[];
    addToast: (toast: Omit<Toast, "id">) => void;
    removeToast: (id: string) => void;
}
declare const useToastStore: zustand.UseBoundStore<zustand.StoreApi<ToastState>>;
declare function ToastContainer(): react_jsx_runtime.JSX.Element | null;

interface ToggleProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
    label?: string;
}
declare function Toggle({ label, checked, onChange, ...props }: ToggleProps): react_jsx_runtime.JSX.Element;

interface FullLogoProps {
    className?: string;
}
declare function FullLogo({ className }: FullLogoProps): react_jsx_runtime.JSX.Element;

export { type ApiError, type AuthResponse, Badge, type BadgeProps, type BadgeVariant, Button, type ButtonProps, type Camera, type CameraFormData, type Column, type ConnectionType, type EmailCodeData, FullLogo, Input, type InputProps, Loader, type LoginData, type LoginRequest, type Message, Modal, type Notification, type NotificationFilter, type NotificationLevel, type PaginatedResponse, Pagination, type Person, type PersonFormData, type PersonRole, type ReAuthData, type Role, type RoleField, Select, type SelectProps, type Settings, type SettingsFormData, ShadcnTable, type SignupFormData, type SignupRequest, type TOTPVerifyData, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, ToastContainer, Toggle, type User, badgeVariants, buttonVariants, cn, colors, typography, useToastStore };
