import {useCallback, useEffect, useMemo, useState} from "react";
import {getHost} from "../utils";

type Dict = {
  [key: string]: string
}

export interface RequestPayload {
  id: string
  body: string
  cookies: Dict
  headers: Dict
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  path: string
}

interface Request {
  type: 'request',
  payload: RequestPayload,
}

export interface ResponsePayload {
  id: string
  timing: number
  body: string
  cookies: Dict
  headers: Dict
  status: number
}

interface Response {
  type: 'response',
  payload: ResponsePayload,
}

export interface RequestResponse {
  request: RequestPayload
  response?: ResponsePayload
}

export default function useRequests(): RequestResponse[] {
  const wsHost = useMemo(getHost, []);
  const connect = useCallback(() => new WebSocket(`ws://${wsHost}/inspect/`), [wsHost])

  const [requests, setRequests] = useState<RequestPayload[]>([]);
  const [responses, setResponses] = useState<ResponsePayload[]>([]);
  const [ws, setWs] = useState(() => connect());

  useEffect(() => {
    const reconnect = () => setWs(() => connect())
    const onMessage = ({ data }) => {
      const { type, payload } = JSON.parse(data) as Request | Response

      switch (type) {
        case 'request':
          setRequests((rqs) => [...rqs, payload as RequestPayload])
          break
        case 'response':
          setResponses((rps) => [...rps, payload as ResponsePayload])
          break
      }
    }

    ws.addEventListener('message', onMessage)
    ws.addEventListener('close', reconnect)

    return () => {
      ws.removeEventListener('message', onMessage);
      ws.removeEventListener('close', reconnect);
    }
  }, [ws])

  return useMemo<RequestResponse[]>(() => requests.map((request) => ({
    request: request,
    response: responses.find(({ id }) => id === request.id)
  })), [requests, responses])
}
