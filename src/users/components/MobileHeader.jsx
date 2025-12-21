import { FiMapPin } from "react-icons/fi";

export default function MobileHeader() {
  return (
    <header
      className="
        sticky top-0 z-20
        bg-background-light dark:bg-background-dark
        border-b border-border-light dark:border-border-dark
      "
    >
      <div className="relative mx-auto max-w-4xl h-14 px-4 flex items-center">
        {/* Left */}
        <div className="flex items-center gap-1.5 text-xs text-text-subtle">
          <FiMapPin className="h-4 w-4" />
          <span className="uppercase tracking-wide">Mumbra</span>
        </div>

        {/* Center (true center) */}
        <h1 className="absolute left-1/2 -translate-x-1/2 select-none text-lg tracking-tight">
          <span className="text-primary font-extrabold">fayda</span>
          <span className="font-normal text-text-main-light dark:text-text-main-dark">
            point
          </span>
        </h1>

        {/* Right */}
        <div className="ml-auto w-10" />
      </div>
    </header>
  );
}
