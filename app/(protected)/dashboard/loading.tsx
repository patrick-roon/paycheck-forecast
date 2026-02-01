export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="flex gap-3">
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Controls Skeleton */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
        </div>

        {/* Recurring Expenses Skeleton */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="h-32 bg-gray-100 rounded animate-pulse"></div>
        </div>

        {/* Bill Sets Skeleton */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="h-48 bg-gray-100 rounded animate-pulse"></div>
        </div>

        {/* Paychecks Skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="h-64 bg-gray-100 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
