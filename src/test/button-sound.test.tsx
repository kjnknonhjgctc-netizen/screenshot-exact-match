import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useButtonSound } from "@/delux/components/Common/useButtonSound";
import { AppProvider, useApp } from "@/delux/context/AppContext";

const start = vi.fn();
class TestAudioContext {
  currentTime = 0;
  state = "running";
  destination = {};
  close = vi.fn().mockResolvedValue(undefined);
  createOscillator() {
    return { frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn(), start, stop: vi.fn() };
  }
  createGain() {
    return { gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() };
  }
}

function Buttons({ enabled }: { enabled: boolean }) {
  const sound = useButtonSound(enabled);
  return <div onClickCapture={sound}><button>Interagir</button><button disabled>Bloqueado</button><button data-sound="off">Silenciar</button></div>;
}

function Preferences() {
  const { preferences, updatePreferences } = useApp();
  return <button onClick={() => updatePreferences({ soundEnabled: false })}>{String(preferences.soundEnabled)}</button>;
}

beforeEach(() => {
  localStorage.clear();
  start.mockClear();
  vi.stubGlobal("AudioContext", TestAudioContext);
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe("Sons dos botões", () => {
  it("emite som ao interagir com um botão habilitado", () => {
    render(<Buttons enabled />);
    fireEvent.click(screen.getByText("Interagir"));
    expect(start).toHaveBeenCalledTimes(1);
  });
  it("não emite som quando a opção está desabilitada", () => {
    render(<Buttons enabled={false} />);
    fireEvent.click(screen.getByText("Interagir"));
    expect(start).not.toHaveBeenCalled();
  });
  it("não emite som em botões bloqueados nem ao silenciar", () => {
    render(<Buttons enabled />);
    fireEvent.click(screen.getByText("Bloqueado"));
    fireEvent.click(screen.getByText("Silenciar"));
    expect(start).not.toHaveBeenCalled();
  });
  it("guarda a opção desabilitada e a restaura ao reabrir", () => {
    const view = render(<AppProvider><Preferences /></AppProvider>);
    fireEvent.click(screen.getByText("true"));
    expect(JSON.parse(localStorage.getItem("delux_preferences_v2") ?? "{}").soundEnabled).toBe(false);
    view.unmount();
    render(<AppProvider><Preferences /></AppProvider>);
    expect(screen.getByText("false")).toBeInTheDocument();
  });
});