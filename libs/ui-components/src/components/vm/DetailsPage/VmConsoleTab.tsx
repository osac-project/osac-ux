/**
 * VM Serial Console tab — xterm.js terminal wired to the fulfillment-service
 * console API (POST /v1/console_sessions → ticket → WebSocket proxy).
 *
 * In demo mode a simulated boot sequence plays in the terminal.
 * In production the WebSocket URL is constructed from the ticket; a sidecar
 * console-proxy must be reachable at the configured WS base URL.
 */
import { useEffect, useRef, useState } from 'react';
import { Alert, Button, Flex, FlexItem, Label, Spinner } from '@patternfly/react-core';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';

import '@xterm/xterm/css/xterm.css';
import { ConsoleResourceType, ConsoleType, useCreateConsoleSession } from '../../../api/v1/console';

interface Props {
  vmId: string;
  vmName?: string;
  resourceType?: ConsoleResourceType;
}

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Simulated boot lines for demo mode
const BOOT_SEQUENCE = [
  '\x1b[32mBIOS v2.14  Starting...\x1b[0m',
  'GRUB loading...',
  'Linux 6.1.0-osac #1 SMP x86_64',
  '[    0.000000] Initializing cgroup subsys cpuset',
  '[    0.001234] Kernel command line: root=/dev/vda1 console=ttyS0,115200n8',
  '[    0.523100] NET: Registered PF_INET6 protocol family',
  '[    1.200300] \x1b[32m[  OK  ]\x1b[0m Started Initialize Hardware',
  '[    2.400100] \x1b[32m[  OK  ]\x1b[0m Reached target System Initialization',
  '[    3.100200] \x1b[32m[  OK  ]\x1b[0m Started OpenSSH Daemon',
  '[    3.500100] \x1b[32m[  OK  ]\x1b[0m Reached target Multi-User System',
  '',
  'Red Hat Enterprise Linux 9.4 (Plow)',
  'Kernel 6.1.0-osac on an x86_64',
  '',
];

function runDemoSimulation(term: Terminal, vmName: string) {
  let lineIdx = 0;
  const interval = setInterval(() => {
    if (lineIdx < BOOT_SEQUENCE.length) {
      term.writeln(BOOT_SEQUENCE[lineIdx]);
      lineIdx++;
    } else {
      clearInterval(interval);
      term.write(`${vmName} login: `);
      term.focus();
    }
  }, 180);
  return () => clearInterval(interval);
}

type ConsoleState = 'idle' | 'connecting' | 'connected' | 'error';

