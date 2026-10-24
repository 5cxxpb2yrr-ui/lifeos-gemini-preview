import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from '../port/mission-control-ui/apps/web/src/App';

createRoot(document.getElementById('root')!).render(
  <StrictMode><App /></StrictMode>,
);
