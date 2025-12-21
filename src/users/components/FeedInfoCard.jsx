import React from "react";

export default function FeedInfoCard({ icon, title, subtitle }) {
  return (
    <div className="w-full bg-primary/10 dark:bg-primary/20 px-6 py-5">
      <div className="mx-auto max-w-4xl flex items-start gap-4">
        <div className="text-2xl">{icon}</div>

        <div>
          <p className="text-sm font-bold text-text-main-light dark:text-white">
            {title}
          </p>
          {subtitle && (
            <p className="mt-1 text-xs text-text-subtle">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
