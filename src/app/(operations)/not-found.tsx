import { ErrorView } from "@/components/shell";

/**
 * An operations URL that does not resolve — usually an invalid `[section]` in a centre's tab.
 *
 * No action link: this renders inside the operations shell, which already has the sidebar and the
 * Back control. A "Browse the marketplace" button would send a staff member out of the portal.
 */
export default function OperationsNotFound() {
  return (
    <ErrorView
      type="404"
      title="That section does not exist."
      description="The link may be old, or the centre may have been reorganised. Use the sidebar to pick a section."
    />
  );
}
