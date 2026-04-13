import Button from "./Button";
import Tag from "./Tag";

export type Venture = {
  tag: string;
  title: string;
  description: string;
  url?: string;
  comingSoon?: boolean;
};

export default function VentureCard({ venture }: { venture: Venture }) {
  return (
    <div
      className="flex flex-col justify-between bg-white/[0.03] border p-6 transition-colors hover:border-white/20 min-h-[260px]"
      style={{ borderColor: "rgba(255,255,255,0.1)" }}
    >
      <div className="flex flex-col gap-4">
        <Tag>{venture.tag}</Tag>
        <h3 className="text-[22px] text-white leading-tight">{venture.title}</h3>
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
  );
}
