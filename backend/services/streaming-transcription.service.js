const WebSocket = require('ws');
const OpenAI = require('openai');
const { EventEmitter } = require('events');

class StreamingTranscriptionService extends EventEmitter {
  constructor() {
    super();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.activeConnections = new Map();
    this.audioBuffers = new Map();
    this.completeAudioBuffers = new Map(); // Store ALL chunks for final transcription
    this.webmHeaders = new Map(); // Store WebM header chunks for each connection
  }

  initializeWebSocket(server) {
    const wss = new WebSocket.Server({
      server,
      path: '/transcription-stream'
    });

    console.log('🎙️ WebSocket server initialized on /transcription-stream');

    wss.on('connection', (ws, request) => {
      console.log('🎤 New WebSocket connection for streaming transcription');
      console.log('📡 Active connections before:', this.activeConnections.size);

      const connectionId = this.generateConnectionId();
      this.activeConnections.set(connectionId, {
        ws,
        consultationId: null,
        isRecording: false,
        lastTranscript: ''
      });
      this.audioBuffers.set(connectionId, []);
      this.completeAudioBuffers.set(connectionId, []); // Initialize complete audio buffer
      this.webmHeaders.set(connectionId, null); // Initialize header storage

      console.log('🔗 New connection ID:', connectionId);
      console.log('📡 Active connections after:', this.activeConnections.size);

      // Send connection ID to client
      ws.send(JSON.stringify({
        type: 'connection',
        connectionId,
        message: 'Connected to transcription stream'
      }));

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          console.log('📨 Received message from client:', message.type, 'for connection:', connectionId);
          await this.handleMessage(connectionId, message);
        } catch (error) {
          console.error('Error handling message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      });

      ws.on('close', () => {
        console.log('🔌 WebSocket connection closed');
        this.activeConnections.delete(connectionId);
        this.audioBuffers.delete(connectionId);
        this.completeAudioBuffers.delete(connectionId);
        this.webmHeaders.delete(connectionId);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    return wss;
  }

  async handleMessage(connectionId, message) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    switch (message.type) {
      case 'start_recording':
        await this.startRecording(connectionId, message.consultationId);
        break;

      case 'audio_chunk':
        await this.processAudioChunk(connectionId, message.audioData);
        break;

      case 'stop_recording':
        await this.stopRecording(connectionId);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }

  async startRecording(connectionId, consultationId) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    connection.consultationId = consultationId;
    connection.isRecording = true;
    connection.lastTranscript = '';
    connection.errorSent = false; // Reset error flag

    // Clear previous audio buffers and header
    this.audioBuffers.set(connectionId, []);
    this.completeAudioBuffers.set(connectionId, []); // Reset complete buffer for new recording
    this.webmHeaders.set(connectionId, null); // Reset header for new recording

    console.log(`🎙️ Started recording for consultation: ${consultationId}`);

    connection.ws.send(JSON.stringify({
      type: 'recording_started',
      consultationId,
      message: 'Recording started - Speak now!'
    }));
  }

  async processAudioChunk(connectionId, audioData) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection || !connection.isRecording) {
      console.log(`🚫 Ignoring audio chunk - connection active: ${!!connection}, recording: ${connection?.isRecording}`);
      return;
    }

    try {
      // Convert base64 audio data back to buffer
      const audioBuffer = Buffer.from(audioData, 'base64');
      console.log(`🎵 Received audio chunk for connection ${connectionId}: ${audioBuffer.length} bytes`);

      // Store WebM header from first chunk, then add to buffer
      const webmHeader = this.webmHeaders.get(connectionId);
      if (!webmHeader) {
        // First chunk - store as WebM header and skip adding to audio buffers
        this.webmHeaders.set(connectionId, audioBuffer);
        console.log(`📦 Stored WebM header chunk: ${audioBuffer.length} bytes`);
        return; // Don't process header chunk as audio data
      }

      // Add to processing buffer (for live transcription)
      const buffers = this.audioBuffers.get(connectionId) || [];
      buffers.push(audioBuffer);
      this.audioBuffers.set(connectionId, buffers);

      // Also add to complete buffer (for final transcription)
      const completeBuffers = this.completeAudioBuffers.get(connectionId) || [];
      completeBuffers.push(audioBuffer);
      this.completeAudioBuffers.set(connectionId, completeBuffers);

      console.log(`📊 Audio buffer count: ${buffers.length} chunks (processing), ${completeBuffers.length} chunks (complete)`);

      // Accumulate chunks to create valid audio files
      // Process every 8 chunks (~4 seconds) for live transcription
      if (buffers.length >= 8) {
        console.log(`🔥 Processing accumulated chunks #${buffers.length} for transcription`);

        // Take first 8 chunks (sequential processing, no overlap)
        const chunksToProcess = buffers.splice(0, 8); // Remove from array and take first 8

        // Prepend WebM header to create valid WebM file
        const headerChunk = this.webmHeaders.get(connectionId);
        const combinedBuffer = Buffer.concat([headerChunk, ...chunksToProcess]);

        // Update buffer with remaining chunks
        this.audioBuffers.set(connectionId, buffers);

        await this.transcribeAudioChunk(connectionId, combinedBuffer);
      }

    } catch (error) {
      console.error('Error processing audio chunk:', error);
      connection.ws.send(JSON.stringify({
        type: 'error',
        message: 'Error processing audio'
      }));
    }
  }

  async transcribeAudioChunk(connectionId, audioBuffer) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) {
      console.log(`❌ Connection ${connectionId} not found for transcription`);
      return;
    }

    try {
      console.log(`🔥 Sending ${audioBuffer.length} bytes to Whisper for transcription...`);

      // Create a WebM file from header + chunks
      // Header + chunks creates a valid WebM file structure
      const tempFileName = `temp-${connectionId}-${Date.now()}.webm`;
      const audioFile = new File([audioBuffer], tempFileName, {
        type: 'audio/webm;codecs=opus',
        lastModified: Date.now()
      });

      const transcription = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: "whisper-1",
        language: "en",
        response_format: "text",
        temperature: 0.2,
      });

