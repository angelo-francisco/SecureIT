import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/hooks", () => ({
  useAuthStore: Object.assign(vi.fn((selector?: (s: any) => any) => {
    const state = { user: { id: "user-1" } };
    return selector ? selector(state) : state;
  }), { getState: () => ({ user: { id: "user-1" } }) }),
}));

vi.mock("@/hooks/useLicenseGuard", () => ({
  useLicenseGuard: vi.fn(),
}));

vi.mock("@/pages/panel/LicensePage", () => ({
  default: () => <div data-testid="license-page">LicensePage</div>,
}));

vi.mock("lucide-react", () => ({
  Loader: (props: any) => <div data-testid="loader" {...props} />,
  Clock: (props: any) => <div data-testid="icon-clock" {...props} />,
  Ban: (props: any) => <div data-testid="icon-ban" {...props} />,
  WifiOff: (props: any) => <div data-testid="icon-wifi-off" {...props} />,
  MonitorX: (props: any) => <div data-testid="icon-monitor-x" {...props} />,
  ShieldAlert: (props: any) => <div data-testid="icon-shield-alert" {...props} />,
  AlertTriangle: (props: any) => <div data-testid="icon-alert-triangle" {...props} />,
}));

import { LicenseGuard } from "@/components/LicenseGuard";
import { useLicenseGuard } from "@/hooks/useLicenseGuard";

const mockUseLicenseGuard = vi.mocked(useLicenseGuard);

function mockGuard(status: string, licenseInfo: any = null) {
  mockUseLicenseGuard.mockReturnValue({ status, licenseInfo });
}

describe("LicenseGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows spinner when status is loading", () => {
    mockGuard("loading");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(screen.getByTestId("loader")).toBeInTheDocument();
    expect(screen.queryByText("child")).not.toBeInTheDocument();
  });

  it("renders children when status is valid", () => {
    mockGuard("valid");

    render(<LicenseGuard><div data-testid="child">child content</div></LicenseGuard>);

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("child content")).toBeInTheDocument();
    expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
  });

  it("shows license page when status is no_license", () => {
    mockGuard("no_license");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(screen.getByTestId("license-page")).toBeInTheDocument();
    expect(screen.getByText("LicensePage")).toBeInTheDocument();
    expect(screen.queryByText("child")).not.toBeInTheDocument();
  });

  it("shows block screen with Licença Expirada when expired", () => {
    mockGuard("expired");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(screen.getByText("Licença Expirada")).toBeInTheDocument();
    expect(screen.getByText(/licença expirou/i)).toBeInTheDocument();
    expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
  });

  it("shows block screen with Licença Revogada when revoked", () => {
    mockGuard("revoked");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(screen.getByText("Licença Revogada")).toBeInTheDocument();
    expect(screen.getByText(/licença foi revogada/i)).toBeInTheDocument();
    expect(screen.getByTestId("icon-ban")).toBeInTheDocument();
  });

  it("shows block screen with Conexão Necessária when stale", () => {
    mockGuard("stale");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(screen.getByText("Conexão Necessária")).toBeInTheDocument();
    expect(screen.getByText(/precisa de ser validada online/i)).toBeInTheDocument();
    expect(screen.getByTestId("icon-wifi-off")).toBeInTheDocument();
  });

  it("shows block screen for fingerprint_mismatch", () => {
    mockGuard("fingerprint_mismatch");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(screen.getByText("Máquina Não Reconhecida")).toBeInTheDocument();
  });

  it("shows block screen for invalid_signature", () => {
    mockGuard("invalid_signature");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(screen.getByText("Licença Inválida")).toBeInTheDocument();
  });

  it("shows block screen for error status", () => {
    mockGuard("error");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(screen.getByText("Erro de Verificação")).toBeInTheDocument();
  });

  it("calls useLicenseGuard with user id", () => {
    mockGuard("loading");

    render(<LicenseGuard><div>child</div></LicenseGuard>);

    expect(mockUseLicenseGuard).toHaveBeenCalledWith("user-1");
  });
});
