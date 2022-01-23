import * as React from "react";
import {useEffect, useMemo, useState} from "react";
import useRequests, {
  ReadyState,
  RequestResponse
} from "../../hooks/useRequests";

import styles from './App.module.scss';
import Details from "../Details/Details";
import RequestSummary from "../RequestSummary/RequestSummary";
import {getHost} from "../../utils";
import {Container, ListGroup, Navbar} from "react-bootstrap";
import classNames from "classnames";

interface Config {
  url: string
}

type ReadyStateMap = {
  [ReadyState.CONNECTING]: string,
  [ReadyState.OPEN]: string,
  [ReadyState.CLOSING]: string,
  [ReadyState.CLOSED]: string,
}

const statusMap: ReadyStateMap = {
  [ReadyState.CONNECTING]: '🔴',
  [ReadyState.OPEN]: '🟢',
  [ReadyState.CLOSING]: '🔴',
  [ReadyState.CLOSED]: '🔴',
}

export default function App() {

  const [config, setConfig]= useState<Config | null>(null)

  const { calls, readyState } = useRequests({
    onConnect: async () => {
      const response = await fetch(`http://${getHost()}/config/`)
      const config = await response.json()
      setConfig(config)
    }
  });

  useEffect(() => {
    const url = new URL(config?.url ?? 'https://loading...');
    document.title = `${statusMap[readyState]} ${url.host} | TTUN`;
  }, [readyState, config?.url])

  const [selectedRequestIndex, setSelectedRequestIndex] = useState<number | null>(null);
  const selectedRequest = useMemo<RequestResponse | null>(() => (
    selectedRequestIndex === null
      ? null
      : calls[selectedRequestIndex]
  ), [selectedRequestIndex, calls]);

  return config && (
    <div className={styles.app}>
      <Navbar
        bg="dark"
        variant="dark"
        expand
        as="header"
      >
        <Container fluid>
          <Navbar.Brand>
            {statusMap[readyState]} TTUN
          </Navbar.Brand>
          <Navbar.Text>
            <a href={config.url} target="_blank">{config.url}</a>
          </Navbar.Text>
        </Container>
      </Navbar>

      <main className={styles.main}>
        <ListGroup
          variant='flush'
          as="ul"
          className={classNames("border-end", styles.sidebar)}
        >
          {
            calls.length > 0
              ? (
                calls.slice(0).reverse().map((requestResponse, index) => {
                  const selected = selectedRequestIndex === calls.length - index - 1;
                  return (
                    <ListGroup.Item
                      as="li"
                      onClick={() => setSelectedRequestIndex(calls.length - index - 1)}
                      key={`request-${index}`}
                      className={classNames({
                        'bg-primary': selected,
                        'text-light': selected,
                        'border-bottom': true
                      })}
                    >
                      <RequestSummary
                        requestResponse={requestResponse}
                        selected={selected}
                      />
                    </ListGroup.Item>
                  )
                })
              )
              : (
                <div className={styles.noRequest}>
                  <p>No requests</p>
                </div>
              )
          }
        </ListGroup>
        <div className={styles.details}>
          {
            selectedRequest !== null
              ? (
                <Details requestResponse={selectedRequest} />
              ) : (
                <div className={styles.noRequestSelected}>
                  <p>Select a request to inspect it</p>
                </div>
              )
          }
        </div>
      </main>
    </div>
  );
}