      console.log(`✅ Whisper response: "${transcription}" (length: ${transcription.length})`);

      if (transcription && transcription.trim()) {
        const trimmedText = transcription.trim();

        // Send accumulated real-time transcript to client
        const accumulatedTranscript = connection.lastTranscript
          ? `${connection.lastTranscript} ${trimmedText}`
          : trimmedText;

        connection.ws.send(JSON.stringify({
          type: 'transcript',
          text: accumulatedTranscript,
          timestamp: new Date().toISOString(),
          isPartial: true
        }));

        // Accumulate transcript instead of replacing
        connection.lastTranscript = connection.lastTranscript
          ? `${connection.lastTranscript} ${trimmedText}`
          : trimmedText;

        console.log(`📝 Real-time transcript sent: ${trimmedText.substring(0, 50)}...`);
      } else {
        console.log(`⚠️ Empty transcription received from Whisper`);
      }

    } catch (error) {
      console.error('❌ Transcription error:', error.message || error);

      // Reset error flag on successful chunks to allow retry
      if (error.message && (
          error.message.includes('could not be decoded') ||
          error.message.includes('Invalid file format')
        )) {
        // This is expected for short or invalid chunks, don't send error to client
        connection.errorSent = false;
        return;
      }

      // Only send the first error to notify user there's an issue
      if (!connection.errorSent) {
        connection.ws.send(JSON.stringify({
          type: 'error',
          message: 'Transcription temporarily unavailable',
          timestamp: new Date().toISOString()
        }));
        connection.errorSent = true;
      }
    }
  }

  async stopRecording(connectionId) {
    const connection = this.activeConnections.get(connectionId);
    if (!connection) return;

    connection.isRecording = false;

    console.log(`⏹️ Stopped recording for consultation: ${connection.consultationId}`);

    // Combine all complete audio buffers and do final transcription
    const allBuffers = this.completeAudioBuffers.get(connectionId) || [];
    if (allBuffers.length > 0) {
      // Prepend WebM header to create complete WebM file
      const headerChunk = this.webmHeaders.get(connectionId);
      const combinedBuffer = Buffer.concat([headerChunk, ...allBuffers]);

      console.log(`🔄 Processing final audio: ${combinedBuffer.length} bytes from ${allBuffers.length} chunks + header`);

      try {
        // Create a proper WebM file for the final transcription
        const finalAudioFile = new File([combinedBuffer], `final-${connectionId}-${Date.now()}.webm`, {
          type: 'audio/webm;codecs=opus',
          lastModified: Date.now()
        });

        const finalTranscription = await this.openai.audio.transcriptions.create({
          file: finalAudioFile,
          model: "whisper-1",
          language: "en",
          response_format: "text",
          temperature: 0.2,
        });

        const trimmedTranscription = finalTranscription.trim();

        connection.ws.send(JSON.stringify({
          type: 'transcript',
          text: trimmedTranscription,
          timestamp: new Date().toISOString(),
          isPartial: false,
          isFinal: true
        }));

        console.log(`✅ Final transcription complete: ${trimmedTranscription.substring(0, 100)}...`);

      } catch (error) {
        console.error('❌ Final transcription error:', error.message || error);

        // Send error to client for final transcription
        connection.ws.send(JSON.stringify({
          type: 'error',
          message: 'Final transcription failed',
          timestamp: new Date().toISOString()
        }));
      }
    } else {
      console.log(`⚠️ No audio data to process for final transcription`);
    }

    connection.ws.send(JSON.stringify({
      type: 'recording_stopped',
      message: 'Recording stopped'
    }));
  }

  generateConnectionId() {
    return `conn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  getActiveConnections() {
    return this.activeConnections.size;
  }
}

module.exports = StreamingTranscriptionService;