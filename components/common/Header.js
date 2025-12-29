import Navbar from './Navbar';
import Breadcrumb from './Breadcrumb';

/**
 * Header component that combines Navbar and Breadcrumb
 * @param {Array} breadcrumbItems - Array of breadcrumb items: [{ label: string, href?: string }]
 */
export default async function Header({ breadcrumbItems = [] }) {
  return (
    <>
      <Navbar />
      {breadcrumbItems && breadcrumbItems.length > 0 && (
        <Breadcrumb items={breadcrumbItems} />
      )}
    </>
  );
}

