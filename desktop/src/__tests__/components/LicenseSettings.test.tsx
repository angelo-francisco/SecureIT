import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/api-client/license", () => ({
  licenseApi: {
    revoke: vi.fn(),
    clearLocal: vi.fn(),
    getCurrent: vi.fn(),
  },
}));

vi.mock("@/lib/websocket", () => ({
  disconnectAll: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/hooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/hooks")>();
  return {
    ...actual,
    useAuthStore: actual.useAuthStore,
  };
});

vi.mock("@/packages/ui", () => ({
  useToast: () => ({ toast: mockToast }),
  Loader: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  Modal: ({ children, open, onClose }: { children?: React.ReactNode; open?: boolean; onClose?: () => void }) =>
    open ? <div data-testid="modal">{children}</div> : null,
}));

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { licenseApi } from "@/api-client/license";
import { disconnectAll } from "@/lib/websocket";
import { useAuthStore } from "@/hooks";
import LicenseSettings from "@/pages/panel/LicenseSettings";

const mockNavigate = vi.fn();
const mockToast = vi.fn();

function resetStore() {
  useAuthStore.setState({
    user: { id: "user-1", email: "test@test.com", name: "Test" },
    selectedProfile: { id: "p1", user_id: "user-1", display_name: "Test" } as never,
  });
}

function renderWithRouter(ui: React.ReactElement) {
  return render(<MemoryRouter>{ui}</MemoryRouter>);
}

async function openRevokeModal() {
  await waitFor(() => {
    expect(screen.queryByText("A carregar...")).not.toBeInTheDocument();
  });
  const revokeButtons = screen.getAllByText("Revogar");
  fireEvent.click(revokeButtons[0]);
  await waitFor(() => {
    expect(screen.getByText("Cancelar")).toBeInTheDocument();
  });
}

function clickConfirmRevoke() {
  const allRevogar = screen.getAllByText("Revogar");
  const confirmBtn = allRevogar[allRevogar.length - 1];
  fireEvent.click(confirmBtn);
}

describe("LicenseSettings - revoke redirects to /profiles", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    resetStore();
    (licenseApi.getCurrent as ReturnType<typeof vi.fn>).mockResolvedValue({
      exists: true,
      license_id: "lic-1",
      license_key: "SEC-TEST-TEST-TEST",
      license_type: "B2C",
      activated_at: "2025-01-01T00:00:00Z",
      expires_at: "2026-12-31T23:59:59Z",
      last_validated_at: null,
      max_cameras: -1,
      max_people: -1,
      features: [],
      status: "ACTIVE",
      days_remaining: 365,
    });
  });

  it("calls disconnectAll after revocation", async () => {
    (licenseApi.revoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (licenseApi.clearLocal as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithRouter(<LicenseSettings />);
    await openRevokeModal();
    clickConfirmRevoke();

    await waitFor(() => {
      expect(disconnectAll).toHaveBeenCalled();
    });
  });

  it("navigates to /profiles after revocation", async () => {
    (licenseApi.revoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (licenseApi.clearLocal as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithRouter(<LicenseSettings />);
    await openRevokeModal();
    clickConfirmRevoke();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/profiles", { replace: true });
    });
  });

  it("clears profile after revocation", async () => {
    (licenseApi.revoke as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
    (licenseApi.clearLocal as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);

    renderWithRouter(<LicenseSettings />);
    await openRevokeModal();
    clickConfirmRevoke();

    await waitFor(() => {
      expect(useAuthStore.getState().selectedProfile).toBeNull();
    });
  });
});
