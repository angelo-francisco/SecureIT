export type PersonType = "R" | "V" | "W";

export interface Person {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  type: PersonType;
  banned: boolean;
  photo?: string;
  added_at: string;
  updated_at: string;
  get_type_display: string;
  resident?: Resident;
  visitor?: Visitor;
  worker?: Worker;
}

export interface Resident {
  id: number;
  person: Person;
  bi: string;
  residenthome_set: ResidentHome[];
}

export interface ResidentHome {
  id: number;
  home: Home;
  resident: Resident;
}

export interface Home {
  id: number;
  number: string;
  street: string;
}

export interface Visitor {
  id: number;
  person: Person;
  type: string;
  get_type_display: string;
  visit_set: Visit[];
}

export interface Visit {
  id: number;
  visitor: Visitor;
  visited_at: string;
  description?: string;
  visitdestiny_set: VisitDestiny[];
}

export interface VisitDestiny {
  id: number;
  visit: Visit;
  resident: Resident;
}

export interface Worker {
  id: number;
  person: Person;
  bi: string;
  list_fields: string[];
  get_formatted_fields: string;
  workerhome_set: WorkerHome[];
  work_homes: number[];
}

export interface WorkerHome {
  id: number;
  home: Home;
  worker: Worker;
}

export interface VisitorType {
  value: string;
  label: string;
}

export interface Field {
  value: string;
  label: string;
}

export interface Host {
  resident: Resident;
  home: Home;
}

export interface PersonFormData {
  first_name: string;
  last_name: string;
  person_type: PersonType;
  photo?: string;
  // Resident
  "resident-homes"?: string[];
  "resident-bi"?: string;
  // Visitor
  "visitor-type"?: string;
  "visitor-host"?: string[];
  // Worker
  "worker-bi"?: string;
  "worker-fields"?: string[];
  "worker-homes"?: string[];
}
