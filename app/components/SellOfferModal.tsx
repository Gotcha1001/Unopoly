import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { useState } from "react";
import { toast } from "sonner";

interface PropertyHolding {
  instanceId: string;
  id: string;
  name: string;
  price: number;
  value: number;
  invested: number;
  upgrades: string[];
}

// components/SellOfferModal.tsx
export function SellOfferModal({
  roomId,
  me,
  opponent,
  property,
  onClose,
}: {
  roomId: Id<"rooms">;
  me: { userId: string; name: string };
  opponent: { userId: string; name: string; isBot: boolean };
  property: PropertyHolding;
  onClose: () => void;
}) {
  const [askPrice, setAskPrice] = useState(property.value);
  const proposeTrade = useMutation(api.trades.proposeTrade);
  const [sending, setSending] = useState(false);

  const send = async () => {
    setSending(true);
    try {
      await proposeTrade({
        roomId,
        fromUserId: me.userId,
        toUserId: opponent.userId,
        offerPropertyIds: [property.instanceId],
        offerCash: 0,
        requestPropertyIds: [],
        requestCash: askPrice,
      });
      toast.success(
        opponent.isBot
          ? `Offer sent to ${opponent.name} — waiting for a response...`
          : `Offer sent to ${opponent.name}`,
      );
      onClose();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="modal">
      <h3>
        🏠 Offer {property.name} to {opponent.name}
      </h3>
      <label>
        How much do you want for it?
        <input
          type="number"
          value={askPrice}
          onChange={(e) => setAskPrice(Number(e.target.value))}
          min={0}
        />
      </label>
      <div className="actions">
        <button onClick={onClose}>Cancel</button>
        <button onClick={send} disabled={sending}>
          Send offer
        </button>
      </div>
    </div>
  );
}
