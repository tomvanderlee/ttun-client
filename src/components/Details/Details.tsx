import * as React from "react";
import {
  RequestPayload,
  RequestResponse,
  ResponsePayload
} from "~hooks/useRequests";
import {useCallback, useEffect, useMemo, useState} from "react";
import styles from "./Details.module.scss";
import RequestSummary from "../RequestSummary/RequestSummary";
import classNames from 'classnames';
import Content from "../Content/Content";
import {getHost} from "../../utils";


interface TimingProps {
  timing: number;
}


function Timing({ timing }: TimingProps) {
  const value = useMemo(() => (Math.round(timing * 1000) / 1000), [timing]);
  const showSeconds = useMemo(() => value > 1, [value]);

  return !Number.isNaN(value)
    ? (
      <>
        {`${showSeconds ? value : value * 1000}${ showSeconds ? 's' : 'ms' }`}
      </>
    )
    : null;
}

interface HeadersProps {
  title: string
  headers: {
    [key: string]: string
  }
}

function Headers({ title, headers }: HeadersProps) {
  return (
    <div className={styles.headers}>
      <h2>{ title }</h2>
      {
        Object.entries(headers).map(([key, value]) => (
          <>
            <div>{key}</div>
            <div>{value}</div>
          </>
        ))
      }
    </div>
  )
}

interface DetailsProps {
  requestResponse: RequestResponse
}

type Tab = 'headers' | 'request' | 'response'

export default function Details({ requestResponse }: DetailsProps) {
  const [tab, selectTab] = useState<Tab>('headers');
  const [raw, setRaw] = useState(false);

  const resend = useCallback(async () => fetch(
    `http://${getHost()}/resend/`,
    {
      method: 'POST',
      body: JSON.stringify({
        ...requestResponse.request,
        id: undefined
      })
    }
  ), [requestResponse]);

  return (
    <div className={styles.details}>
      <div className={styles.header}>
        <RequestSummary requestResponse={requestResponse} className={styles.summary}/>

        <div className={styles.tabs}>
          <button
            onClick={() => selectTab('headers')}
            className={classNames(styles.tab, {
              [styles.selected]: tab === 'headers'
            })}
          >
            Headers
          </button>
          <button
            onClick={() => selectTab('request')}
            className={classNames(styles.tab, {
              [styles.selected]: tab === 'request'
            })}
          >
            Request
          </button>
          <button
            onClick={() => selectTab('response')}
            className={classNames(styles.tab, {
              [styles.selected]: tab === 'response'
            })}
            disabled={requestResponse.response === undefined}
          >
            Response
          </button>

          <div className={styles.emptySpace}>
            <Timing timing={requestResponse.response?.timing ?? NaN} />
            <button className={styles.resend} onClick={() => resend()}>Resend</button>
          </div>
        </div>
      </div>
      <div className={styles.content}>
        {
          tab === 'headers' && (
            <>
              <Headers
                title="Request Headers"
                headers={requestResponse.request.headers}
              />
              {
                requestResponse.response && (
                  <Headers
                    title="Response Headers"
                    headers={requestResponse.response.headers}
                  />
                )
              }
            </>
          )
        }
        {
          tab === 'request' && (
            <Content data={requestResponse.request} raw={raw} setRaw={setRaw}/>
          )
        }
        {
          tab === 'response' && requestResponse.response !== undefined && (
            <Content data={requestResponse.response} raw={raw} setRaw={setRaw}/>
          )
        }
      </div>
    </div>
  )
}
