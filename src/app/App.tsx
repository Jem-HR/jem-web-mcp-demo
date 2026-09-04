import { DemoProvider } from "../demo/DemoProvider";
import { AppShell } from "./AppShell";

export function App() {
  return (
    <DemoProvider>
      <AppShell />
    </DemoProvider>
  );
}
