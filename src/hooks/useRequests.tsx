import { useCallback, useEffect, useMemo, useState } from "react";
import { getHost } from "~/utils";
import {
  Historic,
  ReadyState,
  Request,
  RequestPayload,
  RequestResponse,
  Response,
  ResponsePayload,
  WebsocketType,
} from "~/types";

export interface useRequestsProps {
  onConnect: () => Promise<void>;
}

export interface UseRequests {
  calls: RequestResponse[];
  readyState: ReadyState;
  clear: () => void;
}

export default function useRequests({
  onConnect,
}: useRequestsProps): UseRequests {
  const wsHost = useMemo(getHost, []);

  const [initialConnection, setInitialConnection] = useState(true);
  const [requests, setRequests] = useState<RequestPayload[]>([]);
  const [responses, setResponses] = useState<ResponsePayload[]>([]);
  const [websocketFrames, setWebsocketFrames] =
    useState<WebsocketType["payload"]>();

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
    const onOpen = () => {
      onConnect();
      setInitialConnection(false);
      setReadyState(ws.readyState);
    };
    const onMessage = ({ data }) => {
      const { type, payload } = JSON.parse(data) as
        | Historic
        | Request
        | Response;

      console.debug(type, payload);

      switch (type) {
        case "historic":
          if (initialConnection) {
            const requests = (payload as (Request | Response)[]).filter(
              ({ type }) => type === "request"
            );
            const responses = (payload as (Request | Response)[]).filter(
              ({ type }) => type === "response"
            );
            setRequests((rqs) => [
              ...rqs,
              ...requests.map(({ payload }) => payload as RequestPayload),
            ]);
            setResponses((rps) => [
              ...rps,
              ...responses.map(({ payload }) => payload as ResponsePayload),
            ]);
          }
          break;
        case "request":
          setRequests((rqs) => [...rqs, payload as RequestPayload]);
          break;
        case "response":
          setResponses((rps) => [...rps, payload as ResponsePayload]);
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

  return {
    calls: useMemo<RequestResponse[]>(
      () =>
        requests.map((request) => ({
          request: request,
          response: responses.find(({ id }) => id === request.id),
        })),
      [requests, responses]
    ),
    readyState,
    clear: () => {
      setRequests([]);
      setResponses([]);
    },
  };
}
