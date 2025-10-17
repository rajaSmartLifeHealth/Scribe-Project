const WebSocket = require('ws');

console.log('🔌 Testing WebSocket connection...');

const ws = new WebSocket('ws://localhost:4500/transcription-stream');

ws.on('open', () => {
  console.log('✅ WebSocket connected successfully!');

  // Test connection message
  ws.send(JSON.stringify({
    type: 'test',
    message: 'Testing connection from client'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  console.log('📨 Received message:', message);

  if (message.type === 'connection') {
    console.log('✅ Connection ID received:', message.connectionId);

    // Test recording start
    setTimeout(() => {
      console.log('🎙️ Testing recording start...');
      ws.send(JSON.stringify({
        type: 'start_recording',
        consultationId: 'TEST-CONS-123'
      }));
    }, 1000);

    // Stop after 3 seconds
    setTimeout(() => {
      console.log('⏹️ Testing recording stop...');
      ws.send(JSON.stringify({
        type: 'stop_recording'
      }));

      // Close connection
      setTimeout(() => {
        ws.close();
        console.log('🔌 Test completed!');
      }, 500);
    }, 3000);
  }
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
});

ws.on('close', () => {
  console.log('🔌 WebSocket closed');
});

// Add timeout
setTimeout(() => {
  console.log('⏰ Test timeout - closing connection');
  ws.close();
}, 10000);