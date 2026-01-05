import { Module } from '@nestjs/common';
import { BancardController } from './bancard.controller';
import { BancardService } from './bancard.service';
import { CashoutController } from './cashout.controller';
import { CashoutService } from './cashout.service';
import { QRController } from './qr.controller';
import { QRService } from './qr.service';

@Module({
  controllers: [BancardController, CashoutController, QRController],
  providers: [BancardService, CashoutService, QRService],
  exports: [BancardService, CashoutService, QRService],
})
export class BancardModule {}