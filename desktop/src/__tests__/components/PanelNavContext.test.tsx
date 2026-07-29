import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { PanelNavContext, usePanelNavigate } from "@/hooks/usePanelNavigate";

function TestConsumer() {
  const nav = usePanelNavigate();
  return (
    <div>
      <span data-testid="has-nav">{nav !== null ? "yes" : "no"}</span>
    </div>
  );
}

function TestCaller() {
  const nav = usePanelNavigate();
  return (
    <button data-testid="call-nav" onClick={() => nav?.("cameras")}>
      navigate
    </button>
  );
}

describe("PanelNavContext", () => {
  it("provides null when no Provider", () => {
    render(<TestConsumer />);
    expect(screen.getByTestId("has-nav").textContent).toBe("no");
  });

  it("provides function when Provider wraps", () => {
    const fn = vi.fn();
    render(
      <PanelNavContext.Provider value={fn}>
        <TestConsumer />
      </PanelNavContext.Provider>
    );
    expect(screen.getByTestId("has-nav").textContent).toBe("yes");
  });

  it("calls provided function on navigate", () => {
    const fn = vi.fn();
    render(
      <PanelNavContext.Provider value={fn}>
        <TestCaller />
      </PanelNavContext.Provider>
    );
    act(() => {
      screen.getByTestId("call-nav").click();
    });
    expect(fn).toHaveBeenCalledWith("cameras");
  });

  it("does not cause infinite re-renders when value is useCallback-stable", () => {
    let renderCount = 0;
    const navFn = vi.fn();

    function Parent() {
      renderCount++;
      const cb = vi.fn((view: string) => navFn(view));
      return (
        <PanelNavContext.Provider value={cb}>
          <TestConsumer />
        </PanelNavContext.Provider>
      );
    }

    const { rerender } = render(<Parent />);
    const initialCount = renderCount;

    for (let i = 0; i < 5; i++) {
      rerender(<Parent />);
    }

    expect(renderCount).toBe(initialCount + 5);
  });
});
