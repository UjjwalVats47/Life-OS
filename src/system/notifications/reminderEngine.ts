import { db } from "@/db/lifeOsDb";
import { nowIso } from "@/lib/dates";
import type { Notification } from "@/types/domain";

export type ReminderDeliveryResult = {
  browserNotificationAttempted: boolean;
  reminders: Notification[];
};

export async function loadReminderCenter(now = new Date()): Promise<Notification[]> {
  const nowTime = now.getTime();
  const reminders = await db.notifications
    .where("status")
    .anyOf(["scheduled", "shown"])
    .toArray();

  return reminders
    .filter((reminder) => reminder.status === "shown" || new Date(reminder.scheduledAt).getTime() <= nowTime)
    .sort((left, right) => left.scheduledAt.localeCompare(right.scheduledAt));
}

export async function deliverDueReminders(now = new Date()): Promise<ReminderDeliveryResult> {
  const dueReminders = await db.notifications
    .where("status")
    .equals("scheduled")
    .filter((reminder) => new Date(reminder.scheduledAt).getTime() <= now.getTime())
    .toArray();

  if (!dueReminders.length) {
    return {
      browserNotificationAttempted: false,
      reminders: []
    };
  }

  const timestamp = nowIso();
  await db.notifications.bulkPut(
    dueReminders.map((reminder) => ({
      ...reminder,
      status: "shown" as const,
      updatedAt: timestamp
    }))
  );

  const browserNotificationAttempted = showBrowserNotifications(dueReminders);

  return {
    browserNotificationAttempted,
    reminders: dueReminders
  };
}

export async function dismissReminder(reminderId: string) {
  await db.notifications.update(reminderId, {
    status: "dismissed",
    updatedAt: nowIso()
  });
}

export async function completeReminder(reminderId: string) {
  await db.notifications.update(reminderId, {
    status: "completed",
    updatedAt: nowIso()
  });
}

function showBrowserNotifications(reminders: Notification[]) {
  if (!("Notification" in window) || Notification.permission !== "granted") return false;

  for (const reminder of reminders) {
    new Notification(reminder.title, {
      body: reminder.body,
      tag: reminder.id
    });
  }

  return true;
}
