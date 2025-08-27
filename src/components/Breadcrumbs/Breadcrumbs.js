
import React from 'react';

const Breadcrumbs = ({ path }) => {
  const pathParts = path.substring(1).split('/').filter(Boolean);

  return (
    <nav className="breadcrumbs">
      <a href="#">Home</a>
      {pathParts.map((part, index) => {
        const href = `#${pathParts.slice(0, index + 1).join('/')}`;
        return (
          <React.Fragment key={href}>
            <span> / </span>
            <a href={href}>{decodeURIComponent(part)}</a>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default Breadcrumbs;
