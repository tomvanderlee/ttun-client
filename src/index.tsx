import * as React from "react";
import * as ReactDOM from "react-dom";
import App from "~/components/App/App";

import "~/index.scss";
import DarkModeProvider from "./contexts/DarkMode";

import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";
dayjs.extend(localizedFormat);

ReactDOM.render(
  <DarkModeProvider>
    <App />
  </DarkModeProvider>,
  document.getElementById("root")
);
