import { Module } from "@nestjs/common"
import { PrismaModule } from "../prisma/prisma.module"
import { PermissionGroupController } from "./permission-group.controller"
import { PermissionGroupService } from "./permission-group.service"

@Module({
  imports: [PrismaModule],
  controllers: [PermissionGroupController],
  providers: [PermissionGroupService],
})
export class PermissionGroupModule {}