import * as React from "react";
import { ReactElement, useContext, useEffect } from "react";

import styles from "~/components/App/App.module.scss";
import RequestDetails from "~/components/RequestDetails/RequestDetails";
import { Container, Nav, Navbar, NavDropdown } from "react-bootstrap";
import classNames from "classnames";
import Sliders from "~/components/Icons/Sliders";
import Sun from "~/components/Icons/Sun";
import Moon from "~/components/Icons/Moon";
import Trash from "~/components/Icons/Trash";
import { SettingsContext } from "~/contexts/Settings";
import RequestList from "~/components/RequestList/RequestList";
import { ReadyState } from "~/types";
import { ConnectionContext } from "~/contexts/Connection";

interface SettingsMenu {
  icon: ReactElement;
  label: string;
  onClick: () => void;
}

type ReadyStateMap = {
  [ReadyState.CONNECTING]: string;
  [ReadyState.OPEN]: string;
  [ReadyState.CLOSING]: string;
  [ReadyState.CLOSED]: string;
};

const statusIconMap: ReadyStateMap = {
  [ReadyState.CONNECTING]: "🔴",
  [ReadyState.OPEN]: "🟢",
  [ReadyState.CLOSING]: "🔴",
  [ReadyState.CLOSED]: "🔴",
};

const statusTextMap: ReadyStateMap = {
  [ReadyState.CONNECTING]: "Connecting...",
  [ReadyState.OPEN]: "Connected",
  [ReadyState.CLOSING]: "Closing...",
  [ReadyState.CLOSED]: "Closed",
};

export default function App() {
  const { darkMode, setSetting } = useContext(SettingsContext);
  const { config, setSelectedCall, readyState, clear } =
    useContext(ConnectionContext);

  useEffect(() => {
    const url = new URL(config?.url ?? "https://loading...");
    document.title = `${statusIconMap[readyState]} ${url.host} | TTUN`;
  }, [readyState, config?.url]);

  const settingsMenu: (SettingsMenu | null)[] = [
    {
      onClick: () => setSetting("darkMode", !darkMode),
      icon: darkMode ? <Sun /> : <Moon />,
      label: darkMode ? "Light mode" : "Dark mode",
    },
    null,
    {
      onClick: () => {
        setSelectedCall(null);
        clear();
      },
      icon: <Trash />,
      label: "Clear",
    },
  ];

  return (
    config && (
      <div className={styles.app}>
        <Navbar bg="dark" variant="dark" expand as="header">
          <Container fluid>
            <div>
              <Navbar.Brand>TTUN</Navbar.Brand>
              <Navbar.Text>
                {`${statusIconMap[readyState]} ${statusTextMap[readyState]}`}
              </Navbar.Text>
            </div>
            <div className="d-flex">
              <Navbar.Text>
                <a href={config.url} target="_blank">
                  {config.url}
                </a>
              </Navbar.Text>
              <Navbar.Toggle aria-controls="settings" />
              <Navbar.Collapse id="settings" className="ms-2" role="button">
                <Nav>
                  <NavDropdown align="end" title={<Sliders />}>
                    {settingsMenu.map((item, index) => {
                      if (item !== null) {
                        const { onClick, icon, label } = item;
                        return (
                          <NavDropdown.Item
                            key={label}
                            onClick={onClick}
                            className="d-flex align-items-center"
                          >
                            {icon}
                            <span className="ms-3">{label}</span>
                          </NavDropdown.Item>
                        );
                      } else {
                        return <NavDropdown.Divider key={`item-${index}`} />;
                      }
                    })}
                  </NavDropdown>
                </Nav>
              </Navbar.Collapse>
            </div>
          </Container>
        </Navbar>

        <main className={styles.main}>
          <div className={classNames("border-end", styles.sidebar)}>
            <RequestList />
          </div>
          <div className={styles.details}>
            <RequestDetails />
          </div>
        </main>
      </div>
    )
  );
}
