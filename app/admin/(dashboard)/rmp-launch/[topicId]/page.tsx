import RmpLaunchTopicDetail from "@/components/admin/RmpLaunchTopicDetail";

export default async function AdminRmpLaunchTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  return <RmpLaunchTopicDetail topicId={topicId} />;
}
