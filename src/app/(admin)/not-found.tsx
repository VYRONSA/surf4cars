import { ErrorView } from "@/components/shell";

/**
 * An admin URL that does not resolve. Renders inside the admin shell, which supplies the sidebar and
 * the Back control, so this is the body alone.
 */
export default function AdminNotFound() {
  return (
    <ErrorView
      type="404"
      title="That page does not exist."
      description="The link may be old. Use the sidebar to pick a workspace."
    />
  );
}
