import * as React from "react";

import {
  Context,
  createContext,
  PropsWithChildren,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Call,
  Frame,
  Frames,
  Historic,
  ReadyState,
  Request,
  RequestResponseType,
  Requests,
  Response,
  ResponsePayload,
  Responses,
  WebsocketConnect,
  WebsocketConnected,
  WebsocketConnectedPayload,
  WebsocketDisconnectPayload,
  WebsocketInboundPayload,
  WebsocketOutboundPayload,
  WebsocketType,
} from "~/types";
import { getHost } from "~/utils";

interface Config {
  url: string;
}

interface ConnectionApi {
  config: Config | null;
  calls: Call[];
  selectedCall: Call | null;
  setSelectedCall: (call: Call | null) => void;
  readyState: ReadyState;
  clear: () => void;
}

export const ConnectionContext = createContext<Partial<ConnectionApi>>(
  {}
) as Context<ConnectionApi>;

export default function ConnectionProvider({
  children,
}: PropsWithChildren<any>): JSX.Element {
  const [selectedCall, setSelectedCall] = useState<Call | null>(null);
  const [config, setConfig] = useState<Config | null>(null);

  const wsHost = useMemo(getHost, []);

  const [initialConnection, setInitialConnection] = useState(true);
  const [requests, setRequests] = useState<Requests>([]);
  const [responses, setResponses] = useState<Responses>({});
  const [websocketFrames, setWebsocketFrames] = useState<Frames>({});

  const connect = useCallback(
    () => new WebSocket(`ws://${wsHost}/inspect/`),
    [wsHost]
  );

  const [ws, setWs] = useState<WebSocket>(() => connect());
  const [readyState, setReadyState] = useState<ReadyState>(ws.readyState);

  useEffect(() => {
    setReadyState(ws.readyState);

    const onClose = () => {
      setReadyState(ws.readyState);
      setWs(connect());
    };

    const onOpen = async () => {
      const response = await fetch(`http://${getHost()}/config/`);
      const config = await response.json();
      setConfig(config);

      setInitialConnection(false);
      setReadyState(ws.readyState);
    };

    const onMessage = ({ data }: { data: string }) => {
      const { type, payload } = JSON.parse(data) as
        | Historic
        | RequestResponseType
        | WebsocketType;

      switch (type) {
        case "historic":
          if (initialConnection) {
            const requests = (
              payload as (RequestResponseType | WebsocketType)[]
            )
              .filter(
                ({ type }) => type === "request" || type == "websocket_connect"
              )
              .map((payload) => {
                if (
                  (payload as WebsocketConnect).payload.method === undefined
                ) {
                  (payload as Request | WebsocketConnect).payload.method =
                    "GET";
                }

                return payload;
              });
            const responses = (
              payload as (RequestResponseType | WebsocketType)[]
            )
              .filter(
                ({ type }) =>
                  type === "response" || type == "websocket_connected"
              )
              .map(({ type, ...item }) => {
                if (type == "websocket_connected") {
                  (item.payload as WebsocketConnectedPayload).status = 101;
                }

                return { type, ...item };
              })
              .reduce<{ [id: string]: Response | WebsocketConnected }>(
                (out, item) => ({
                  ...out,
                  [item.payload.id]: item as Response | WebsocketConnected,
                }),
                {}
              );
            const frames = (payload as (RequestResponseType | WebsocketType)[])
              .filter(
                ({ type }) =>
                  type == "websocket_inbound" ||
                  type == "websocket_outbound" ||
                  type == "websocket_disconnect"
              )
              .reduce<Frames>((out, item) => {
                if (!out.hasOwnProperty(item.payload.id)) {
                  out[item.payload.id] = [];
                }

                out[item.payload.id].push(item as Frame);
                return out;
              }, {});
            setRequests((rqs) => [
              ...rqs,
              ...requests.map(
                (payload) => payload as Request | WebsocketConnect
              ),
            ]);
            setResponses((rps) => ({
              ...rps,
              ...responses,
            }));
            setWebsocketFrames((frms) => ({
              ...frms,
              ...frames,
            }));
          }
          break;
        case "request":
        case "websocket_connect":
          setRequests((rqs) => [
            ...rqs,
            {
              type,
              payload:
                type === "request"
                  ? payload
                  : {
                      ...payload,
                      method: "GET",
                    },
            } as Request | WebsocketConnect,
          ]);
          break;
        case "response":
        case "websocket_connected":
          if (type == "websocket_connected") {
            (payload as WebsocketConnectedPayload).status = 101;
          }
          setResponses((rps) => ({
            ...rps,
            [(payload as ResponsePayload | WebsocketConnectedPayload).id]: {
              type,
              payload,
            } as Response | WebsocketConnected,
          }));
          break;
        case "websocket_inbound":
        case "websocket_outbound":
        case "websocket_disconnect":
          setWebsocketFrames((frms) => {
            const id = (
              payload as
                | WebsocketInboundPayload
                | WebsocketOutboundPayload
                | WebsocketDisconnectPayload
            ).id;

            const newFrms = { ...frms };

            if (!newFrms.hasOwnProperty(id)) {
              newFrms[id] = [];
            }

            // @ts-ignore
            newFrms[id].push({
              type,
              payload: payload as
                | WebsocketInboundPayload
                | WebsocketOutboundPayload
                | WebsocketDisconnectPayload,
            });

            return newFrms;
          });
          break;
      }
    };

    ws.addEventListener("message", onMessage);
    ws.addEventListener("close", onClose);
    ws.addEventListener("open", onOpen);

    return () => {
      ws.removeEventListener("message", onMessage);
      ws.removeEventListener("close", onClose);
      ws.removeEventListener("open", onOpen);
    };
  }, [ws]);

  const calls = useMemo<Call[]>(
    () =>
      requests.map((request) => {
        let call: Call;
        if (request.type === "request") {
          call = {
            type: "RequestResponse",
            request: request.payload,
            response: responses[request.payload.id]?.payload as ResponsePayload,
          };
        } else {
          call = {
            type: "WebsocketConnection",
            request: request.payload,
            response: responses[request.payload.id]
              ?.payload as WebsocketConnectedPayload,
            frames: websocketFrames[request.payload.id] ?? [],
          };
        }

        if (
          selectedCall !== null &&
          selectedCall.request.id === call.request.id
        ) {
          setSelectedCall(call);
        }

        return call;
      }),
    [requests, responses, websocketFrames]
  );

  return (
    <ConnectionContext.Provider
      value={{
        config,
        calls,
        selectedCall,
        setSelectedCall,
        readyState,
        clear: () => {
          setRequests([]);
          setResponses({});
          setWebsocketFrames({});
        },
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
}
