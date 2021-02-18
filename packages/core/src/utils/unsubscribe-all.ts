import {
  AsyncSubscription
} from "../types";

export const unsubscribeAll = async (subscriptions: AsyncSubscription[]) => {
  await Promise.all(
    subscriptions.map(value => value.unsubscribe())
  );
}
