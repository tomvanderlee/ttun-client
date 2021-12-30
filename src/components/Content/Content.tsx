import styles from "~components/Details/Details.module.scss";
import * as React from "react";
import classNames from "classnames";
import {RequestPayload, ResponsePayload} from "~hooks/useRequests";
import {
  Dispatch,
  forwardRef, SetStateAction,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState
} from "react";
import ReactJson from 'react-json-view';
import styles from './Content.module.scss';

interface ContentProps {
  data: RequestPayload | ResponsePayload
  setRaw: Dispatch<SetStateAction<boolean>>
  raw?: boolean
}

export default function Content({ raw, setRaw, ...props }: ContentProps): JSX.Element {
  return (
    <div className={styles.content}>
      <div className={styles.header}>
        <input id='raw' type='checkbox' checked={raw} onChange={() => setRaw(!raw)}/>
        <label htmlFor='raw'>Raw</label>
      </div>
      <div className={styles.body}>
        {(() => {
          try {
            return ContentBody({ ...props, raw })
          } catch {
            return (
              <div className={styles.renderError}>
                <p>Body could not be rendered</p>
                <a onClick={() => setRaw(true)}>View raw</a>
              </div>
            )
          }
        })()}
      </div>
    </div>
  )
};

function ContentBody({ data, raw = false }: Omit<ContentProps, 'setRaw'>) {
    const contentType = useMemo(() => {
      if (raw) {
        return '';
      }

      const [_, type] = (
        Object
          .entries(data.headers)
          .find(([key]) => key.toLowerCase() === 'content-type')
      );

      return type.toLowerCase().split(';')[0];
    }, [data, raw]);

    if (raw) {
      return <pre>{atob(data.body)}</pre>
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
