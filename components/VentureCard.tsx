import Button from "./Button";
import Tag from "./Tag";

export type Venture = {
  tag: string;
  title: string;
  description: string;
  url?: string;
  comingSoon?: boolean;
  logo?: string;
};

export default function VentureCard({ venture }: { venture: Venture }) {
  return (
    <div
      className="flex flex-col justify-between bg-white/[0.03] border transition-colors hover:border-white/20 min-h-[380px]"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      {/* Logo slot — consistent subtle panel; each logo's baked background floats at a constrained size */}
      <div
        className="flex items-center justify-center h-36 border-b bg-white/[0.02] px-6"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        {venture.logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={venture.logo}
            alt={`${venture.title} logo`}
            className="max-h-[104px] max-w-full w-auto h-auto object-contain"
            loading="lazy"
          />
        ) : (
          <span className="font-mono text-[14px] uppercase tracking-[2px] text-white/40">
            {venture.title}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col justify-between flex-1 p-6">
        <div className="flex flex-col gap-4">
          <Tag>{venture.tag}</Tag>
          <h3 className="text-[22px] text-white leading-tight">
            {venture.title}
          </h3>
          <p className="text-[16px] leading-relaxed text-white/70">
            {venture.description}
          </p>
        </div>
        <div className="mt-6">
          {venture.comingSoon || !venture.url ? (
            <span className="font-mono text-[12px] uppercase tracking-[1px] text-white/50">
              COMING SOON
            </span>
          ) : (
            <Button variant="ghost" href={venture.url}>
              VISIT SITE
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
