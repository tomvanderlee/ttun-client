import * as React from "react";
import {Dispatch, SetStateAction, useMemo} from "react";
import {RequestPayload, ResponsePayload} from "~hooks/useRequests";
import ReactJson from 'react-json-view';
import styles from './Content.module.scss';
import {Button, Col, Container, Row} from "react-bootstrap";

function getHeader(headers: { [key: string]: string }, key: string, unit?: string): string | null {
  console.log(headers, key)
  try {
    const [_, value] = Object
      .entries(headers)
      .find(([headerKey]) => headerKey.toLowerCase() === key.toLowerCase())
    return unit !== undefined
      ? `${value}${unit}`
      : value
  } catch {
    return null;
  }
}

interface ContentProps {
  data: RequestPayload | ResponsePayload
  setRaw: Dispatch<SetStateAction<boolean>>
  raw?: boolean
}

export default function Content({ raw, setRaw, data }: ContentProps): JSX.Element {
  return (
    <div className={styles.content}>
      <Container fluid className="border-bottom">
        <Row className="py-3">
            <Col>
              <input id='raw' type='checkbox' checked={raw} onChange={() => setRaw(!raw)}/>
              <label htmlFor='raw' className="ps-1">Raw</label>
            </Col>
          <Col xs="auto">
            {
              [
                getHeader(data.headers, 'content-length', 'bytes'),
                getHeader(data.headers, 'content-type'),
              ].filter(x => x !== null).join('; ')
            }
          </Col>
        </Row>
      </Container>
      <Row className={styles.body}>
        {(() => {
          try {
            return ContentBody({ data, raw })
          } catch {
            return (
              <div className={styles.renderError}>
                <p>Body could not be rendered</p>
                <Button variant="link" onClick={() => setRaw(true)}>View raw</Button>
              </div>
            )
          }
        })()}
      </Row>
    </div >
  )
};

function ContentBody({ data, raw = false }: Omit<ContentProps, 'setRaw'>) {
    const contentType = useMemo(() => {
      if (raw) {
        return '';
      }

      const type = getHeader(data.headers, 'content-type');
      return type.toLowerCase().split(';')[0];
    }, [data, raw]);

    if (raw) {
      return (
        <pre className="mb-0">
          <code>
            {atob(data.body)}
          </code>
        </pre>
      )
    }

    if (['application/pdf', 'text/html'].includes(contentType)) {
      return <iframe
        src={`data:${contentType};base64,${data.body}`}
        srcDoc={contentType === 'text/html' ? atob(data.body) : undefined}
        loading='lazy'
        sandbox=''
      />
    }

    if (contentType.startsWith('application/json')) {
      return <ReactJson
        src={JSON.parse(atob(data.body))}
        style={{
          padding: '1em',
          width: '100%',
          height: '100%',
        }}
      />
    }

    if (contentType.startsWith('audio')) {
      return <audio src={`data:${contentType};base64,${data.body}`} />
    }

    if (contentType.startsWith('video')) {
      return <video src={`data:${contentType};base64,${data.body}`} />
    }

    if (contentType.startsWith('image')) {
      return <img src={`data:${contentType};base64,${data.body}`} alt=''/>
    }

    throw new Error('Not Rendered');
};
