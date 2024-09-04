import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "~/components/App/App";

import "~/index.scss";
import SettingsProvider from "./contexts/Settings";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import ConnectionProvider from "~/contexts/Connection";
dayjs.extend(localizedFormat);

ReactDOM.render(
  <SettingsProvider>
    <ConnectionProvider>
      <App />
    </ConnectionProvider>
  </SettingsProvider>,
  document.getElementById("root")
);