export const VmConsoleTab = ({
  vmId,
  vmName = 'vm',
  resourceType = ConsoleResourceType.COMPUTE_INSTANCE,
}: Props) => {
  const termRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const [consoleState, setConsoleState] = useState<ConsoleState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [consoleType] = useState<ConsoleType>(ConsoleType.SERIAL);

  const { mutateAsync: createSession, isPending } = useCreateConsoleSession();

  // Mount the xterm terminal once
  useEffect(() => {
    if (!termRef.current || xtermRef.current) {
      return;
    }

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 13,
      fontFamily: '"Red Hat Mono", "Cascadia Mono", monospace',
      theme: {
        background: '#1e1e1e',
        foreground: '#d4d4d4',
        cursor: '#d4d4d4',
      },
      scrollback: 5000,
    });
    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(termRef.current);
    fitAddon.fit();

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    const resizeObserver = new ResizeObserver(() => fitAddon.fit());
    resizeObserver.observe(termRef.current);

    return () => {
      resizeObserver.disconnect();
      term.dispose();
      xtermRef.current = null;
    };
  }, []);

  const disconnect = () => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    wsRef.current?.close();
    wsRef.current = null;
    setConsoleState('idle');
    xtermRef.current?.writeln('\r\n\x1b[33m[Console disconnected]\x1b[0m');
  };

  const connect = async () => {
    if (!xtermRef.current) {
      return;
    }
    setErrorMsg('');
    setConsoleState('connecting');

    const term = xtermRef.current;
    term.clear();
    term.writeln('\x1b[90m[Requesting console session...]\x1b[0m');

    try {
      const session = await createSession({ resourceId: vmId, type: consoleType, resourceType });

      if (DEMO_MODE) {
        term.writeln('\x1b[90m[Connected — demo serial console]\x1b[0m\r\n');
        setConsoleState('connected');
        // Simulate boot and handle input
        const stopSim = runDemoSimulation(term, vmName);
        let inputBuf = '';
        const keyDisposable = term.onKey(({ key, domEvent }) => {
          if (domEvent.key === 'Enter') {
            term.writeln('');
            if (inputBuf === 'exit' || inputBuf === 'logout') {
              disconnect();
            } else if (inputBuf.trim()) {
              term.writeln(`-bash: ${inputBuf.trim()}: command not found`);
            }
            inputBuf = '';
            term.write(`${vmName}:~$ `);
          } else if (domEvent.key === 'Backspace') {
            if (inputBuf.length > 0) {
              inputBuf = inputBuf.slice(0, -1);
              term.write('\b \b');
            }
          } else {
            inputBuf += key;
            term.write(key);
          }
        });
        cleanupRef.current = () => {
          stopSim();
          keyDisposable.dispose();
        };
        return;
      }

      // Production: connect via WebSocket using the ticket
      const wsBase =
        import.meta.env.VITE_CONSOLE_WS_URL ?? window.location.origin.replace(/^http/, 'ws');
      const ws = new WebSocket(`${wsBase}/api/fulfillment/v1/console_proxy/connect`);
      wsRef.current = ws;

      ws.binaryType = 'arraybuffer';

      ws.onopen = () => {
        // Send ticket as first frame (auth handshake)
        ws.send(JSON.stringify({ ticket: session.ticket }));
        setConsoleState('connected');
        term.writeln('\x1b[32m[Connected]\x1b[0m');
      };

      ws.onmessage = (evt) => {
        const data =
          evt.data instanceof ArrayBuffer
            ? new Uint8Array(evt.data)
            : new TextEncoder().encode(evt.data as string);
        term.write(data);
      };

      ws.onerror = () => {
        setConsoleState('error');
        setErrorMsg('WebSocket connection failed. Ensure the console-proxy service is reachable.');
      };

      ws.onclose = () => setConsoleState('idle');

      const keyDisposable = term.onData((data) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(new TextEncoder().encode(data));
        }
      });

      cleanupRef.current = () => keyDisposable.dispose();
    } catch (err) {
      setConsoleState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to create console session');
    }
  };

  const isConnected = consoleState === 'connected';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', height: '100%' }}>
      {/* Toolbar */}
      <Flex spaceItems={{ default: 'spaceItemsSm' }} alignItems={{ default: 'alignItemsCenter' }}>
        <FlexItem>
          {isConnected ? (
            <Button variant="secondary" size="sm" onClick={disconnect}>
              Disconnect
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={connect}
              isLoading={isPending || consoleState === 'connecting'}
              isDisabled={isPending || consoleState === 'connecting'}
            >
              {consoleState === 'connecting' ? 'Connecting…' : 'Connect'}
            </Button>
          )}
        </FlexItem>
        <FlexItem>
          <Label color="grey" isCompact>
            Serial console
          </Label>
        </FlexItem>
        {isConnected && (
          <FlexItem>
            <Label color="green" isCompact>
              Connected
            </Label>
          </FlexItem>
        )}
        {consoleState === 'connecting' && (
          <FlexItem>
            <Spinner size="sm" aria-label="Connecting" />
          </FlexItem>
        )}
        {DEMO_MODE && (
          <FlexItem>
            <Label color="gold" isCompact variant="outline">
              demo
            </Label>
          </FlexItem>
        )}
      </Flex>

      {consoleState === 'error' && (
        <Alert variant="danger" isInline title="Console error">
          {errorMsg}
        </Alert>
      )}

      {!DEMO_MODE && consoleState === 'idle' && (
        <Alert variant="info" isInline title="WebSocket proxy required">
          The serial console requires a running <code>console-proxy</code> sidecar reachable at{' '}
          <code>{import.meta.env.VITE_CONSOLE_WS_URL ?? window.location.origin}</code>. Click{' '}
          <strong>Connect</strong> to attempt connection.
        </Alert>
      )}

      {/* Terminal */}
      <div
        ref={termRef}
        style={{
          flex: 1,
          minHeight: 400,
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid var(--pf-t--global--border--color--default)',
        }}
      />
    </div>
  );
};
