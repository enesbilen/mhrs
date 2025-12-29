import Link from 'next/link';

/**
 * Breadcrumb component for showing page navigation path
 * @param {Array} items - Array of breadcrumb items: [{ label: string, href?: string }]
 */
export default function Breadcrumb({ items = [] }) {
  if (!items || items.length === 0) {
    return null;
  }

  return (
    <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-12">
          <ol className="flex items-center space-x-2 text-sm">
            {items.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <span className="mx-2 text-gray-500">/</span>
                )}
                {item.href ? (
                  <Link
                    href={item.href}
                    className="text-gray-700 hover:text-blue-600 transition-colors"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span className="text-gray-700 font-medium">{item.label}</span>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </nav>
  );
}

