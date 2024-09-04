import { Frame } from "~/types";
import React, { PropsWithChildren, useContext } from "react";
import { Col, ListGroup, Row } from "react-bootstrap";
import classNames from "classnames";
import styles from "./Frames.module.scss";
import dayjs from "dayjs";
import ReactJson from "react-json-view";
import { SettingsContext } from "~/contexts/Settings";

function isJson(data: any): boolean {
  try {
    JSON.parse(data);
    return true;
  } catch {
    return false;
  }
}

interface FramesProps {
  frames: Frame[];
}

export default function Frames({
  frames,
}: PropsWithChildren<FramesProps>): JSX.Element {
  return (
    <ListGroup variant="flush" as="ul" className={"flex-grow-1"}>
      {frames.length > 0 ? (
        frames.map((frame) => {
          // Inbound relative to the client
          const inbound = frame.type !== "websocket_inbound";

          const body =
            frame.type !== "websocket_disconnect"
              ? atob(frame.payload.body)
              : null;

          return (
            <ListGroup.Item
              as="li"
              key={frame.payload.id}
              className={classNames({
                "border-bottom": true,
              })}
            >
              <Row>
                <Col className="flex-grow-0 d-flex align-items-center text-nowrap text-muted">
                  {dayjs(frame.payload?.timestamp).format("HH:mm:ss.SSS")}
                </Col>
                <Col
                  className={classNames(
                    styles.arrow,
                    "flex-grow-0 d-flex align-items-center flex-nowrap",
                    {
                      [styles.inbound]: inbound,
                      [styles.outbound]: !inbound,
                    }
                  )}
                >
                  {inbound ? "▼" : "▲"}
                </Col>
                <Col className="flex-grow-1">{body}</Col>
              </Row>
            </ListGroup.Item>
          );
        })
      ) : (
        <div className={styles.noRequest}>
          <p>No messages</p>
        </div>
      )}
    </ListGroup>
  );
}
