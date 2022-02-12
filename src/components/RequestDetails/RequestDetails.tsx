import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { Headers, RequestResponse } from "~/hooks/useRequests";
import styles from "~/components/RequestDetails/RequestDetails.module.scss";
import RequestSummary from "~/components/RequestSummary/RequestSummary";
import Content from "~/components/Content/Content";
import { getHost } from "~/utils";
import { Button, Card, Col, Container, Nav, Row, Table } from "react-bootstrap";

interface TimingProps {
  timing: number;
}

function Timing({ timing }: TimingProps) {
  const value = useMemo(() => Math.round(timing * 1000) / 1000, [timing]);
  const showSeconds = useMemo(() => value > 1, [value]);

  return !Number.isNaN(value) ? (
    <>{`${showSeconds ? value : value * 1000}${showSeconds ? "s" : "ms"}`}</>
  ) : null;
}

interface HeaderTableProps {
  title: string;
  headers: Headers;
}

function HeaderTable({ title, headers }: HeaderTableProps) {
  return (
    <Card className="m-3">
      <Table striped responsive borderless hover className="mb-0">
        <thead>
          <tr>
            <th colSpan={2} className="bg-dark text-white rounded-top">
              {title}
            </th>
          </tr>
        </thead>
        <tbody>
          {headers.map(([key, value]) => (
            <tr>
              <td>{key}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}

interface DetailsProps {
  requestResponse: RequestResponse | null;
}

type Tab = "headers" | "request" | "response";

export default function RequestDetails({ requestResponse }: DetailsProps) {
  const [tab, selectTab] = useState<Tab>("headers");
  const [raw, setRaw] = useState(false);

  const resend = useCallback(
    async () =>
      requestResponse !== null &&
      fetch(`http://${getHost()}/resend/`, {
        method: "POST",
        body: JSON.stringify({
          ...requestResponse.request,
          id: undefined,
        }),
      }),
    [requestResponse]
  );

  return requestResponse !== null ? (
    <div className={styles.details}>
      <div className={styles.header}>
        <Row>
          <Col>
            <Container fluid style={{ fontSize: "1.5em" }} className="py-3">
              <RequestSummary
                requestResponse={requestResponse}
                className={styles.summary}
              />
            </Container>
          </Col>
        </Row>
        <Row className="gx-0 d-flex">
          <Col>
            <Nav
              variant="tabs"
              activeKey={tab}
              onSelect={(tab) => selectTab(tab as Tab)}
            >
              <Nav.Item>
                <Nav.Link eventKey="headers">Headers</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="request">Request</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link
                  eventKey="response"
                  disabled={requestResponse.response === undefined}
                >
                  Response
                </Nav.Link>
              </Nav.Item>
            </Nav>
          </Col>
          <Col className="border-bottom px-3 " xs="auto">
            <Timing timing={requestResponse.response?.timing ?? NaN} />
            <Button
              variant="outline-primary"
              onClick={() => resend()}
              className="ms-3"
            >
              Resend
            </Button>
          </Col>
        </Row>
      </div>
      <div className={styles.content}>
        {tab === "headers" && (
          <>
            <HeaderTable
              title="request headers"
              headers={requestResponse.request.headers}
            />
            {requestResponse.response && (
              <HeaderTable
                title="response headers"
                headers={requestResponse.response.headers}
              />
            )}
          </>
        )}
        {tab === "request" && (
          <Content data={requestResponse.request} raw={raw} setRaw={setRaw} />
        )}
        {tab === "response" && requestResponse.response !== undefined && (
          <Content data={requestResponse.response} raw={raw} setRaw={setRaw} />
        )}
      </div>
    </div>
  ) : (
    <div className={styles.noRequestSelected}>
      <p>Select a request to inspect it</p>
    </div>
  );
}
