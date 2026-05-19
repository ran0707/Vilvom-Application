import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { DroneRequest, DroneRequestSchema } from '@app/database';
import { DroneController } from './drone.controller';
import { DroneService } from './drone.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: DroneRequest.name, schema: DroneRequestSchema }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'default-secret',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
  ],
  controllers: [DroneController],
  providers: [DroneService, JwtAuthGuard],
  exports: [DroneService],
})
export class DroneModule {}