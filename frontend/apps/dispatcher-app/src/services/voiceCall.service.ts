/**
 * Voice Call Service
 * Управление голосовыми вызовами через WebRTC с поддержкой внешних устройств
 */

export interface VoiceCallConfig {
  callId: string;
  wardId: string;
  wardPhone?: string;
  dispatcherId: string;
}

export interface AudioDevice {
  deviceId: string;
  label: string;
  kind: 'audioinput' | 'audiooutput';
  groupId?: string;
}

export class VoiceCallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private currentInputDevice: string | null = null;
  private currentOutputDevice: string | null = null;
  private isCallActive = false;
  private callConfig: VoiceCallConfig | null = null;

  // WebRTC конфигурация (STUN/TURN серверы)
  private readonly rtcConfig: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      // Добавьте TURN серверы для production
      // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' }
    ],
  };

  /**
   * Инициализировать голосовой вызов
   */
  async initializeCall(config: VoiceCallConfig): Promise<void> {
    this.callConfig = config;
    this.isCallActive = true;

    try {
      // Получаем доступ к микрофону с поддержкой выбора устройства
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          // Позволяет выбрать конкретное устройство
          deviceId: this.currentInputDevice ? { exact: this.currentInputDevice } : undefined,
        },
        video: false,
      });

      // Создаем RTCPeerConnection
      this.peerConnection = new RTCPeerConnection(this.rtcConfig);

      // Добавляем локальный поток
      this.localStream.getTracks().forEach((track) => {
        if (this.peerConnection) {
          this.peerConnection.addTrack(track, this.localStream!);
        }
      });

      // Обработка удаленного потока
      this.peerConnection.ontrack = (event) => {
        this.remoteStream = event.streams[0];
        this.playRemoteAudio(this.remoteStream);
      };

      // Обработка ICE кандидатов
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          // Отправляем ICE кандидат на сервер
          this.sendIceCandidate(event.candidate);
        }
      };

      // Обработка изменения состояния соединения
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('Connection state:', state);
        
        if (state === 'failed' || state === 'disconnected') {
          this.handleCallEnded();
        }
      };

      // Создаем offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Отправляем offer на сервер
      await this.sendOffer(offer);

      console.log('Voice call initialized');
    } catch (error) {
      console.error('Failed to initialize call:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * Принять входящий вызов (получить offer от сервера)
   */
  async acceptCall(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      throw new Error('Peer connection not initialized');
    }

    try {
      await this.peerConnection.setRemoteDescription(offer);

      // Создаем answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Отправляем answer на сервер
      await this.sendAnswer(answer);

      console.log('Call accepted');
    } catch (error) {
      console.error('Failed to accept call:', error);
      throw error;
    }
  }

  /**
   * Установить устройство ввода (микрофон)
   */
  async setInputDevice(deviceId: string): Promise<void> {
    if (!this.localStream) {
      throw new Error('No active call');
    }

    try {
      // Получаем аудио трек
      const audioTracks = this.localStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available');
      }

      // Останавливаем текущий трек
      audioTracks.forEach((track) => track.stop());

      // Получаем новый поток с выбранным устройством
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      // Заменяем трек в локальном потоке
      const newAudioTrack = newStream.getAudioTracks()[0];
      const oldAudioTrack = audioTracks[0];
      
      this.localStream.removeTrack(oldAudioTrack);
      this.localStream.addTrack(newAudioTrack);

      // Обновляем трек в peer connection
      if (this.peerConnection) {
        const sender = this.peerConnection.getSenders().find(
          (s) => s.track?.kind === 'audio'
        );
        if (sender) {
          await sender.replaceTrack(newAudioTrack);
        }
      }

      this.currentInputDevice = deviceId;
      console.log('Input device changed to:', deviceId);
    } catch (error) {
      console.error('Failed to set input device:', error);
      throw error;
    }
  }

  /**
   * Установить устройство вывода (динамики/наушники)
   */
  async setOutputDevice(deviceId: string): Promise<void> {
    this.currentOutputDevice = deviceId;

    if (this.remoteStream) {
      // Переключаем вывод на новое устройство
      this.playRemoteAudio(this.remoteStream, deviceId);
    }

    console.log('Output device changed to:', deviceId);
  }

  /**
   * Получить список доступных аудио устройств
   */
  async getAudioDevices(): Promise<{
    inputs: AudioDevice[];
    outputs: AudioDevice[];
  }> {
    try {
      // Запрашиваем разрешение на доступ к устройствам
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();

      const inputs: AudioDevice[] = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
          kind: 'audioinput' as const,
          groupId: device.groupId,
        }));

      const outputs: AudioDevice[] = devices
        .filter((device) => device.kind === 'audiooutput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Speaker ${device.deviceId.slice(0, 8)}`,
          kind: 'audiooutput' as const,
          groupId: device.groupId,
        }));

      return { inputs, outputs };
    } catch (error) {
      console.error('Failed to get audio devices:', error);
      throw error;
    }
  }

  /**
   * Включить/выключить микрофон
   */
  toggleMute(): boolean {
    if (!this.localStream) {
      return false;
    }

    const audioTracks = this.localStream.getAudioTracks();
    if (audioTracks.length === 0) {
      return false;
    }

    const isMuted = !audioTracks[0].enabled;
    audioTracks.forEach((track) => {
      track.enabled = isMuted;
    });

    return isMuted;
  }

  /**
   * Получить состояние микрофона
   */
  isMuted(): boolean {
    if (!this.localStream) {
      return true;
    }

    const audioTracks = this.localStream.getAudioTracks();
    return audioTracks.length === 0 || !audioTracks[0].enabled;
  }

  /**
   * Завершить вызов
   */
  async endCall(): Promise<void> {
    this.isCallActive = false;
    this.cleanup();
    await this.notifyCallEnded();
  }

  /**
   * Воспроизвести удаленный аудио поток
   */
  private playRemoteAudio(stream: MediaStream, deviceId?: string): void {
    // Создаем audio элемент
    const audio = new Audio();
    audio.srcObject = stream;
    audio.autoplay = true;
    audio.volume = 1.0;

    // Устанавливаем устройство вывода, если поддерживается
    if (deviceId && 'setSinkId' in audio) {
      (audio as any).setSinkId(deviceId).catch((error: any) => {
        console.warn('Failed to set sink ID:', error);
      });
    }

    // Сохраняем ссылку для управления
    (this as any).remoteAudioElement = audio;
  }

  /**
   * Отправить offer на сервер
   */
  private async sendOffer(offer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.callConfig) {
      throw new Error('Call config not set');
    }

    try {
      const { dispatcherApi } = await import('../api/dispatcher.api');
      await dispatcherApi.sendVoiceOffer(this.callConfig.callId, offer);
    } catch (error) {
      console.error('Failed to send offer:', error);
      // Продолжаем работу даже при ошибке отправки
    }
  }

  /**
   * Отправить answer на сервер
   */
  private async sendAnswer(answer: RTCSessionDescriptionInit): Promise<void> {
    if (!this.callConfig) {
      throw new Error('Call config not set');
    }

    try {
      const { dispatcherApi } = await import('../api/dispatcher.api');
      await dispatcherApi.sendVoiceAnswer(this.callConfig.callId, answer);
    } catch (error) {
      console.error('Failed to send answer:', error);
      // Продолжаем работу даже при ошибке отправки
    }
  }

  /**
   * Отправить ICE кандидат на сервер
   */
  private async sendIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    if (!this.callConfig) {
      return;
    }

    try {
      const { dispatcherApi } = await import('../api/dispatcher.api');
      await dispatcherApi.sendIceCandidate(this.callConfig.callId, {
        candidate: candidate.candidate,
        sdpMLineIndex: candidate.sdpMLineIndex,
        sdpMid: candidate.sdpMid,
      });
    } catch (error) {
      console.error('Failed to send ICE candidate:', error);
      // Продолжаем работу даже при ошибке отправки
    }
  }

  /**
   * Уведомить сервер о завершении вызова
   */
  private async notifyCallEnded(): Promise<void> {
    if (!this.callConfig) {
      return;
    }

    try {
      const { dispatcherApi } = await import('../api/dispatcher.api');
      await dispatcherApi.endVoiceCall(this.callConfig.callId);
    } catch (error) {
      console.error('Failed to notify call ended:', error);
      // Продолжаем работу даже при ошибке отправки
    }
  }

  /**
   * Обработка завершения вызова
   */
  private handleCallEnded(): void {
    this.isCallActive = false;
    this.cleanup();
  }

  /**
   * Очистка ресурсов
   */
  private cleanup(): void {
    // Останавливаем локальный поток
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    // Закрываем peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Останавливаем удаленный аудио
    if ((this as any).remoteAudioElement) {
      (this as any).remoteAudioElement.pause();
      (this as any).remoteAudioElement.srcObject = null;
      (this as any).remoteAudioElement = null;
    }

    // Закрываем audio context
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.remoteStream = null;
    this.callConfig = null;
  }

  /**
   * Получить состояние вызова
   */
  getCallState(): {
    isActive: boolean;
    isMuted: boolean;
    inputDevice: string | null;
    outputDevice: string | null;
  } {
    return {
      isActive: this.isCallActive,
      isMuted: this.isMuted(),
      inputDevice: this.currentInputDevice,
      outputDevice: this.currentOutputDevice,
    };
  }
}

// Singleton instance
export const voiceCallService = new VoiceCallService();

