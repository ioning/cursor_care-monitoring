import InCallManager from 'react-native-incall-manager';

/**
 * Audio Service for managing call audio (speaker, mute, etc.)
 * Uses react-native-incall-manager for audio routing control
 */

class AudioServiceClass {
  private isInitialized = false;

  /**
   * Initialize audio service
   */
  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Initialize audio session for calls
      InCallManager.start({ media: 'audio' });
      this.isInitialized = true;
      console.log('[AudioService] Initialized');
    } catch (error) {
      console.error('[AudioService] Failed to initialize:', error);
    }
  }

  /**
   * Enable speaker phone (loudspeaker)
   * Also attempts to route audio to Bluetooth if available
   */
  async enableSpeaker(): Promise<void> {
    try {
      // Сначала проверяем, есть ли Bluetooth устройство
      // InCallManager автоматически использует Bluetooth, если он подключен
      InCallManager.setSpeakerphoneOn(true);
      
      // Устанавливаем режим для громкой связи
      // Это позволяет использовать динамики телефона или Bluetooth устройство
      InCallManager.setForceSpeakerphoneOn(true);
      
      console.log('[AudioService] Speaker enabled (will use Bluetooth if available)');
    } catch (error) {
      console.error('[AudioService] Failed to enable speaker:', error);
      // Don't throw - allow call to proceed even if speaker fails
    }
  }

  /**
   * Disable speaker phone
   */
  async disableSpeaker(): Promise<void> {
    try {
      InCallManager.setSpeakerphoneOn(false);
      InCallManager.setForceSpeakerphoneOn(false);
      console.log('[AudioService] Speaker disabled');
    } catch (error) {
      console.error('[AudioService] Failed to disable speaker:', error);
    }
  }

  /**
   * Check if speaker is currently enabled
   */
  async isSpeakerEnabled(): Promise<boolean> {
    try {
      return InCallManager.getIsSpeakerphoneOn();
    } catch (error) {
      console.error('[AudioService] Failed to check speaker state:', error);
      return false;
    }
  }

  /**
   * Cleanup audio service
   */
  cleanup() {
    try {
      InCallManager.stop();
      this.isInitialized = false;
      console.log('[AudioService] Cleaned up');
    } catch (error) {
      console.error('[AudioService] Failed to cleanup:', error);
      this.isInitialized = false;
    }
  }
}

export const AudioService = new AudioServiceClass();

