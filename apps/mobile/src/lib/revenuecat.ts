import type { SubscriptionPlan, SubscriptionStateView } from "@/src/types/tonematch";

export function mergeSubscriptionState(
  backendState: SubscriptionStateView | undefined | null,
  revenueCatState: SubscriptionStateView | undefined | null,
): SubscriptionStateView | null {
  if (!backendState && !revenueCatState) {
    return null;
  }

  if (!backendState) {
    return revenueCatState ?? null;
  }

  if (!revenueCatState) {
    return backendState;
  }

  const plan = pickHigherPlan(backendState.plan, revenueCatState.plan);
  const prefersRevenueCat = plan === revenueCatState.plan && plan !== backendState.plan;

  return {
    plan,
    provider: prefersRevenueCat ? revenueCatState.provider : backendState.provider,
    periodEndsAt: latestDate(backendState.periodEndsAt, revenueCatState.periodEndsAt),
  };
}

function pickHigherPlan(planA: SubscriptionPlan, planB: SubscriptionPlan): SubscriptionPlan {
  return planWeight(planA) >= planWeight(planB) ? planA : planB;
}

function planWeight(plan: SubscriptionPlan) {
  if (plan === "pro") {
    return 3;
  }

  if (plan === "plus") {
    return 2;
  }

  return 1;
}

function latestDate(first: string | null, second: string | null) {
  if (!first) {
    return second;
  }

  if (!second) {
    return first;
  }

  return new Date(first).getTime() >= new Date(second).getTime() ? first : second;
}
