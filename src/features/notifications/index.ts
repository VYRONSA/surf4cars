/**
 * @module features/notifications
 *
 * Telling a dealership that an enquiry arrived, and being able to prove whether it worked.
 */
export { NotificationHealthCard } from "./components/notification-health-card";
export { resolveEmailProvider } from "./providers/registry";
export { isProviderAvailable } from "./providers/types";
export { getNotificationHealth } from "./server/notification-health.service";
export type { NotificationHealth } from "./server/notification-health.service";
export { notifyDealershipOfEnquiry, sweepDueNotifications } from "./server/notification.service";
export type { NotificationDisposition, NotificationOutcome } from "./server/notification.service";
