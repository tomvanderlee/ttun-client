import * as React from "react";
import { createRoot } from "react-dom/client";
import App from "~/components/App/App";

import "~/index.scss";
import SettingsProvider from "./contexts/Settings";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
import ConnectionProvider from "~/contexts/Connection";
dayjs.extend(localizedFormat);

createRoot(document.getElementById("root")).render(
  <SettingsProvider>
    <ConnectionProvider>
      <App />
    </ConnectionProvider>
  </SettingsProvider>
);
