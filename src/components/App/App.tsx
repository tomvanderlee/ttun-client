import * as React from "react";
import useRequests, {RequestResponse, ReadyState} from "../../hooks/useRequests";
import {useEffect, useMemo, useState} from "react";

import styles from './App.module.scss';
import Details from "../Details/Details";
import RequestSummary from "../RequestSummary/RequestSummary";
import {getHost} from "../../utils";
import {Container, Navbar, Col, Row, Nav, ListGroup} from "react-bootstrap";
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
    <>
      <Navbar
        bg="dark"
        variant="dark"
        expand
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
      <Container>

      </Container>
      <Row className={classNames(styles.content, 'gx-0', 'overflow-hidden')}>
        <Col className='border-end overflow-auto' xs={4}>
          <ListGroup variant='flush'>
            {
              calls.length > 0
                ? (
                  calls.slice(0).reverse().map((requestResponse, index) => {
                    const selected = selectedRequestIndex === calls.length - index - 1;
                    return (
                      <ListGroup.Item
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
        </Col>
        <Col xs={8} className=''>
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
        </Col>
      </Row>
    </>
    // <div className={styles.app}>
    //   <header className={styles.header}>
    //     {statusMap[readyState]} TTUN
    //     <a href={config.url} target="_blank">{config.url}</a>
    //   </header>
    //   <main className={styles.main}>
    //     <ul className={styles.sidebar}>
    //       {
    //         calls.length > 0
    //           ? calls.slice(0).reverse().map((requestResponse, index) => (
    //             <li onClick={() => setSelectedRequestIndex(calls.length - index - 1)} key={`request-${index}`}>
    //               <RequestSummary requestResponse={requestResponse} />
    //             </li>
    //           ))
    //           : (
    //             <div className={styles.noRequest}>
    //               <p>No requests</p>
    //             </div>
    //           )
    //       }
    //     </ul>
    //
    //     <div className={styles.details}>
    //       {
    //         selectedRequest !== null
    //           ? (
    //             <Details requestResponse={selectedRequest} />
    //           ) : (
    //             <div className={styles.noRequestSelected}>
    //               <p>Select a request to inspect it</p>
    //             </div>
    //           )
    //       }
    //     </div>
    //   </main>
    // </div>
  );
}
