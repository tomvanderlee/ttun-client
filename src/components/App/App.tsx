import * as React from "react";
import useRequests, {RequestResponse} from "../../hooks/useRequests";
import {useEffect, useMemo, useState} from "react";

import styles from './App.module.scss';
import Details from "../Details/Details";
import RequestSummary from "../RequestSummary/RequestSummary";
import {getHost} from "../../utils";

interface Config {
  url: string
}

export default function App() {
  const [config, setConfig]= useState<Config | null>(null)
  useEffect(() => {
    fetch(`http://${getHost()}/config/`)
      .then(response => response.json() as Promise<Config>)
      .then(setConfig)
  }, [])

  const requests = useRequests();
  const [selectedRequestIndex, setSelectedRequestIndex] = useState<number | null>(null);
  const selectedRequest = useMemo<RequestResponse | null>(() => (
    selectedRequestIndex === null
      ? null
      : requests[selectedRequestIndex]
  ), [selectedRequestIndex, requests]);

  return config && (
    <div className={styles.app}>
      <header className={styles.header}>
        TTUN
        <a href={config.url} target="_blank">{config.url}</a>
      </header>
      <main className={styles.main}>
        <ul className={styles.sidebar}>
          {
            requests.length > 0
              ? requests.slice(0).reverse().map((requestResponse, index) => (
                <li onClick={() => setSelectedRequestIndex(requests.length - index - 1)} key={`request-${index}`}>
                  <RequestSummary requestResponse={requestResponse} />
                </li>
              ))
              : (
                <div className={styles.noRequest}>
                  <p>No requests</p>
                </div>
              )
          }
        </ul>

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
