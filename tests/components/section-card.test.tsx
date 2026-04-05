import { render, screen } from "@testing-library/react";
import { SectionCard } from "@/components/section-card";
import type { SectionEnvelope } from "@/lib/types";

describe("SectionCard", () => {
  it("renders empty state text", () => {
    const envelope: SectionEnvelope<null> = {
      status: "empty",
      data: null,
      source: { name: "PDOK", url: "https://example.com" },
      fetchedAt: "2026-04-05T10:00:00.000Z",
    };

    render(<SectionCard title="Foundation" envelope={envelope} />);

    expect(screen.getByText("Foundation")).toBeInTheDocument();
    expect(screen.getByText(/No row from this register/i)).toBeInTheDocument();
  });

  it("renders children for loaded state", () => {
    const envelope: SectionEnvelope<{ ok: boolean }> = {
      status: "loaded",
      data: { ok: true },
      source: { name: "PDOK", url: "https://example.com" },
      fetchedAt: "2026-04-05T10:00:00.000Z",
    };

    render(
      <SectionCard title="Building (BAG)" envelope={envelope}>
        <span>Loaded details</span>
      </SectionCard>,
    );

    expect(screen.getByText("Loaded details")).toBeInTheDocument();
  });
});
