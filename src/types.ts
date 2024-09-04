export interface Settings {
  darkMode: boolean;
}

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

export type RequestResponseType = Request | Response;

export interface WebsocketConnectPayload {
  method: "GET";
  id: string;
  headers: Headers;
  path: string;
  timestamp: string;
}

export interface WebsocketConnect {
  type: "websocket_connect";
  payload: WebsocketConnectPayload;
}

export interface WebsocketConnectedPayload {
  id: string;
  timing: number;
  status: 101;
}

export interface WebsocketConnected {
  type: "websocket_connected";
  payload: WebsocketConnectedPayload;
}

export interface WebsocketInboundPayload {
  id: string;
  timestamp: string;
  body: string;
}

interface WebsocketInbound {
  type: "websocket_inbound";
  payload: WebsocketInboundPayload;
}

export interface WebsocketOutboundPayload {
  id: string;
  timestamp: string;
  body: string;
}

interface WebsocketOutbound {
  type: "websocket_outbound";
  payload: WebsocketOutboundPayload;
}

export interface WebsocketDisconnectPayload {
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
  type: "RequestResponse";
  request: RequestPayload;
  response?: ResponsePayload;
}

export type Frame = WebsocketDisconnect | WebsocketInbound | WebsocketOutbound;
export interface WebsocketConnection {
  type: "WebsocketConnection";
  request: WebsocketConnectPayload;
  response?: WebsocketConnectedPayload;
  frames?: Frame[];
}

export type Call = RequestResponse | WebsocketConnection;

export type Requests = Array<Request | WebsocketConnect>;
export type Responses = { [id: string]: Response | WebsocketConnected };
export type Frames = { [id: string]: Frame[] };

export enum ReadyState {
  CONNECTING = 0,
  OPEN = 1,
  CLOSING = 2,
  CLOSED = 3,
}
