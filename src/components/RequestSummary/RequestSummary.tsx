import { RequestResponse } from "~hooks/useRequests";
import * as React from "react";
import classNames from "classnames";

import { Badge, Col, Row } from "react-bootstrap";
import dayjs from "dayjs";

interface RequestSummaryProps {
  selected?: boolean;
  requestResponse: RequestResponse;
  showTime?: boolean;
}

function isBetween(value: number, min: number, max: number) {
  return value >= min && value <= max;
}

function calcBadgeVariant(statusCode: number | undefined): string {
  if (statusCode === undefined) {
    return "secondary";
  } else if (isBetween(statusCode, 100, 199)) {
    return "info";
  } else if (isBetween(statusCode, 200, 299)) {
    return "success";
  } else if (isBetween(statusCode, 300, 399)) {
    return "primary";
  } else if (isBetween(statusCode, 400, 499)) {
    return "danger";
  } else if (isBetween(statusCode, 500, 599)) {
    return "warning";
  }
}

export default function RequestSummary({
  requestResponse: { request, response },
  selected = false,
  showTime = false,
}: RequestSummaryProps) {
  return (
    <Row>
      {showTime && (
        <Col
          className={classNames(
            "flex-grow-0 d-flex align-items-center text-nowrap",
            {
              "text-muted": !selected,
            }
          )}
        >
          {dayjs(request.timestamp).format("LTS")}
        </Col>
      )}
      <Col className="flex-grow-0 d-flex align-items-center">
        {request.method}
      </Col>
      <Col className="flex-grow-1">{request.path}</Col>
      <Col className="flex-grow-0 d-flex align-items-center">
        <Badge
          className={classNames({
            border: selected,
          })}
          bg={calcBadgeVariant(response?.status)}
        >
          {response?.status ?? "Loading..."}
        </Badge>
      </Col>
    </Row>
  );
}
