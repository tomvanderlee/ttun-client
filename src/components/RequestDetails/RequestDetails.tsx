import * as React from "react";
import { useCallback, useContext, useMemo, useState } from "react";
import styles from "~/components/RequestDetails/RequestDetails.module.scss";
import RequestSummary from "~/components/RequestSummary/RequestSummary";
import Content from "~/components/Content/Content";
import { getHost } from "~/utils";
import { Button, Card, Col, Container, Nav, Row, Table } from "react-bootstrap";
import { Call, Headers, selectedCall } from "~/types";
import { ConnectionContext } from "~/contexts/Connection";
import Frames from "~/components/Frames/Frames";

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

type Tab = "headers" | "request" | "response" | "messages";

export default function RequestDetails() {
  const { selectedCall } = useContext(ConnectionContext);

  const [tab, selectTab] = useState<Tab>("headers");
  const [raw, setRaw] = useState(false);

  const resend = useCallback(
    async () =>
      selectedCall !== null &&
      fetch(`http://${getHost()}/resend/`, {
        method: "POST",
        body: JSON.stringify({
          ...selectedCall.request,
          id: undefined,
        }),
      }),
    [selectedCall]
  );

  return selectedCall !== null ? (
    <div className={styles.details}>
      <div className={styles.header}>
        <Row>
          <Col>
            <Container fluid style={{ fontSize: "1.5em" }} className="py-3">
              <RequestSummary
                requestResponse={selectedCall}
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
              {selectedCall.type === "RequestResponse" && (
                <>
                  <Nav.Item>
                    <Nav.Link
                      eventKey="response"
                      disabled={selectedCall.response === undefined}
                    >
                      Response
                    </Nav.Link>
                  </Nav.Item>
                </>
              )}
              {selectedCall.type === "WebsocketConnection" && (
                <>
                  <Nav.Item>
                    <Nav.Link eventKey="response">Messages</Nav.Link>
                  </Nav.Item>
                </>
              )}
            </Nav>
          </Col>
          <Col className="border-bottom px-3 " xs="auto">
            <Timing timing={selectedCall.response?.timing ?? NaN} />
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
              headers={selectedCall.request.headers}
            />

            {selectedCall.type === "RequestResponse" &&
              selectedCall.response !== undefined && (
                <HeaderTable
                  title="response headers"
                  headers={selectedCall.response.headers}
                />
              )}
          </>
        )}
        {tab === "request" && (
          <Content data={selectedCall.request} raw={raw} setRaw={setRaw} />
        )}
        {selectedCall.type === "RequestResponse" &&
          tab === "response" &&
          selectedCall.response !== undefined && (
            <Content data={selectedCall.response} raw={raw} setRaw={setRaw} />
          )}
        {selectedCall.type === "WebsocketConnection" && tab === "response" && (
          <Frames frames={selectedCall.frames} />
          // <Content data={selectedCall.frames} raw={false} setRaw={setRaw} />
          // <pre>{JSON.stringify(selectedCall.frames, undefined, 2)}</pre>
        )}
      </div>
    </div>
  ) : (
    <div className={styles.noRequestSelected}>
      <p>Select a request to inspect it</p>
    </div>
  );
}
