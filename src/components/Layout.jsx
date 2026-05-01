import { Navigation } from './Navigation.jsx';

export const Layout = ({ children }) => (
  <>
    <Navigation />
    {children}
  </>
);
