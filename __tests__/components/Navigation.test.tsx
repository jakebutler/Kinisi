import React from "react";
import { render, screen } from "@testing-library/react";
import Navigation from "@/components/dashboard/Navigation";

describe("Navigation", () => {
  it("renders three tiles with correct labels", () => {
    render(<Navigation programId={"abc123"} />);

    expect(screen.getByText(/Intake/i)).toBeInTheDocument();
    expect(screen.getByText(/Survey/i)).toBeInTheDocument();
    expect(screen.getByText(/Personalized/i)).toBeInTheDocument();
    expect(screen.getByText(/Assessment/i)).toBeInTheDocument();
    expect(screen.getByText(/Exercise Program/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ Schedule/i)).toBeInTheDocument();
  });

  it("links to survey results and assessment pages", () => {
    render(<Navigation programId={"abc123"} />);

    const surveyLink = screen.getByRole("link", { name: /Intake\s+Survey/i });
    expect(surveyLink).toHaveAttribute("href", "/survey");

    const assessmentLink = screen.getByRole("link", { name: /Personalized\s+Assessment/i });
    expect(assessmentLink).toHaveAttribute("href", "/assessment");
  });

  it("links to program calendar when programId provided", () => {
    render(<Navigation programId={"prog-1"} />);

    const programLink = screen.getByRole("link", { name: /Exercise Program\s+\+ Schedule/i });
    expect(programLink).toHaveAttribute("href", "/program/prog-1/calendar");
  });

  it("disables program tile when no programId", () => {
    render(<Navigation />);

    const disabledBtn = screen.getByRole("button", { name: /Exercise Program\s+\+ Schedule/i });
    expect(disabledBtn).toBeDisabled();
  });
});
