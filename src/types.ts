export type Headers = [string, string][];
export type Method =
  | "GET"
  | "HEAD"
  | "POST"
  | "PUT"
  | "DELETE"
  | "CONNECT"
  | "OPTIONS"
  | "TRACE"
  | "PATCH";

export interface RequestPayload {
  id: string;
  timestamp: string;
  body: string;
  headers: Headers;
  method: Method;
  path: string;
}

export interface Request {
  type: "request";
  payload: RequestPayload;
}

export interface ResponsePayload {
  id: string;
  timing: number;
  body: string;
  headers: Headers;
  status: number;
}

export interface Response {
  type: "response";
  payload: ResponsePayload;
}

type RequestResponseType = Request | Response;

interface WebsocketConnectPayload {
  id: string;
  headers: Headers;
  path: string;
  timestamp: string;
}

interface WebsocketConnect {
  type: "websocket_connect";
  payload: WebsocketConnectPayload;
}

interface WebsocketConnectedPayload {
  id: string;
  timing: number;
}

interface WebsocketConnected {
  type: "websocket_connected";
  payload: WebsocketConnectedPayload;
}

interface WebsocketInboundPayload {
  id: string;
  timestamp: string;
  body: string;
}

interface WebsocketInbound {
  type: "websocket_inbound";
  payload: WebsocketInboundPayload;
}

interface WebsocketOutboundPayload {
  id: string;
  timestamp: string;
  body: string;
}

interface WebsocketOutbound {
  type: "websocket_outbound";
  payload: WebsocketOutboundPayload;
}

interface WebsocketDisconnectPayload {
  id: string;
  timestamp: string;
  close_code: number;
}

interface WebsocketDisconnect {
  type: "websocket_disconnect";
  payload: WebsocketDisconnectPayload;
}

export type WebsocketType =
  | WebsocketConnect
  | WebsocketConnected
  | WebsocketInbound
  | WebsocketOutbound
  | WebsocketDisconnect;

export interface Historic {
  type: "historic";
  payload: (RequestResponseType | WebsocketType)[];
}

export interface RequestResponse {
  request: RequestPayload;
  response?: ResponsePayload;
}

export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}
