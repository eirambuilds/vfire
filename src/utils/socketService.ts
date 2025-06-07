
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private userRole: string | null = null;

  initialize(userRole: string): Socket {
    if (this.socket && this.userRole === userRole) {
      return this.socket; // Return existing socket if already connected with same role
    }
    
    try {
      // Close existing socket if changing roles
      if (this.socket) {
        this.socket.disconnect();
      }
      
      this.userRole = userRole;
      
      // Connect to the socket server
      this.socket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000', {
        query: { userRole },
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5,
        reconnectionDelay: 2000,
      });
      
      this.socket.on('connect', () => {
        console.log(`Socket connected with ID: ${this.socket?.id} for role: ${userRole}`);
      });
      
      this.socket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });
      
      this.socket.on('error', (err) => {
        console.error('Socket error:', err);
      });
      
      return this.socket;
    } catch (err) {
      console.error('Socket initialization error:', err);
      // Return a mock socket that doesn't do anything to prevent app crashes
      return {
        on: () => {}, 
        emit: () => {},
        disconnect: () => {},
        id: 'mock-socket',
        connected: false
      } as unknown as Socket;
    }
  }
  
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.userRole = null;
    }
  }
  
  sendNotification(notification: any): void {
    if (this.socket && this.socket.connected) {
      this.socket.emit('sendNotification', {
        ...notification,
        time: new Date().toISOString(),
      });
    } else {
      console.warn('Cannot send notification: Socket not connected');
    }
  }
  
  isConnected(): boolean {
    return this.socket !== null && this.socket.connected;
  }
}

const socketService = new SocketService();
export default socketService;
