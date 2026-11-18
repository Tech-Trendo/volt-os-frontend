export default function PublicLoading() {
  return (
    <div className="w-full animate-pulse space-y-8 px-4 py-14 sm:px-6 lg:px-10 xl:px-14">
      <div className="h-8 w-64 rounded-lg bg-line" />
      <div className="h-4 w-96 rounded-lg bg-line" />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-72 rounded-2xl border border-line bg-card" />
        ))}
      </div>
    </div>
  );
}
