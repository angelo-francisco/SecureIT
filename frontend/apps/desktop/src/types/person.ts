export interface RoleField {
  id: number;
  label: string;
  field_type: "text" | "number" | "select" | "boolean" | "date";
  required: boolean;
  options: string[] | null;
  sort_order: number;
}

export interface Role {
  id: number;
  name: string;
  description: string | null;
  fields: RoleField[];
  created_at: string;
}

export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  type: string;
  banned: boolean;
  photo?: string;
  added_at: string;
  updated_at: string;
  get_type_display: string;
  roles?: PersonRole[];
}

export interface PersonRole {
  id: number;
  role_id: number;
  role_name: string;
  field_values: Record<string, unknown> | null;
}

export interface Home {
  id: number;
  number: string;
  street: string;
}

export interface PersonFormData {
  first_name: string;
  last_name: string;
  photo_base64: string;
  roles: { role_id: number; field_values?: Record<string, unknown> }[];
}
