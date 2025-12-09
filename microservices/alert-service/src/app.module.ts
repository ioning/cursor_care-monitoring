import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AlertController } from './infrastructure/controllers/alert.controller';
import { AlertService } from './application/services/alert.service';
import { AlertRepository } from './infrastructure/repositories/alert.repository';
import { AlertEventPublisher } from './infrastructure/messaging/alert-event.publisher';
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    PassportModule,
    JwtModule.registerAsync({
      useFactory: () => {
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required');
        }
        return {
          secret: jwtSecret,
        };
      },
    }),
  ],
  controllers: [AlertController],
  providers: [AlertService, AlertRepository, AlertEventPublisher, JwtStrategy],
})
export class AppModule {}


    }),
  ],
  controllers: [AlertController],
  providers: [AlertService, AlertRepository, AlertEventPublisher, JwtStrategy],
})
export class AppModule {}


    }),
  ],
  controllers: [AlertController],
  providers: [AlertService, AlertRepository, AlertEventPublisher, JwtStrategy],
})
export class AppModule {}

