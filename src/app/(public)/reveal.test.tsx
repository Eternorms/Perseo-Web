import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Reveal } from "./reveal";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Reveal", () => {
  it("revela quando o IntersectionObserver reporta interseção", async () => {
    let trigger: (() => void) | undefined;
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          trigger = () => cb([{ isIntersecting: true } as IntersectionObserverEntry], this as never);
        }
        observe() {}
        disconnect() {}
      },
    );

    render(<Reveal>conteúdo</Reveal>);
    const el = screen.getByText("conteúdo");
    expect(el.className).toContain("reveal");
    expect(el.className).not.toContain("is-visible");

    trigger?.();
    await waitFor(() => expect(el.className).toContain("is-visible"));
  });

  it("sem IntersectionObserver o conteúdo fica visível (fallback)", async () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(
      <Reveal as="article" delay={120}>
        fallback
      </Reveal>,
    );
    const el = screen.getByText("fallback");
    expect(el.tagName).toBe("ARTICLE");
    expect(el.style.transitionDelay).toBe("120ms");
    await waitFor(() => expect(el.className).toContain("is-visible"));
  });
});
