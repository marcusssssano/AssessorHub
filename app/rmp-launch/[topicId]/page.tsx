import PublicHeader from "@/components/PublicHeader";
import PublicRmpLaunchTopicViewer from "@/components/PublicRmpLaunchTopicViewer";

export default async function RmpLaunchTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  return (
    <div className="flex-1 flex flex-col">
      <PublicHeader active="rmp-launch" />

      <main className="flex-1 flex flex-col items-center px-6 py-16 gap-8">
        <div className="w-full" style={{ maxWidth: 900 }}>
          <PublicRmpLaunchTopicViewer topicId={topicId} />
        </div>
      </main>
    </div>
  );
}
