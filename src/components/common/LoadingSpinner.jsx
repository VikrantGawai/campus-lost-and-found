export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = { sm: 'w-5 h-5', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={`flex items-center justify-center py-12 ${className}`}>
      <div
        className={`${sizes[size]} border-3 border-gray-200 border-t-teal-600 rounded-full animate-spin`}
        style={{ borderWidth: '3px' }}
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}
