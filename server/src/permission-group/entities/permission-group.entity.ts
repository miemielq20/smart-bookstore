export class PermissionGroupEntity {
  id!: number;
  name!: string;
  description!: string | null;;
  status!: number;  
  createdAt!: Date;
  updatedAt!: Date;
  memberCount!: number
}