import { UserRole } from "./enums";


export interface User {
  readonly id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}
