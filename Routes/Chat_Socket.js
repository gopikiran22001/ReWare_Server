const WebSocket = require('ws');
const url = require('url');
const jwt = require('jsonwebtoken');
const Message = require('../Models/Message_Model');
const Conversation = require('../Models/Conversation_Model');
const User = require('../Models/User_Model');
const Product = require('../Models/Product_Model'); // Assuming you use product to get owner

const clients = new Map(); // userId -> WebSocket

function initializeChatServer(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    const origin = req.headers.origin;
    if (origin !== process.env.ORIGIN) return ws.close();

    const parsedUrl = url.parse(req.url, true);
    const userIdQuery = parsedUrl.query.userId;

    try {
      const user = await User.findById(userIdQuery).select('_id');
      if (!user) return ws.close();

      const userId = user._id.toString();
      clients.set(userId, ws);
      ws.userId = userId;

      console.log(`[CONNECTED] User: ${userId}`);

      ws.on('message', async (data) => {
        try {
          const { type, payload } = JSON.parse(data);
          console.log(`[${type}] from ${userId}`);

          if (type === 'SEND_MESSAGE') {
            const { conversationId, text } = payload;
            const conversation = await Conversation.findById(conversationId);
            if (!conversation || !text) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Invalid conversation or empty message'
              }));
            }

            const isParticipant = conversation.participants.some(
              id => id.toString() === userId
            );
            if (!isParticipant) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Unauthorized access to conversation'
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

            const receiverId = conversation.participants.find(
              id => id.toString() !== userId
            );

            // Notify sender
            ws.send(JSON.stringify({
              type: 'MESSAGE_SENT',
              payload: {
                messageId: message._id,
                conversationId
              }
            }));

            // Notify receiver if online
            const receiverSocket = clients.get(receiverId?.toString());
            if (receiverSocket) {
              receiverSocket.send(JSON.stringify({
                type: 'NEW_MESSAGE',
                payload: { ...message.toObject() }
              }));
            }
          }

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
            const conversation = await Conversation.findById(conversationId);
            if (!conversation) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Conversation not found'
              }));
            }

            const isParticipant = conversation.participants.some(
              id => id.toString() === userId
            );
            if (!isParticipant) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Unauthorized'
              }));
            }

            const messages = await Message.find({ conversation: conversationId })
              .sort({ createdAt: 1 })
              .populate('sender', 'firstName lastName _id');

            ws.send(JSON.stringify({
              type: 'MESSAGES_HISTORY',
              payload: { conversationId, messages }
            }));
          }

          if (type === 'GET_CONVERSATIONS') {
            const conversations = await Conversation.find({ participants: userId })
              .sort({ updatedAt: -1 })
              .lean();

            const formatted = await Promise.all(
              conversations.map(async (conv) => {
                const receiverId = conv.participants.find(
                  id => id.toString() !== userId
                );

                const receiver = await User.findById(receiverId).select('firstName lastName');
                const lastMessage = conv.lastMessage
                  ? await Message.findById(conv.lastMessage).select('text createdAt')
                  : null;

                return {
                  _id: conv._id,
                  updatedAt: conv.updatedAt,
                  receiver: receiver
                    ? { _id: receiver._id, name: `${receiver.firstName} ${receiver.lastName}` }
                    : null,
                  lastMessage
                };
              })
            );

            ws.send(JSON.stringify({
              type: 'CONVERSATIONS_LIST',
              payload: { conversations: formatted }
            }));
          }

          if (type === 'GET_CONVERSATION') {
            const { receiverIdPay, productId } = payload;
            let receiverId = receiverIdPay;

            if (!receiverId && productId) {
              const product = await Product.findById(productId).populate('owner', '_id');
              if (!product) {
                return ws.send(JSON.stringify({
                  type: 'ERROR',
                  payload: 'Product not found'
                }));
              }
              receiverId = product.owner._id.toString();
            }

            if (!receiverId || receiverId === userId) {
              return ws.send(JSON.stringify({
                type: 'ERROR',
                payload: 'Invalid receiver'
              }));
            }

            let conversation = await Conversation.findOne({
              participants: { $all: [userId, receiverId], $size: 2 }
            });

            if (!conversation) {
              conversation = await Conversation.create({
                participants: [userId, receiverId]
              });
            }

            const receiver = await User.findById(receiverId).select('firstName lastName');

            ws.send(JSON.stringify({
              type: 'SINGLE_CONVERSATION',
              payload: {
                _id: conversation._id,
                updatedAt: conversation.updatedAt,
                receiver: {
                  _id: receiver._id,
                  name: `${receiver.firstName} ${receiver.lastName}`
                }
              }
            }));
          }

          if (type === 'PING') {
            ws.send(JSON.stringify({ type: 'PONG' }));
          }

        } catch (err) {
          console.error('[WebSocket Error]', err);
          ws.send(JSON.stringify({
            type: 'ERROR',
            payload: 'Something went wrong'
          }));
        }
      });

      ws.on('close', () => {
        clients.delete(userId);
        console.log(`[DISCONNECTED] User: ${userId}`);
      });

    } catch (err) {
      console.error('[WebSocket connection error]', err);
      ws.close();
    }
  });
}

module.exports = initializeChatServer;
