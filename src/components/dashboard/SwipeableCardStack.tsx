import { useState, useCallback } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence, PanInfo } from "framer-motion";
import { Check, X, Eye } from "lucide-react";
import { cn } from "@/lib/utils";

interface SwipeableCardStackProps<T> {
  items: T[];
  renderCard: (item: T) => React.ReactNode;
  onSwipeRight?: (item: T) => void;
  onSwipeLeft?: (item: T) => void;
  rightLabel?: string;
  leftLabel?: string;
  rightIcon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  emptyMessage?: React.ReactNode;
  className?: string;
}

const SWIPE_THRESHOLD = 100;

function SwipeableCard<T>({
  item,
  renderCard,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "Accept",
  leftLabel = "Decline",
  rightIcon,
  leftIcon,
  isTop,
}: {
  item: T;
  renderCard: (item: T) => React.ReactNode;
  onSwipeRight?: (item: T) => void;
  onSwipeLeft?: (item: T) => void;
  rightLabel: string;
  leftLabel: string;
  rightIcon: React.ReactNode;
  leftIcon: React.ReactNode;
  isTop: boolean;
}) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const rightOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) {
      onSwipeRight?.(item);
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      onSwipeLeft?.(item);
    }
  };

  return (
    <motion.div
      className="absolute inset-0 touch-none"
      style={{ x, rotate, zIndex: isTop ? 10 : 1 }}
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.8}
      onDragEnd={handleDragEnd}
      initial={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 8, opacity: isTop ? 1 : 0.7 }}
      animate={{ scale: isTop ? 1 : 0.95, y: isTop ? 0 : 8, opacity: isTop ? 1 : 0.7 }}
      exit={{ 
        x: x.get() > 0 ? 300 : -300, 
        opacity: 0, 
        rotate: x.get() > 0 ? 20 : -20,
        transition: { duration: 0.3 } 
      }}
    >
      {/* Swipe indicators */}
      {isTop && (
        <>
          <motion.div
            className="absolute top-4 right-4 z-20 flex items-center gap-1.5 rounded-lg border-2 border-success bg-success/10 px-3 py-1.5 font-bold text-success"
            style={{ opacity: rightOpacity }}
          >
            {rightIcon}
            {rightLabel}
          </motion.div>
          <motion.div
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5 rounded-lg border-2 border-destructive bg-destructive/10 px-3 py-1.5 font-bold text-destructive"
            style={{ opacity: leftOpacity }}
          >
            {leftIcon}
            {leftLabel}
          </motion.div>
        </>
      )}

      <div className="h-full w-full select-none">
        {renderCard(item)}
      </div>
    </motion.div>
  );
}

export default function SwipeableCardStack<T extends { id: string }>({
  items,
  renderCard,
  onSwipeRight,
  onSwipeLeft,
  rightLabel = "Accept",
  leftLabel = "Decline",
  rightIcon = <Check className="w-5 h-5" />,
  leftIcon = <X className="w-5 h-5" />,
  emptyMessage,
  className,
}: SwipeableCardStackProps<T>) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const activeItems = items.filter((item) => !dismissed.has(item.id));
  const visibleItems = activeItems.slice(0, 3);

  const handleSwipeRight = useCallback(
    (item: T) => {
      setDismissed((prev) => new Set(prev).add(item.id));
      onSwipeRight?.(item);
    },
    [onSwipeRight]
  );

  const handleSwipeLeft = useCallback(
    (item: T) => {
      setDismissed((prev) => new Set(prev).add(item.id));
      onSwipeLeft?.(item);
    },
    [onSwipeLeft]
  );

  if (activeItems.length === 0) {
    return <>{emptyMessage}</>;
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Card stack */}
      <div className="relative mx-auto w-full" style={{ minHeight: 340 }}>
        <AnimatePresence>
          {visibleItems.map((item, i) => (
            <SwipeableCard
              key={item.id}
              item={item}
              renderCard={renderCard}
              onSwipeRight={handleSwipeRight}
              onSwipeLeft={handleSwipeLeft}
              rightLabel={rightLabel}
              leftLabel={leftLabel}
              rightIcon={rightIcon}
              leftIcon={leftIcon}
              isTop={i === 0}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 pt-2">
        <button
          onClick={() => activeItems[0] && handleSwipeLeft(activeItems[0])}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-destructive/30 bg-card text-destructive shadow-md transition-all hover:scale-110 hover:border-destructive hover:bg-destructive/10 active:scale-95"
          aria-label={leftLabel}
        >
          {leftIcon}
        </button>
        <div className="text-xs text-muted-foreground font-medium">
          {activeItems.length} remaining
        </div>
        <button
          onClick={() => activeItems[0] && handleSwipeRight(activeItems[0])}
          className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-success/30 bg-card text-success shadow-md transition-all hover:scale-110 hover:border-success hover:bg-success/10 active:scale-95"
          aria-label={rightLabel}
        >
          {rightIcon}
        </button>
      </div>
    </div>
  );
}
