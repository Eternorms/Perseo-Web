import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/lib/actions/auth", () => ({
  signInAction: vi.fn(async () => ({ error: null })),
  signInWithGoogleAction: vi.fn(async () => {}),
}));

import { LoginForm } from "./login-form";

describe("LoginForm (smoke)", () => {
  it("renderiza e-mail, senha, entrar e OAuth Google", () => {
    render(<LoginForm next={null} />);
    expect(screen.getByLabelText("E-mail")).toBeInTheDocument();
    expect(screen.getByLabelText("Senha")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /entrar/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continuar com google/i })).toBeInTheDocument();
  });

  it("propaga o destino pós-login (?next=) nos dois fluxos", () => {
    const { container } = render(<LoginForm next="/client/criativos" />);
    const hidden = container.querySelectorAll('input[name="next"]');
    expect(hidden).toHaveLength(2);
    hidden.forEach((el) => expect(el).toHaveValue("/client/criativos"));
  });
});
