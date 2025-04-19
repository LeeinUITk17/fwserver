import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import type { Alert } from '@prisma/client';

@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
})
export class EventsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('EventsGateway');

  afterInit(_server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ..._args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  sendNewAlert(alert: Alert & { sensor?: { name: string } }) {
    this.logger.log(`Emitting new_alert event for Alert ID: ${alert.id}`);
    this.server.emit('new_alert', {
      id: alert.id,
      message: alert.message,
      sensorName: alert.sensor?.name || 'Unknown Sensor', // Handle missing sensor data
      createdAt: alert.createdAt,
    });
  }

  @SubscribeMessage('messageToServer')
  handleMessage(
    @MessageBody() data: string,
    @ConnectedSocket() client: Socket,
  ): void {
    this.logger.log(`Message from ${client.id}: ${data}`);
    client.emit('messageToClient', `Server received: ${data}`);
  }
}
