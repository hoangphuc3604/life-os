import { Module } from '@nestjs/common';
import { HeaderAuthGuard } from './header-auth.guard';

@Module({
  providers: [HeaderAuthGuard],
  exports: [HeaderAuthGuard],
})
export class AuthModule {}
