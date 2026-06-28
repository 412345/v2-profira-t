import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/signup")({
  validateSearch: (s: Record<string, unknown>) => ({
    email: typeof s.email === "string" ? s.email : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: "/signin",
      search: { mode: "signup", email: search.email },
    });
  },
});
