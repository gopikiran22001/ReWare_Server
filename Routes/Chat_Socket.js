const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const url = require('url');
const Message = require('../Models/Message_Model');
const Conversation = require('../Models/Conversation_Model');
const User = require('../Models/User_Model');

const clients = new Map(); // Map of userId -> WebSocket

function initializeChatServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const origin = req.headers.origin;

    // Restrict connections based on origin
    if (origin !== process.env.ORIGIN) {
      ws.close();
      return;
    }

    try {
      const parsedUrl = url.parse(req.url, true);
      const userIdQuery = parsedUrl.query.userId;

      const user = await User.findById(userIdQuery).select('_id');
      if (!user) {
        ws.close();
        return;
      }

      const userId = user._id;
      clients.set(userId.toString(), ws);
      ws.userId = userId.toString();

      // Handle incoming WebSocket messages
      ws.on('message', async (data) => {
        try {
          const { type, payload } = JSON.parse(data);

          // Handle sending message
          if (type === 'SEND_MESSAGE') {
            const { conversationId, text } = payload;

            if (!conversationId) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Missing conversationId or text'
              }));
            }

            const message = await Message.create({
              conversation: conversationId,
              sender: userId,
              text
            });

            await Conversation.findByIdAndUpdate(conversationId, {
              lastMessage: message._id,
              updatedAt: new Date()
            });

            const conversation = await Conversation.findById(conversationId);
            const receiverId = conversation.participants.find(id => id.toString() !== userId.toString());

            const messageData = {
              type: 'NEW_MESSAGE',
              payload: {
                ...message.toObject(),
              }
            };

            // Send to sender
            ws.send(JSON.stringify(messageData));

            // Send to receiver if online
            const receiverSocket = clients.get(receiverId?.toString());
            if (receiverSocket) {
              receiverSocket.send(JSON.stringify(messageData));
            }
          }

          // Handle marking message as seen
          if (type === 'MARK_SEEN') {
            const { messageId } = payload;

            if (!messageId) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Missing messageId'
              }));
            }

            await Message.findByIdAndUpdate(messageId, {
              $addToSet: { seenBy: userId }
            });

            ws.send(JSON.stringify({
              type: 'SEEN_CONFIRMED',
              payload: { messageId }
            }));
          }

          if (type === 'GET_MESSAGES') {
            const { conversationId } = payload;

            if (!conversationId) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Missing conversationId'
              }));
            }

            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Conversation not found'
              }));
            }

            // Optional: Verify if requesting user is a participant
            const isParticipant = conversation.participants.includes(userId);
            if (!isParticipant) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Unauthorized access to conversation'
              }));
            }

            const messages = await Message.find({ conversation: conversationId })
              .sort({ createdAt: 1 }) // earliest to latest
              .populate('sender', 'firstName lastName _id');

            ws.send(JSON.stringify({
              type: 'MESSAGES_HISTORY',
              payload: {
                conversationId,
                messages
              }
            }));
          }


        } catch (err) {
          console.error('WebSocket message error:', err);
          ws.send(JSON.stringify({
            type: 'ERROR',
            payload: 'Invalid data or server error'
          }));
        }
      });

      // Handle socket close
      ws.on('close', () => {
        clients.delete(userId.toString());
      });

    } catch (err) {
      console.error('WebSocket connection error:', err);
      ws.send(JSON.stringify({
        type: 'ERROR',
        payload: 'Invalid or expired userId'
      }));
      ws.close();
    }
  });
}

module.exports = initializeChatServer;
