"use client";
import React from "react";
import { Button } from "@/components/Button";
import axios from "@/lib/axios"
import { toast } from "react-hot-toast";

type ManagementSubscriptionProps = {
  userId: string;
  isPro: boolean;
};

export default function ManagementSubscription({ userId, isPro }: ManagementSubscriptionProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isCancelled, setIsCancelled] = React.useState(false);

  const handleSubscriptionAction = async (action: "cancel" | "resume") => {
    try {
      setIsLoading(true);
      const { message } = await axios.post<any, { message: string }>(
        `/api/payment/${action}-subscription`,
        { userId }
      );
      toast.success(message);
      setIsCancelled(action === "cancel");
      // Refresh the page to update subscription status
      window.location.reload();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isPro) return null;

  return (
    <div className="mt-4">
      {!isCancelled ? (
        <Button
          variant="outline"
          onClick={() => handleSubscriptionAction("cancel")}
          disabled={isLoading}
        >
          Cancel Subscription
        </Button>
      ) : (
        <Button
          className="ml-2"
          onClick={() => handleSubscriptionAction("resume")}
          disabled={isLoading}
        >
          Resume Subscription
        </Button>
      )}
    </div>
  );
}