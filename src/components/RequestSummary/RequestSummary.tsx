import {RequestResponse} from "~hooks/useRequests";
import * as React from "react";
import classNames from "classnames";

import styles from './RequestSummary.module.scss';

interface RequestSummaryProps {
  requestResponse: RequestResponse
  className?: string
}

function isBetween(value: number, min: number, max: number) {
  return value >= min && value <= max
}

export default function RequestSummary({ requestResponse: { request, response }, className = ''}: RequestSummaryProps) {
  const statusCode = response?.status ?? 0
  return (
    <div className={classNames(styles.requestSummary, className)}>
      <span className={styles.method}>{ request.method }</span>
      <p>{ request.path }</p>
      <span className={classNames(styles.statusCode, {
        [styles.info]: isBetween(statusCode, 100, 199),
        [styles.success]: isBetween(statusCode, 200, 299),
        [styles.redirect]: isBetween(statusCode, 300, 399),
        [styles.clientError]: isBetween(statusCode, 400, 499),
        [styles.serverError]: isBetween(statusCode, 500, 599)
      })}>
        { response?.status ?? 'Loading...'}
      </span>
    </div>
  )
}
