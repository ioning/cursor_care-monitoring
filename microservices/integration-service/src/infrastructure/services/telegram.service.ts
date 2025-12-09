import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { createLogger } from '../../../../shared/libs/logger';

export interface TelegramMessage {
  chatId: string;
  message: string;
}

@Injectable()
export class TelegramService {
  private readonly logger = createLogger({ serviceName: 'integration-service' });
  private readonly botToken = process.env.TELEGRAM_BOT_TOKEN;
  private readonly apiUrl = `https://api.telegram.org/bot${this.botToken}`;

  async send(message: TelegramMessage): Promise<void> {
    try {
      // In development or if no bot token, just log
      if (process.env.NODE_ENV === 'development' || !this.botToken) {
        this.logger.info('Telegram message would be sent', {
          chatId: message.chatId,
          message: message.message.substring(0, 50) + '...',
        });
        return;
      }

      await axios.post(`${this.apiUrl}/sendMessage`, {
        chat_id: message.chatId,
        text: message.message,
        parse_mode: 'Markdown',
      });

      this.logger.info('Telegram message sent successfully', { chatId: message.chatId });
    } catch (error) {
      this.logger.error('Failed to send Telegram message', { error, chatId: message.chatId });
      throw error;
    }
  }
}

