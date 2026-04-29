import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module';
import { ReportsModule } from './reports/reports.module';
import { SchedulesModule } from './schedules/schedules.module';
import { HistoryModule } from './history/history.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    CategoriesModule,
    ReportsModule,
    SchedulesModule,
    HistoryModule,
    AuthModule,
  ],
})
export class AppModule {}
