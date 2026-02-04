/**
 * ClusterPlot: placeholder for GET /analytics/{id}/cluster (embedding+label).
 */
export function ClusterPlot({ embedding, labels }: { embedding: number[][]; labels: string[] }) {
  return (
    <div className="chart cluster">
      <div className="chart-title">Cluster</div>
      <div className="chart-placeholder">{embedding.length} points</div>
    </div>
  )
}
